export default $doctype({
    name: {
        type: "Text",
        label: "Department Name",
        required: 1,
        in_list_view: 1,
    },
    description: {
        type: "Text",
        label: "Description",
    },
}, {
    label: "Department",
    naming_series: "{{name}}",
    search_fields: "name\ndescription",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Department", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "description", align: "left" },
                ],
            ],
        },
    ]),
});
