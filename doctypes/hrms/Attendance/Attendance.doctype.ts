export default $doctype<"Attendance">({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        is_quick_filter: 1,
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
        in_list_view: 1,
        is_quick_filter: 1,
    },
    attendance_date: {
        type: "Date",
        label: "Attendance Date",
        required: 1,
        in_list_view: 1,
        is_quick_filter: 1,
    },
    status: {
        type: "Select",
        label: "Status",
        options: "Present\nAbsent\nOn Leave",
        required: 1,
        in_list_view: 1,
        is_quick_filter: 1,
    },
    leave_type: {
        type: "Reference",
        label: "Leave Type",
        reference: "Leave Type",
        required: 0,
        depends_on: "doc.status === 'On Leave'",
        is_quick_filter: 1,
    },
    is_late_entry: {
        type: "Check",
        label: "Is Late Entry",
        default: "0",
    },
    is_early_exit: {
        type: "Check",
        label: "Is Early Exit",
        default: "0",
    },
    is_half_day: {
        type: "Check",
        label: "Is Half Day",
        default: "0",
        in_list_view: 1,
    },
    is_leave_without_pay: {
        type: "Check",
        label: "Is Leave Without Pay",
        readonly: 1,
        depends_on: "doc.status === 'On Leave'",
    },
    leave_application: {
        type: "Reference",
        label: "Leave Application",
        reference: "Leave Application",
        required: 0,
        readonly: 1,
        depends_on: "!!doc.leave_application",
    },
}, {
    label: "Attendance",
    naming_series: "ATT-{{attendance_date}}-{{employee}}",
    display_field: "employee_name",
    search_fields: "employee\nattendance_date",
    is_submittable: 0,
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
                    { type: "field", value: "is_late_entry", align: "left" },
                    { type: "field", value: "is_early_exit", align: "left" },
                    { type: "field", value: "is_half_day", align: "left" },
                ],
                { type: "section", value: "Leave", align: "left" },
                [
                    { type: "field", value: "leave_type", align: "left" },
                    { type: "field", value: "leave_application", align: "left" },
                    { type: "field", value: "is_leave_without_pay", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_change", async ({ doc, old }) => {
        if (doc.leave_type) {
            const leave_type_doc = await $zodula.doctype("Leave Type").get(doc.leave_type);
            if (!!leave_type_doc?.is_leave_without_pay) {
                doc.is_leave_without_pay = 1;
            }
        }
        const employee_doc = await $zodula.doctype("Employee").get(doc.employee);
        doc.employee_name = employee_doc.full_name ?? '';
        await validateLeaveBalance(
            doc as unknown as Record<string, unknown>,
            old as unknown as Record<string, unknown> | undefined
        );
    })
    ;

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
        if (status !== "On Leave") continue;
        const attLeaveType = await getLeaveTypeFromAttendance(a);
        if (attLeaveType !== leaveTypeId) continue;
        total += a.is_half_day ? 0.5 : 1;
    }
    return total;
}

async function validateLeaveBalance(
    doc: Record<string, unknown>,
    old: Record<string, unknown> | undefined
) {
    const status = doc.status as string | undefined | null;
    if (status !== "On Leave") return;

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
            "No Leave Period found that contains this attendance date. Create a Leave Period covering this date."
        );
    }

    const { docs: allocations } = await $zodula.doctype("Leave Allocation")
        .select()
        .where("employee", "=", employeeId)
        .where("leave_type", "=", leaveTypeId)
        .where("leave_period", "=", period.id)
        .where("doc_status", "=", "Submitted");

    if (!allocations?.length) {
        throw new Error(
            "No leave allocation found for this employee, leave type and period. Create a Leave Allocation."
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
        !old ? 0 : (old.status === "On Leave" ? 1 : old.is_half_day ? 0.5 : 0);
    const newDays = status === "On Leave" ? 1 : doc.is_half_day ? 0.5 : 0;
    const effectiveTaken = leavesTaken - oldDays + newDays;

    if (effectiveTaken >= totalAllowed) {
        throw new Error(
            `Leave balance exceeded. Allowed: ${totalAllowed}, would be taken: ${effectiveTaken}.`
        );
    }
}
