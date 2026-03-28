export default $doctype({
    reference_type: {
        type: "Reference",
        label: "Reference Type",
        reference: "Doctype",
        filters: JSON.stringify([["name", "IN", ["Sales Invoice", "Purchase Invoice", "Delivery Note", "Employee Advance", "Expense Claim", "Salary Slip"]]]),
        required: 1,
        in_list_view: 1
    },
    reference_id: {
        type: "Reference",
        label: "Reference ID",
        reference: "{{reference_type}}",
        filters: JSON.stringify([["doc_status", "=", "Submitted"]]),
        required: 1
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
        required: 1,
        in_list_view: 1
    }
}, {
    label: "Payment Entry Request Reference",
    is_child_doctype: 1
})
