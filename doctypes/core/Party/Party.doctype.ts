export default $doctype({
    party_type: {
        type: "Select",
        label: "Party Type",
        options: "CUSTOMER\nSUPPLIER\nEMPLOYEE",
        required: 1,
        in_list_view: 1
    },
    name: {
        type: "Text",
        label: "Name",
        required: 1,
        in_list_view: 1
    },
    email: {
        type: "Email",
        label: "Email"
    },
    phone: {
        type: "Text",
        label: "Phone"
    },
    address: {
        type: "Text",
        label: "Address"
    }
}, {
    label: "Party",
    naming_series: "{{party_type}}-{YYYY}-{MM}-{########}",
    search_fields: "name\nemail\nphone",
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "party_type", align: "left" },
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
