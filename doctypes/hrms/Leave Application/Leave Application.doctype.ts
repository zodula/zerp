export default $doctype<"Leave Application">({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        in_list_view: 1,
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
        in_list_view: 1,
        fetch_from: "employee.full_name",
    },
    leave_type: {
        type: "Reference",
        label: "Leave Type",
        reference: "Leave Type",
        required: 1,
        in_list_view: 1,
    },
    from_date: {
        type: "Date",
        label: "From Date",
        required: 1,
        in_list_view: 1,
    },
    to_date: {
        type: "Date",
        label: "To Date",
        required: 1,
        in_list_view: 1,
    },
    total_leave_days: {
        type: "Float",
        label: "Total Leave Days",
        readonly: 1,
        in_list_view: 1,
    },
    reason: {
        type: "Text",
        label: "Reason",
    },
    status: {
        type: "Select",
        label: "Status",
        options: "Open\nApproved\nRejected",
        default: "Open",
        in_list_view: 1,
    },
    approver: {
        type: "Reference",
        label: "Approver",
        reference: "User",
        required: 0,
        readonly: 1,
    },
}, {
    label: "Leave Application",
    naming_series: "LEAVE-{YYYY}-{#####}",
    search_fields: "employee\nemployee_name\nleave_type",
    is_submittable: 1,
    track_changes: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Application", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "employee_name", align: "left" },
                    { type: "field", value: "leave_type", align: "left" },
                ],
                { type: "section", value: "Leave Details", align: "left" },
                [
                    { type: "field", value: "from_date", align: "left" },
                    { type: "field", value: "to_date", align: "left" },
                    { type: "field", value: "total_leave_days", align: "left" },
                ],
                { type: "section", value: "Workflow", align: "left" },
                [
                    { type: "field", value: "status", align: "left" },
                    { type: "field", value: "approver", align: "left" },
                ],
                { type: "section", value: "Reason", align: "left" },
                [
                    { type: "field", value: "reason", align: "left" },
                ],
            ],
        },
    ]),
})
.on("before_save", async ({ doc, old }) => {
    const employee_doc = await $zodula.doctype("Employee").get(doc.employee);
    doc.approver = employee_doc.attendance_approver;
    doc.employee_name = employee_doc.full_name;

    const approver_id = (await ($zodula.session.user())).id;
    if (doc?.status !== old?.status && doc?.status === "Approved" && doc.approver !== approver_id) {
        throw new Error("You are not authorized to approve this leave application");
    }
})
.on("before_change", async ({ doc }) => {
    const fromDate = doc.from_date as string | undefined | null;
    const toDate = doc.to_date as string | undefined | null;
    if (fromDate && toDate) {
        const from = $zodula.utils.parseDate(fromDate);
        const to = $zodula.utils.parseDate(toDate);
        if (from && to) {
            const diffTime = to.getTime() - from.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            doc.total_leave_days = Math.max(0, diffDays);
        }
    }
})
.on("after_submit", async ({ doc }) => {
    if (doc.status === "Approved") {
        await syncAttendanceFromLeaveApplication(doc as unknown as Record<string, unknown>);
        await recalculateLeaveAllocationFromLeaveApplication(doc as unknown as Record<string, unknown>);
    }
})
.on("after_cancel", async ({ doc }) => {
    await deleteAttendanceForLeaveApplication(doc as unknown as Record<string, unknown>);
    await recalculateLeaveAllocationFromLeaveApplication(doc as unknown as Record<string, unknown>);
    // When a document is cancelled, mark it Rejected (since "Cancelled" is not a status option).
    await $zodula.doctype("Leave Application").update(doc.id, { status: "Rejected" } as any);
});

/** Normalize date string to yyyy-MM-dd for consistent comparison and queries */
function normalizeDateString(dateValue: string | undefined | null): string | null {
    if (dateValue == null || dateValue === "") return null;
    const parsed = $zodula.utils.parseDate(String(dateValue));
    if (!parsed) return null;
    return $zodula.utils.format(parsed, "date");
}

async function getLeaveTypeFromAttendance(att: Record<string, unknown>): Promise<string | null> {
    let leaveTypeId: string | null = (att.leave_type as string | undefined | null) || null;
    if (!leaveTypeId) {
        const leaveAppId = att.leave_application as string | undefined | null;
        if (leaveAppId) {
            const leaveApp = await $zodula.doctype("Leave Application").get(leaveAppId);
            if (leaveApp?.leave_type) leaveTypeId = leaveApp.leave_type as string;
        }
    }
    return leaveTypeId;
}

async function findLeavePeriodsOverlappingRange(
    fromDateRaw: string,
    toDateRaw: string
): Promise<Array<{ id: string; from_date: string; to_date: string }>> {
    const fromDate = normalizeDateString(fromDateRaw);
    const toDate = normalizeDateString(toDateRaw);
    if (!fromDate || !toDate) return [];

    const { docs: periods } = await $zodula.doctype("Leave Period").select();
    if (!periods?.length) return [];

    const overlapping: Array<{ id: string; from_date: string; to_date: string }> = [];
    for (const p of periods) {
        const row = p as { id: string; from_date: string; to_date: string };
        const periodFrom = normalizeDateString(row.from_date) ?? row.from_date;
        const periodTo = normalizeDateString(row.to_date) ?? row.to_date;

        // Include leave periods that overlap with the leave application's date range
        if (fromDate <= periodTo && toDate >= periodFrom) {
            overlapping.push({ id: row.id, from_date: periodFrom, to_date: periodTo });
        }
    }

    return overlapping;
}

async function calculateLeavesTakenInPeriod(
    employeeId: string,
    leaveTypeId: string,
    fromDate: string,
    toDate: string
): Promise<number> {
    const { docs: attendances } = await $zodula.doctype("Attendance")
        .select()
        .where("employee", "=", employeeId)
        .where("attendance_date", ">=", fromDate)
        .where("attendance_date", "<=", toDate);

    let total = 0;
    for (const att of attendances || []) {
        const a = att as unknown as Record<string, unknown>;
        const attDate = normalizeDateString(a.attendance_date as string | undefined | null);
        if (!attDate || attDate < fromDate || attDate > toDate) continue;

        const status = a.status as string | undefined | null;
        if (status !== "On Leave") continue;

        const attLeaveType = await getLeaveTypeFromAttendance(a);
        if (attLeaveType !== leaveTypeId) continue;

        total += a.is_half_day ? 0.5 : 1;
    }

    return total;
}

async function recalculateLeaveAllocationFromLeaveApplication(
    leaveApplicationDoc: Record<string, unknown>
) {
    const employeeId = leaveApplicationDoc.employee as string | undefined | null;
    const leaveTypeId = leaveApplicationDoc.leave_type as string | undefined | null;
    const fromDateRaw = leaveApplicationDoc.from_date as string | undefined | null;
    const toDateRaw = leaveApplicationDoc.to_date as string | undefined | null;

    if (!employeeId || !leaveTypeId || !fromDateRaw || !toDateRaw) return;

    const periods = await findLeavePeriodsOverlappingRange(fromDateRaw, toDateRaw);
    if (!periods.length) return;

    for (const period of periods) {
        const leavesTaken = await calculateLeavesTakenInPeriod(
            employeeId,
            leaveTypeId,
            period.from_date,
            period.to_date
        );

        const { docs: allocations } = await $zodula.doctype("Leave Allocation")
            .select()
            .where("employee", "=", employeeId)
            .where("leave_type", "=", leaveTypeId)
            .where("leave_period", "=", period.id)
            .where("doc_status", "=", "Submitted");

        if (!allocations?.length) continue;

        await $zodula.doctype("Leave Allocation").update((allocations[0] as { id: string }).id, {
            leaves_taken: leavesTaken,
        } as any);
    }
}

function listDateStringsInRange(fromDateRaw: string, toDateRaw: string): string[] {
    const fromDate = $zodula.utils.parseDate(fromDateRaw);
    const toDate = $zodula.utils.parseDate(toDateRaw);
    if (!fromDate || !toDate || fromDate > toDate) return [];

    const dates: string[] = [];
    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
        dates.push($zodula.utils.format(cursor, "date"));
        cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
}

async function ensureAttendanceForApprovedLeaveApplication(leaveApplicationDoc: Record<string, unknown>) {
    const leaveApplicationId = leaveApplicationDoc.id as string | undefined | null;
    const employeeId = leaveApplicationDoc.employee as string | undefined | null;
    const leaveTypeId = leaveApplicationDoc.leave_type as string | undefined | null;
    const fromDateRaw = leaveApplicationDoc.from_date as string | undefined | null;
    const toDateRaw = leaveApplicationDoc.to_date as string | undefined | null;
    const status = leaveApplicationDoc.status as string | undefined | null;

    if (!leaveApplicationId || !employeeId || !leaveTypeId || !fromDateRaw || !toDateRaw) return;
    if (status !== "Approved") return;

    const leaveTypeDoc = await $zodula.doctype("Leave Type").get(leaveTypeId);
    const isLeaveWithoutPay = !!leaveTypeDoc?.is_leave_without_pay;

    const dateStrings = listDateStringsInRange(fromDateRaw, toDateRaw);
    for (const attendanceDate of dateStrings) {
        const { docs } = await $zodula.doctype("Attendance")
            .select()
            .where("employee", "=", employeeId)
            .where("attendance_date", "=", attendanceDate);

        const payload = {
            employee: employeeId,
            attendance_date: attendanceDate,
            status: "On Leave",
            leave_type: leaveTypeId,
            leave_application: leaveApplicationId,
            is_leave_without_pay: isLeaveWithoutPay ? 1 : 0,
        };

        if (docs?.length) {
            await $zodula.doctype("Attendance").update((docs[0] as { id: string }).id, payload as any);
        } else {
            await $zodula.doctype("Attendance").insert(payload as any);
        }
    }
}

async function deleteAttendanceForLeaveApplication(leaveApplicationDoc: Record<string, unknown>) {
    const leaveApplicationId = leaveApplicationDoc.id as string | undefined | null;
    if (!leaveApplicationId) return;

    const { docs } = await $zodula.doctype("Attendance")
        .select()
        .where("leave_application", "=", leaveApplicationId);

    for (const attendance of docs || []) {
        await $zodula.doctype("Attendance").delete((attendance as { id: string }).id);
    }
}

async function syncAttendanceFromLeaveApplication(leaveApplicationDoc: Record<string, unknown>) {
    if ((leaveApplicationDoc.status as string | undefined | null) === "Approved") {
        await ensureAttendanceForApprovedLeaveApplication(leaveApplicationDoc);
        return;
    }

    await deleteAttendanceForLeaveApplication(leaveApplicationDoc);
}
