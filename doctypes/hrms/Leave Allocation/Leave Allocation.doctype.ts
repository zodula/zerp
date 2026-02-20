export default $doctype({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "zerp__Employee",
        required: 1,
        in_list_view: 1,
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
        in_list_view: 1,
        fetch_from: "employee.name",
    },
    leave_type: {
        type: "Reference",
        label: "Leave Type",
        reference: "zerp__Leave Type",
        required: 1,
        in_list_view: 1,
    },
    leave_period: {
        type: "Reference",
        label: "Leave Period",
        reference: "zerp__Leave Period",
        required: 1,
        in_list_view: 1,
    },
    total_leaves_allowed: {
        type: "Float",
        label: "Total Leaves Allowed",
        required: 1,
        in_list_view: 1,
    },
    leaves_taken: {
        type: "Float",
        label: "Leaves Taken",
        default: "0",
        in_list_view: 1,
        readonly: 1,
    },
}, {
    label: "Leave Allocation",
    naming_series: "LA-{{employee}}-{{leave_type}}-{{leave_period}}",
    search_fields: "employee\nemployee_name\nleave_type",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Allocation", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "employee_name", align: "left" },
                    { type: "field", value: "leave_type", align: "left" },
                    { type: "field", value: "leave_period", align: "left" },
                ],
                [
                    { type: "field", value: "total_leaves_allowed", align: "left" },
                    { type: "field", value: "leaves_taken", align: "left" },
                ],
            ],
        },
    ]),
});
