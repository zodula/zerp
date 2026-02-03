export default $doctype({
    payment_entry: {
        type: "Reference",
        label: "Payment Entry",
        reference: "zerp__Payment Entry",
        required: 1
    },
    sales_invoice: {
        type: "Reference",
        label: "Sales Invoice",
        reference: "zerp__Sales Invoice",
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
    label: "Sales Invoice Reference",
    search_fields: "sales_invoice\npayment_entry",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Invoice Reference", align: "left" },
                [
                    { type: "field", value: "payment_entry", align: "left" },
                    { type: "field", value: "sales_invoice", align: "left" },
                    { type: "field", value: "allocated_amount", align: "left" }
                ]
            ]
        }
    ])
})

