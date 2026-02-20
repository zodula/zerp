export default $doctype({
    name: {
        type: "Text",
        label: "Leave Type Name",
        required: 1,
        in_list_view: 1,
    },
    max_leaves_allowed: {
        type: "Float",
        label: "Max Leaves Allowed",
        default: "0",
    },
    is_carry_forward: {
        type: "Check",
        label: "Is Carry Forward",
        default: "0",
    },
    is_paid: {
        type: "Check",
        label: "Is Paid Leave",
        default: "1",
    },
}, {
    label: "Leave Type",
    naming_series: "{{name}} - {{organization_abbr}}",
    search_fields: "name",
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
