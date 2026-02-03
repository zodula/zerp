export default $doctype({
    name: {
        type: "Text",
        label: "Name",
        required: 1,
        in_list_view: 1
    },
    description: {
        type: "Text",
        label: "Description"
    }
}, {
    label: "Price Project",
    naming_series: "PP-{YYYY}-{MM}-{########}",
    search_fields: "name\ndescription",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "description", align: "left" }
                ]
            ]
        }
    ])
})

