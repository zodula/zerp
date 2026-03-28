export default $doctype({
    title: {
        type: "Text",
        label: "Title",
        required: 1,
        in_list_view: 1,
        unique: 1,
        in_quick_entry: 1,
    },
    description: {
        type: "Text",
        label: "Description",
        required: 0,
        in_quick_entry: 1,
    },
    is_active: {
        type: "Check",
        label: "Is Active",
        default: "1",
        in_list_view: 1,
        in_quick_entry: 1,
    },
}, {
    label: "Expense Claim Type",
    naming_series: "{{title}}",
    track_changes: 1,
    search_fields: "title",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Expense Claim Type", align: "left" },
                [
                    { type: "field", value: "title", align: "left" },
                    { type: "field", value: "is_active", align: "left" },
                ],
                [
                    { type: "field", value: "description", align: "left" },
                ],
            ],
        },
    ]),
});
