export default $doctype({
    link_doctype: {
        type: "Text",
        label: "Link Doctype",
        required: 1,
        in_list_view: 1
    },
    link_id: {
        type: "Text",
        label: "Link ID",
        required: 1,
        in_list_view: 1
    }
}, {
    label: "Contact Link Item",
    is_child_doctype: 1,
    search_fields: "link_doctype\nlink_id",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Link Information", align: "left" },
                [
                    { type: "field", value: "link_doctype", align: "left" },
                    { type: "field", value: "link_id", align: "left" }
                ]
            ]
        }
    ])
})

