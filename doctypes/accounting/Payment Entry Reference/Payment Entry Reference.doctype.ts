export default $doctype({
    payment_entry: {
        type: "Reference",
        label: "Payment Entry",
        reference: "zerp__Payment Entry",
        required: 1
    },
    reference_type: {
        type: "Reference",
        label: "Reference Type",
        reference: "zodula__Doctype",
        filters: JSON.stringify([["name", "IN", ["zerp__Sales Invoice", "zerp__Purchase Invoice"]]]),
        required: 1
    },
    reference_id: {
        type: "Reference",
        label: "Reference ID",
        reference: "{{reference_type}}",
        required: 1
    },
    remaining_amount: {
        type: "Currency",
        label: "Remaining Amount",
        required: 0,
        readonly: 1,
        in_list_view: 0
    },
    allocated_amount: {
        type: "Currency",
        label: "Allocated Amount",
        required: 1
    }
}, {
    label: "Payment Entry Reference",
    is_child_doctype: 1
})