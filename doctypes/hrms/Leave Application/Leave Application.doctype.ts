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
        fetch_from: "employee.name",
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
        options: "Open\nApproved\nRejected\nCancelled",
        default: "Open",
        in_list_view: 1,
        allow_on_submit: 1,
    },
}, {
    label: "Leave Application",
    naming_series: "LEAVE-{{organization_abbr}}-{YYYY}-{#####}",
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
                    { type: "field", value: "status", align: "left" },
                ],
                { type: "section", value: "Leave Details", align: "left" },
                [
                    { type: "field", value: "from_date", align: "left" },
                    { type: "field", value: "to_date", align: "left" },
                    { type: "field", value: "total_leave_days", align: "left" },
                ],
                { type: "section", value: "Reason", align: "left" },
                [
                    { type: "field", value: "reason", align: "left" },
                ],
            ],
        },
    ]),
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
    await $zodula.doctype("Leave Application").update(doc.id, { status: "Approved" } as any);
})
.on("after_cancel", async ({ doc }) => {
    await $zodula.doctype("Leave Application").update(doc.id, { status: "Cancelled" } as any);
});
