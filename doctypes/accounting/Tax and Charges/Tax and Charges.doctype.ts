export default $doctype({
    charge_type: {
        type: "Select",
        label: "Charge Type",
        options: "Actual\nOn Net Total\nOn Previous Row Amount\nOn Previous Row Total",
        required: 1,
        in_list_view: 1,
        default: "Actual"
    },
    account_head: {
        type: "Reference",
        label: "Account Head",
        reference: "Account",
        filters: JSON.stringify([["account_type", "IN", ["Tax", "Chargable"]], ["is_group", "!=", 1]]),
        required: 1,
        in_list_view: 1
    },
    tax_type: {
        type: "Select",
        label: "Tax Type",
        options: "Included\nExcluded\nExcluded Subtract",
        required: 1,
        in_list_view: 1,
        default: "Excluded"
    },
    rate: {
        type: "Float",
        label: "Rate",
        required: 0,
        in_list_view: 1
    },
    tax_amount: {
        type: "Currency",
        label: "Tax Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    total: {
        type: "Currency",
        label: "Total",
        required: 0,
        readonly: 1,
        in_list_view: 1,
        description: "Running total after this row (for On Previous Row Total)."
    },
}, {
    label: "Tax and Charges",
    is_child_doctype: 1,
    search_fields: "description\naccount_head",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Tax Information", align: "left" },
                [
                    { type: "field", value: "charge_type", align: "left" },
                    { type: "field", value: "account_head", align: "left" },
                    { type: "field", value: "description", align: "left" },
                    { type: "field", value: "tax_type", align: "left" }
                ],
                { type: "section", value: "Amount", align: "left" },
                [
                    { type: "field", value: "rate", align: "left" },
                    { type: "field", value: "tax_amount", align: "left" },
                    { type: "field", value: "total", align: "left" }
                ],
                { type: "section", value: "Advanced", align: "left" },
                [
                    { type: "field", value: "row_id", align: "left" },
                    { type: "field", value: "included_in_print_rate", align: "left" }
                ]
            ]
        }
    ])
})

