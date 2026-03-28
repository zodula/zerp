export default $doctype({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        in_list_view: 1,
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
        in_list_view: 1,
        fetch_from: "employee.full_name",
    },
}, {
    label: "Leave Allocation Entry Employee",
    is_child_doctype: 1,
    is_child_table: 1,
} as any);
