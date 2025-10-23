export default $doctype({
    name: {
        type: "Text",
        label: "Name",
        required: 1,
    },
}, {
    label: "Company",
    naming_series: "{{name}}",
    track_changes: 1,
    is_single: 1,
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Company Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" }
                ]
            ]
        }
    ])
})