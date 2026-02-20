export default $doctype({
    name: {
        type: "Text",
        label: "Name",
        required: 1,
        in_list_view: 1
    },
    designation: {
        type: "Text",
        label: "Designation",
        in_list_view: 1
    },
    email: {
        type: "Email",
        label: "Email",
        in_list_view: 1
    },
    phone: {
        type: "Text",
        label: "Phone",
        in_list_view: 1
    },
    mobile: {
        type: "Text",
        label: "Mobile"
    },
    inline_contact: {
        type: "Long Text",
        label: "Inline Contact",
        readonly: 1,
        in_list_view: 1
    },
    links: {
        type: "Reference Table",
        label: "Links",
        reference: "Contact Link Item",
        required: 0
    }
}, {
    label: "Contact",
    naming_series: "{{name}}",
    search_fields: "name\ndesignation\nemail\nphone\ninline_contact",
    track_changes: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Contact Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "designation", align: "left" }
                ],
                [
                    { type: "field", value: "email", align: "left" },
                    { type: "field", value: "phone", align: "left" },
                    { type: "field", value: "mobile", align: "left" }
                ],
                [
                    { type: "field", value: "inline_contact", align: "left" }
                ],
                { type: "section", value: "Links", align: "left" },
                [
                    { type: "field", value: "links", align: "left" }
                ]
            ]
        }
    ])
})

