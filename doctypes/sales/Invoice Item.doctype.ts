export default $doctype({
    invoice: {
        type: "Reference",
        label: "Invoice",
        reference: "zerp__Invoice",
        reference_type: "One to Many",
        required: 1
    },
    description: {
        type: "Text",
        label: "Description",
        required: 1,
        in_list_view: 1
    },
    quantity: {
        type: "Float",
        label: "Quantity",
        required: 1,
        in_list_view: 1
    },
    unit_price: {
        type: "Float",
        label: "Unit Price",
        required: 1,
        in_list_view: 1
    },
    account: {
        type: "Reference",
        label: "Account",
        reference: "zerp__Account",
        required: 1
    }
}, {
    label: "Invoice Item",
    search_fields: "description\naccount"
})
