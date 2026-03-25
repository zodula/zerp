export default $doctype<"Payroll Setting">({
    mark_unmarked_attendance_with: {
        type: "Select",
        label: "Mark Unmarked Attendance With",
        required: 1,
        default: "Present",
        options: "Present\nAbsent",
        description: "Working days with no Attendance row: count as paid (Present) or unpaid (Absent) on Salary Slip.",
    },
    social_security_percentage: {
        type: "Float",
        label: "Social Security Percentage",
        default: "0",
    },
    max_social_security_deduct: {
        type: "Currency",
        label: "Max Social Security Deduct",
        default: "0",
    },
}, {
    label: "Payroll Setting",
    is_single: 1,
});