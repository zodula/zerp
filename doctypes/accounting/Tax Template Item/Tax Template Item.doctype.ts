export default $doctype({
    tax_template: {
        type: "Reference",
        label: "Tax Template",
        reference: "Tax Template",
        required: 1
    },
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
        filters: JSON.stringify([["is_tax_account", "=", 1]]),
        required: 1,
        in_list_view: 1
    },
    description: {
        type: "Text",
        label: "Description",
        required: 0,
        in_list_view: 1
    },
    tax_type: {
        type: "Select",
        label: "Tax Type",
        options: "Included\nExcluded",
        required: 1,
        in_list_view: 1,
        default: "Excluded"
    },
    rate: {
        type: "Float",
        label: "Rate (%)",
        required: 0,
        in_list_view: 1
    },
    row_id: {
        type: "Text",
        label: "Row ID",
        required: 0
    },
    included_in_print_rate: {
        type: "Check",
        label: "Included in Print Rate",
        default: "0"
    }
}, {
    label: "Tax Template Item",
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
                    { type: "field", value: "rate", align: "left" }
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

