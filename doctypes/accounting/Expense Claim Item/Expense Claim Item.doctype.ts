export default $doctype({
    expense_claim_type: {
        type: "Reference",
        label: "Expense Claim Type",
        reference: "Expense Claim Type",
        required: 1,
        in_list_view: 1,
        filters: JSON.stringify([["is_active", "=", 1]]),
    },
    expense_date: {
        type: "Date",
        label: "Expense Date",
        required: 1,
        in_list_view: 1,
    },
    amount: {
        type: "Currency",
        label: "Amount",
        required: 1,
        in_list_view: 1,
    },
    note: {
        type: "Text",
        label: "Note",
        required: 0,
    },
}, {
    label: "Expense Claim Item",
    is_child_doctype: 1,
});
