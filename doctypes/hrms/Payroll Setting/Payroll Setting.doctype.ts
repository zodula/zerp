export default $doctype({
    base_earning_component: {
        type: "Reference",
        label: "Base Earning Component",
        reference: "zerp__Salary Component",
        required: 0,
        in_list_view: 1,
        description: "Default base salary component used for earnings (e.g. Basic).",
    },
    base_deducts_component: {
        type: "Reference",
        label: "Base Deduction Component",
        reference: "zerp__Salary Component",
        required: 0,
        in_list_view: 1,
        description: "Default base component used for deductions.",
    },
    monthly_divider: {
        type: "Float",
        label: "Monthly Divider (Days)",
        default: "30",
        required: 1,
        in_list_view: 1,
        description: "Number of days used to compute daily salary (e.g. base_monthly_salary / monthly_divider).",
    },
}, {
    label: "Payroll Setting",
    naming_series: "PRSET-",
    search_fields: "base_earning_component\nbase_deducts_component",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Base Components", align: "left" },
                [
                    { type: "field", value: "base_earning_component", align: "left" },
                    { type: "field", value: "base_deducts_component", align: "left" },
                ],
                { type: "section", value: "Defaults", align: "left" },
                [
                    { type: "field", value: "monthly_divider", align: "left" },
                ],
            ],
        },
    ]),
});
