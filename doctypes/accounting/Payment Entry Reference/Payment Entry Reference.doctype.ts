export default $doctype({
    payment_entry: {
        type: "Reference",
        label: "Payment Entry",
        reference: "Payment Entry",
        required: 1
    },
    reference_id: {
        type: "Reference",
        label: "Reference ID",
        reference: "{{reference_type}}",
        filters: JSON.stringify([["doc_status", "=", "1"]]),
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