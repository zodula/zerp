export default $doctype({
    name: {
        type: "Text",
        label: "Leave Type Name",
        required: 1,
        in_list_view: 1,
        in_quick_entry: 1,
    },
    max_leaves_allowed: {
        type: "Float",
        label: "Max Leaves Allowed",
        default: "0",
        in_quick_entry: 1,
    },

    is_leave_without_pay: {
        type: "Check",
        label: "Is Leave Without Pay",
        default: "0",
        in_quick_entry: 1,
    },
}, {
    label: "Leave Type",
    naming_series: "{{name}}",
    search_fields: "name",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Leave Type", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "max_leaves_allowed", align: "left" },
                    { type: "field", value: "is_carry_forward", align: "left" },
                    { type: "field", value: "is_paid", align: "left" },
                ],
            ],
        },
    ]),
});
