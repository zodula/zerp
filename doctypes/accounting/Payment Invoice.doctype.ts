export default $doctype({
    payment_entry: {
        type: "Reference",
        label: "Payment Entry",
        reference: "zerp__Payment Entry",
        required: 1
    },
    invoice: {
        type: "Reference",
        label: "Invoice",
        reference: "zerp__Invoice",
        required: 1,
        in_list_view: 1
    },
    applied_amount: {
        type: "Float",
        label: "Applied Amount",
        required: 1,
        in_list_view: 1
    }
}, {
    label: "Payment Invoice",
    search_fields: "payment_entry\ninvoice"
})
