export default $doctype({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        in_list_view: 1,
    },
    salary_component: {
        type: "Reference",
        label: "Salary Component",
        reference: "Salary Component",
        required: 1,
        in_list_view: 1,
    },
    base_on_daily_salary: {
        type: "Check",
        label: "Base on Daily Salary",
        default: "0",
        description: "Amount = (employee base_monthly_salary / monthly_divider) * base_on_multiplier * base_on_value (e.g. hours).",
    },
    base_on_multiplier: {
        type: "Float",
        label: "Base on Multiplier",
        default: "1",
        in_list_view: 1,
        description: "E.g. 1.5 for time-and-a-half overtime.",
    },
    base_on_value: {
        type: "Float",
        label: "Base on Value",
        default: "0",
        in_list_view: 1,
        description: "E.g. number of hours (2) for overtime.",
    },
    amount: {
        type: "Float",
        label: "Amount",
        default: "0",
        in_list_view: 1,
        description: "Fixed amount when not using daily salary formula.",
    },
    is_recurring: {
        type: "Check",
        label: "Is Recurring",
        default: "0",
        in_list_view: 1,
    },
    recurring_until: {
        type: "Date",
        label: "Recurring Until",
        required: 0,
        in_list_view: 1,
    },
}, {
    label: "Additional Salary",
    naming_series: "ADSAL-{#####}",
    search_fields: "employee\nsalary_component",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Assignment", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "salary_component", align: "left" },
                ],
                { type: "section", value: "Amount (daily salary formula)", align: "left" },
                [
                    { type: "field", value: "base_on_daily_salary", align: "left" },
                    { type: "field", value: "base_on_multiplier", align: "left" },
                    { type: "field", value: "base_on_value", align: "left" },
                ],
                { type: "section", value: "Fixed Amount", align: "left" },
                [
                    { type: "field", value: "amount", align: "left" },
                ],
                { type: "section", value: "Recurring", align: "left" },
                [
                    { type: "field", value: "is_recurring", align: "left" },
                    { type: "field", value: "recurring_until", align: "left" },
                ],
            ],
        },
    ]),
});
