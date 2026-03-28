export default $doctype({
    name: {
        type: "Text",
        label: "Bank Name",
        required: 1,
        in_list_view: 1
    },
    code: {
        type: "Text",
        label: "Bank Code",
        required: 0,
        in_list_view: 1
    },
    swift_code: {
        type: "Text",
        label: "SWIFT Code",
        required: 0,
        in_list_view: 1
    },
    address: {
        type: "Text",
        label: "Address",
        required: 0
    },
    phone: {
        type: "Text",
        label: "Phone",
        required: 0
    },
    email: {
        type: "Email",
        label: "Email",
        required: 0
    },
}, {
    label: "Bank",
    naming_series: "BANK-{YYYY}-{MM}-{########}",
    search_fields: "name\ncode\nswift_code",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "code", align: "left" },
                    { type: "field", value: "swift_code", align: "left" }
                ],
                { type: "section", value: "Contact Information", align: "left" },
                [
                    { type: "field", value: "address", align: "left" },
                    { type: "field", value: "phone", align: "left" },
                    { type: "field", value: "email", align: "left" }
                ]
            ]
        }
    ])
})

