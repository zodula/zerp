export default $doctype({
    reference_type: {
        type: "Reference",
        label: "Reference Type",
        reference: "Doctype",
        filters: JSON.stringify([["name", "IN", ["Sales Invoice", "Purchase Invoice", "Delivery Note", "Employee Advance", "Expense Claim"]]]),
        required: 1,
        in_list_view: 0
    },
    reference_id: {
        type: "Reference",
        label: "Reference ID",
        reference: "{{reference_type}}",
        filters: JSON.stringify([["doc_status", "=", "Submitted"]]),
        required: 1
    },
    memo: {
        type: "Text",
        label: "Memo",
        required: 0,
        in_list_view: 1
    },
    outstanding_amount: {
        type: "Currency",
        label: "Outstanding Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    allocate_amount: {
        type: "Currency",
        label: "Allocate Amount",
        required: 1
    }
}, {
    label: "Payment Entry Reference",
    is_child_doctype: 1
})