export default $doctype({
    leave_type: {
        type: "Reference",
        label: "Leave Type",
        reference: "Leave Type",
        required: 1,
        in_list_view: 1,
    },
    total_leaves_allowed: {
        type: "Float",
        label: "Total Leaves Allowed",
        required: 1,
        in_list_view: 1,
    },
}, {
    label: "Leave Allocation Entry Leave",
    is_child_doctype: 1,
    is_child_table: 1,
} as any);
