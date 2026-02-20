export default $doctype<"Salary Slip">({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        in_list_view: 1,
    },
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        in_list_view: 1,
    },
    start_date: {
        type: "Date",
        label: "Start Date",
        required: 1,
        in_list_view: 1,
    },
    end_date: {
        type: "Date",
        label: "End Date",
        required: 1,
        in_list_view: 1,
    },
    total_earning: {
        type: "Float",
        label: "Total Earning",
        default: "0",
        readonly: 1,
        in_list_view: 1,
    },
    total_deduction: {
        type: "Float",
        label: "Total Deduction",
        default: "0",
        readonly: 1,
        in_list_view: 1,
    },
    net_pay: {
        type: "Float",
        label: "Net Pay",
        default: "0",
        readonly: 1,
        in_list_view: 1,
    },
    salary_slip_items: {
        type: "Reference Table",
        label: "Salary Slip Items",
        reference: "Salary Slip Item",
        required: 0,
    },
}, {
    label: "Salary Slip",
    naming_series: "SS-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "employee",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Employee & Period", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "start_date", align: "left" },
                    { type: "field", value: "end_date", align: "left" },
                ],
                { type: "section", value: "Salary Slip Items", align: "left" },
                [
                    { type: "field", value: "salary_slip_items", align: "left" },
                ],
                { type: "section", value: "Totals", align: "left" },
                [
                    { type: "field", value: "total_earning", align: "left" },
                    { type: "field", value: "total_deduction", align: "left" },
                    { type: "field", value: "net_pay", align: "left" },
                ],
            ],
        },
    ]),
});
