export default $doctype({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        in_list_view: 1,
        filters: JSON.stringify([["status", "=", "Active"]]),
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
        in_list_view: 1,
        fetch_from: "employee.full_name",
    },
    salary_slip: {
        type: "Reference",
        label: "Salary Slip",
        reference: "Salary Slip",
        readonly: 1,
        in_list_view: 1,
    },
    net_pay: {
        type: "Currency",
        label: "Net Pay",
        readonly: 1,
        in_list_view: 1,
    },
}, {
    label: "Payroll Entry Employee",
    is_child_doctype: 1,
    is_child_table: 1,
} as any);
