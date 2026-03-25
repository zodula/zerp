export default $doctype<"Holiday">({
    name: {
        type: "Text",
        label: "Name",
        required: 1,
        unique: 1,
    },
    date: {
        type: "Date",
        label: "Date",
        required: 1,
    },
    description: {
        type: "Long Text",
        label: "Description",
        required: 0,
    },
}, {
    label: "Holiday",
    naming_series: "{{date}}",
    search_fields: "name\ndescription",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "field", value: "name", align: "left" },
                { type: "field", value: "date", align: "left" },
                { type: "field", value: "description", align: "left" },
            ],
        },
    ]),
});