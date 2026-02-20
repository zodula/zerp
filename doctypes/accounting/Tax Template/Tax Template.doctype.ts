export default $doctype({
    title: {
        type: "Text",
        label: "Title",
        required: 1,
        in_list_view: 1
    },
    tax_template_items: {
        type: "Reference Table",
        label: "Tax Template Items",
        reference: "Tax Template Item",
        required: 0
    }
}, {
    label: "Tax Template",
    search_fields: "title",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "title", align: "left" }
                ],
                { type: "section", value: "Tax and Charges", align: "left" },
                [
                    { type: "field", value: "tax_template_items", align: "left" }
                ]
            ]
        }
    ])
})

