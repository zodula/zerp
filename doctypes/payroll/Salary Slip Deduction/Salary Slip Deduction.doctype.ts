export default $doctype<"Salary Slip Earning">({
    component_type: {
        type: "Select",
        label: "Component Type",
        options: "Absent\nLeave Without Pay\nLate\nSocial Security\nOther",
        required: 1,
    },
    amount: {
        type: "Currency",
        label: "Amount",
        required: 1,
    },
}, {
    label: "Salary Slip Earning",
    is_child_doctype: 1,
})