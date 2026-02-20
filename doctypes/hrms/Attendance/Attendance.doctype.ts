export default $doctype<"Attendance">({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        in_list_view: 1,
        only_once: 1,
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
        in_list_view: 1,
        fetch_from: "employee.name",
        only_once: 1,
    },
    attendance_date: {
        type: "Date",
        label: "Attendance Date",
        required: 1,
        in_list_view: 1,
        only_once: 1,
    },
    status: {
        type: "Select",
        label: "Status",
        options: "Present\nAbsent\nOn Leave\nHalf Day",
        required: 1,
        in_list_view: 1,
        only_once: 1,
    },
    leave_type: {
        type: "Reference",
        label: "Leave Type",
        reference: "Leave Type",
        required: 0,
        depends_on: "doc.status === 'On Leave'",
        only_once: 1,
    },
    check_in: {
        type: "Time",
        label: "Check In",
        only_once: 1,
    },
    check_out: {
        type: "Time",
        label: "Check Out",
        only_once: 1,
    },
    working_hours: {
        type: "Float",
        label: "Working Hours",
        readonly: 1,
        only_once: 1,
    },
    leave_application: {
        type: "Reference",
        label: "Leave Application",
        reference: "Leave Application",
        required: 0,
        depends_on: "doc.status === 'On Leave'",
        only_once: 1,
    },
    force_attendance: {
        type: "Check",
        label: "Force Attendance",
        default: "0",
        depends_on: "doc.status === 'On Leave'",
        only_once: 1,
    },
}, {
    label: "Attendance",
    naming_series: "ATT-{{employee}}-{{attendance_date}}",
    search_fields: "employee\nemployee_name",
    track_changes: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Attendance", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "employee_name", align: "left" },
                    { type: "field", value: "attendance_date", align: "left" },
                    { type: "field", value: "status", align: "left" },
                ],
                { type: "section", value: "Time", align: "left" },
                [
                    { type: "field", value: "check_in", align: "left" },
                    { type: "field", value: "check_out", align: "left" },
                    { type: "field", value: "working_hours", align: "left" },
                ],
                { type: "section", value: "Leave", align: "left" },
                [
                    { type: "field", value: "leave_type", align: "left" },
                    { type: "field", value: "leave_application", align: "left" },
                    { type: "field", value: "force_attendance", align: "left" },
                ],
            ],
        },
    ]),
})
.on("before_change", async ({ doc, old }) => {
    await validateLeaveBalance(
        doc as unknown as Record<string, unknown>,
        old as unknown as Record<string, unknown> | undefined
    );
})
.on("after_insert", async ({ doc }) => {
    await recalculateLeaveAllocationFromAttendance(doc as unknown as Record<string, unknown>);
})
.on("after_change", async ({ doc }) => {
    await recalculateLeaveAllocationFromAttendance(doc as unknown as Record<string, unknown>);
})
.on("after_delete", async ({ doc }) => {
    await recalculateLeaveAllocationFromAttendance(doc as unknown as Record<string, unknown>);
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

/** Get leave period that contains the given attendance date (dates normalized to yyyy-MM-dd) */
async function findLeavePeriodContainingDate(attendanceDateRaw: string): Promise<{ id: string; from_date: string; to_date: string } | null> {
    const attendanceDate = normalizeDateString(attendanceDateRaw);
    if (!attendanceDate) return null;

    const { docs: periods } = await $zodula.doctype("Leave Period").select();
    if (!periods?.length) return null;

    for (const p of periods) {
        const row = p as { id: string; from_date: string; to_date: string };
        const fromDate = normalizeDateString(row.from_date) ?? row.from_date;
        const toDate = normalizeDateString(row.to_date) ?? row.to_date;
        if (attendanceDate >= fromDate && attendanceDate <= toDate) {
            return { id: row.id, from_date: fromDate, to_date: toDate };
        }
    }
    return null;
}

async function calculateLeavesTakenInPeriod(
    employeeId: string,
    leaveTypeId: string,
    fromDate: string,
    toDate: string,
    excludeAttendanceId?: string
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
        if (excludeAttendanceId && a.id === excludeAttendanceId) continue;
        const status = a.status as string | undefined | null;
        if (status !== "On Leave" && status !== "Half Day") continue;
        const attLeaveType = await getLeaveTypeFromAttendance(a);
        if (attLeaveType !== leaveTypeId) continue;
        total += status === "Half Day" ? 0.5 : 1;
    }
    return total;
}

async function recalculateLeaveAllocationFromAttendance(attendanceDoc: Record<string, unknown>) {
    const employeeId = attendanceDoc.employee as string | undefined | null;
    const attendanceDateRaw = attendanceDoc.attendance_date as string | undefined | null;
    if (!employeeId || !attendanceDateRaw) return;

    const attendanceDate = normalizeDateString(attendanceDateRaw);
    if (!attendanceDate) return;

    const leaveTypeId = await getLeaveTypeFromAttendance(attendanceDoc);
    if (!leaveTypeId) return;

    const period = await findLeavePeriodContainingDate(attendanceDate);
    if (!period) return;

    const { docs: allocations } = await $zodula.doctype("Leave Allocation")
        .select()
        .where("employee", "=", employeeId)
        .where("leave_type", "=", leaveTypeId)
        .where("leave_period", "=", period.id);

    if (!allocations?.length) return;

    const leavesTaken = await calculateLeavesTakenInPeriod(
        employeeId,
        leaveTypeId,
        period.from_date,
        period.to_date
    );

    await $zodula.doctype("Leave Allocation").update((allocations[0] as { id: string }).id, {
        leaves_taken: leavesTaken,
    } as any);
}

async function validateLeaveBalance(
    doc: Record<string, unknown>,
    old: Record<string, unknown> | undefined
) {
    if (doc.force_attendance) return;
    const status = doc.status as string | undefined | null;
    if (status !== "On Leave" && status !== "Half Day") return;

    const employeeId = doc.employee as string | undefined | null;
    const attendanceDateRaw = doc.attendance_date as string | undefined | null;
    if (!employeeId || !attendanceDateRaw) return;

    const attendanceDate = normalizeDateString(attendanceDateRaw);
    if (!attendanceDate) return;

    const leaveTypeId = await getLeaveTypeFromAttendance(doc);
    if (!leaveTypeId) return;

    const period = await findLeavePeriodContainingDate(attendanceDate);
    if (!period) {
        throw new Error(
            "No Leave Period found that contains this attendance date. Create a Leave Period covering this date, or check Force Attendance to override."
        );
    }

    const { docs: allocations } = await $zodula.doctype("Leave Allocation")
        .select()
        .where("employee", "=", employeeId)
        .where("leave_type", "=", leaveTypeId)
        .where("leave_period", "=", period.id);

    if (!allocations?.length) {
        throw new Error(
            "No leave allocation found for this employee, leave type and period. Create a Leave Allocation, or check Force Attendance to override."
        );
    }

    const allocation = allocations[0] as {
        id: string;
        total_leaves_allowed?: number | string | null;
    };
    const totalAllowed = parseFloat(String(allocation.total_leaves_allowed ?? 0)) || 0;

    const excludeId = (old as { id?: string } | undefined)?.id;
    const leavesTaken = await calculateLeavesTakenInPeriod(
        employeeId,
        leaveTypeId,
        period.from_date,
        period.to_date,
        excludeId
    );

    const oldDays =
        !old ? 0 : (old.status === "On Leave" ? 1 : old.status === "Half Day" ? 0.5 : 0);
    const newDays = status === "On Leave" ? 1 : 0.5;
    const effectiveTaken = leavesTaken - oldDays + newDays;

    if (effectiveTaken >= totalAllowed) {
        throw new Error(
            `Leave balance exceeded. Allowed: ${totalAllowed}, would be taken: ${effectiveTaken}. Check "Force Attendance" to override.`
        );
    }
}
