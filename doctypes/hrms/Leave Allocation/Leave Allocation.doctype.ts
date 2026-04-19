export default $doctype({
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        in_list_view: 1,
        default: "TODAY()",
        group: "group1"
    },
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        in_list_view: 1,
        unique: 1,
        fetch_from: "employee.full_name",
        group: "group1"
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
        unique: 1,
        group: "group1"
    },
    leave_period: {
        type: "Reference",
        label: "Leave Period",
        reference: "Leave Period",
        required: 1,
        in_list_view: 1,
        unique: 1,
        group: "group1"
    },
    total_leaves_allowed: {
        type: "Float",
        label: "Total Leaves Allowed",
        required: 1,
        in_list_view: 1,
    },
    leaves_taken: {
        type: "Float",
        label: "Leaves Taken",
        default: "0",
        in_list_view: 1,
        readonly: 1,
    },
}, {
    label: "Leave Allocation",
    naming_series: "LA-{{employee}}-{{leave_type}}-{{leave_period}}",
    search_fields: "employee\nemployee_name\nleave_type",
    is_submittable: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Employee", align: "left" },
                [
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "employee_name", align: "left" },
                ],
                { type: "section", value: "Leave Allocation", align: "left" },
                [
                    { type: "field", value: "leave_type", align: "left" },
                    { type: "field", value: "leave_period", align: "left" },
                ],
                { type: "section", value: "Leave Balance", align: "left" },
                [
                    { type: "field", value: "total_leaves_allowed", align: "left" },
                    { type: "field", value: "leaves_taken", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_save", async ({ doc }) => {
        (doc as any).leaves_taken = await calculateLeavesTakenForAllocation(doc as any);
    })
    .on("before_submit", async ({ doc }) => {
        (doc as any).leaves_taken = await calculateLeavesTakenForAllocation(doc as any);
    });

function normalizeDateString(dateValue: string | undefined | null): string | null {
    if (dateValue == null || dateValue === "") return null;
    const parsed = $zodula.utils.parseDate(String(dateValue));
    if (!parsed) return null;
    return $zodula.utils.format(parsed, "date");
}

function calculateOverlapDays(
    fromA: string,
    toA: string,
    fromB: string,
    toB: string
) {
    const start = fromA > fromB ? fromA : fromB;
    const end = toA < toB ? toA : toB;
    if (start > end) return 0;
    const startDate = $zodula.utils.parseDate(start);
    const endDate = $zodula.utils.parseDate(end);
    if (!startDate || !endDate) return 0;
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

async function calculateLeavesTakenForAllocation(doc: {
    employee?: string;
    leave_type?: string;
    leave_period?: string;
}) {
    const employeeId = String(doc.employee ?? "").trim();
    const leaveTypeId = String(doc.leave_type ?? "").trim();
    const leavePeriodId = String(doc.leave_period ?? "").trim();
    if (!employeeId || !leaveTypeId || !leavePeriodId) return 0;

    const leavePeriod = await $zodula.doctype("Leave Period").get(leavePeriodId);
    if (!leavePeriod) return 0;
    const periodFrom = normalizeDateString((leavePeriod as any).from_date);
    const periodTo = normalizeDateString((leavePeriod as any).to_date);
    if (!periodFrom || !periodTo) return 0;

    const { docs: apps } = await $zodula.doctype("Leave Application")
        .select()
        .where("employee", "=", employeeId)
        .where("leave_type", "=", leaveTypeId)
        .where("status", "=", "Approved")
        .where("doc_status", "=", "Submitted");

    let total = 0;
    for (const app of apps ?? []) {
        const appFrom = normalizeDateString((app as any).from_date);
        const appTo = normalizeDateString((app as any).to_date);
        if (!appFrom || !appTo) continue;
        total += calculateOverlapDays(periodFrom, periodTo, appFrom, appTo);
    }
    return total;
}
