export default $doctype({
    name: {
        type: "Text",
        label: "Name",
        required: 1,
        in_list_view: 1,
        description: "Name must be real customer name or the company name."
    },
    tax_id: {
        type: "Text",
        label: "Tax ID",
        in_quick_entry: 1
    },
    email: {
        type: "Email",
        label: "Email",
        in_quick_entry: 1
    },
    phone: {
        type: "Text",
        label: "Phone",
        in_quick_entry: 1
    },
    address: {
        type: "Text",
        label: "Address",
        in_quick_entry: 1
    },
    credit_days: {
        type: "Integer",
        label: "Credit Days",
        default: "1",
        required: 0,
        in_quick_entry: 1
    },
}, {
    label: "Customer",
    naming_series: "{{name}}",
    search_fields: "name\nemail\nphone",
    display_field: "name",
    is_quick_entry: 1,
    additional_connections: JSON.stringify([{
        doctype: "Payment Entry",
        filters: [["party_type", "=", "Customer"], ["party", "=", "{{id}}"]],
        field: "party",
    }, {
        doctype: "Journal Entry",
        filters: [["journal_entry_items.party_type", "=", "Customer"], ["journal_entry_items.party", "=", "{{id}}"]],
        field: "journal_entry_items.party",
    }]),
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" }
                ],
                { type: "section", value: "Contact Information", align: "left" },
                [
                    { type: "field", value: "email", align: "left" },
                    { type: "field", value: "phone", align: "left" },
                    { type: "field", value: "address", align: "left" }
                ],
                { type: "section", value: "Payment Terms", align: "left" },
                [
                    { type: "field", value: "credit_days", align: "left" }
                ]
            ]
        }
    ])
})

