export default $doctype({
    name: {
        type: "Text",
        label: "Name",
        required: 1,
        in_list_view: 1
    },
    email: {
        type: "Email",
        label: "Email",
        in_quick_entry: 1
    },
    phone: {
        type: "Text",
        label: "Phone",
        in_quick_entry: 1
    },
    address: {
        type: "Text",
        label: "Address"
    }
}, {
    label: "Customer",
    naming_series: "CUSTOMER-{YYYY}-{MM}-{########}",
    search_fields: "name\nemail\nphone",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" }
                ],
                { type: "section", value: "Contact Information", align: "left" },
                [
                    { type: "field", value: "email", align: "left" },
                    { type: "field", value: "phone", align: "left" },
                    { type: "field", value: "address", align: "left" }
                ]
            ]
        }
    ])
})

