export default $doctype({
    journal_entry: {
        type: "Reference",
        label: "Journal Entry",
        reference: "zerp__Journal Entry",
        required: 1,
        in_list_view: 1
    },
    account: {
        type: "Reference",
        label: "Account",
        reference: "zerp__Account",
        required: 1,
        in_list_view: 1
    },
    memo: {
        type: "Text",
        label: "Memo",
        in_list_view: 1
    },
    party_type: {
        type: "Reference",
        label: "Party Type",
        reference: "zodula__Doctype",
        filters: JSON.stringify([["name", "IN", ["zerp__Customer", "zerp__Supplier"]]]),
        in_list_view: 1
    },
    party: {
        type: "Reference",
        label: "Party",
        reference: "{{party_type}}",
        in_list_view: 1
    },
    debit_amount: {
        type: "Float",
        label: "Debit Amount",
        default: "0",
        in_list_view: 1
    },
    credit_amount: {
        type: "Float",
        label: "Credit Amount",
        default: "0",
        in_list_view: 1
    }
}, {
    label: "Journal Entry Item",
    is_child_doctype: 1,
    search_fields: "account\nmemo",
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Reference", align: "left" },
                [
                    { type: "field", value: "journal_entry", align: "left" },
                    { type: "field", value: "account", align: "left" }
                ],
                { type: "section", value: "Amounts", align: "left" },
                [
                    { type: "field", value: "debit_amount", align: "left" },
                    { type: "field", value: "credit_amount", align: "left" }
                ],
                { type: "section", value: "Party Information", align: "left" },
                [
                    { type: "field", value: "party_type", align: "left" },
                    { type: "field", value: "party", align: "left" }
                ],
                { type: "section", value: "Additional Information", align: "left" },
                [
                    { type: "field", value: "memo", align: "left" }
                ]
            ]
        }
    ])
})
