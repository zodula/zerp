export default $doctype({
    name: {
        type: "Text",
        label: "Salary Component Name",
        required: 1,
        in_list_view: 1,
    },
    type: {
        type: "Select",
        label: "Type",
        options: "Earning\nDeduction",
        required: 1,
        in_list_view: 1,
    },
    base_on_daily_salary: {
        type: "Check",
        label: "Base on Daily Salary",
        default: "0",
        description: "For components like Overtime: daily = base_monthly_salary / monthly_divider, then amount = daily * multiplier * value (e.g. hours)",
    },
}, {
    label: "Salary Component",
    naming_series: "{{name}}",
    search_fields: "name\ntype",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Salary Component", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "type", align: "left" },
                    { type: "field", value: "base_on_daily_salary", align: "left" },
                ],
            ],
        },
    ]),
});
