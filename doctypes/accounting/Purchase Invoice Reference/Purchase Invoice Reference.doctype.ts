export default $doctype({
    payment_entry: {
        type: "Reference",
        label: "Payment Entry",
        reference: "zerp__Payment Entry",
        required: 1
    },
    purchase_invoice: {
        type: "Reference",
        label: "Purchase Invoice",
        reference: "zerp__Purchase Invoice",
        required: 1,
        in_list_view: 1
    },
    allocated_amount: {
        type: "Currency",
        label: "Allocated Amount",
        required: 1,
        in_list_view: 1
    }
}, {
    label: "Purchase Invoice Reference",
    search_fields: "purchase_invoice\npayment_entry",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Invoice Reference", align: "left" },
                [
                    { type: "field", value: "payment_entry", align: "left" },
                    { type: "field", value: "purchase_invoice", align: "left" },
                    { type: "field", value: "allocated_amount", align: "left" }
                ]
            ]
        }
    ])
})

