export default $doctype({
    salary_slip: {
        type: "Reference",
        label: "Salary Slip",
        reference: "zerp__Salary Slip",
        required: 1,
        in_list_view: 1,
    },
    salary_component: {
        type: "Reference",
        label: "Salary Component",
        reference: "zerp__Salary Component",
        required: 1,
        in_list_view: 1,
    },
    amount: {
        type: "Float",
        label: "Amount",
        default: "0",
        required: 1,
        in_list_view: 1,
    },
}, {
    label: "Salary Slip Item",
    is_child_doctype: 1,
    search_fields: "salary_component",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Reference", align: "left" },
                [
                    { type: "field", value: "salary_slip", align: "left" },
                    { type: "field", value: "salary_component", align: "left" },
                ],
                { type: "section", value: "Amount", align: "left" },
                [
                    { type: "field", value: "amount", align: "left" },
                ],
            ],
        },
    ]),
});
