export default $doctype({
    address_name: {
        type: "Text",
        label: "Address Name",
        required: 1,
        in_list_view: 1
    },
    address_type: {
        type: "Select",
        label: "Address Type",
        options: "Billing\nShipping\nOffice\nHome\nOther",
        required: 1,
        in_list_view: 1
    },
    address_line1: {
        type: "Text",
        label: "Address Line 1",
        required: 1
    },
    address_line2: {
        type: "Text",
        label: "Address Line 2"
    },
    city: {
        type: "Text",
        label: "City",
        required: 1
    },
    province: {
        type: "Text",
        label: "Province",
        required: 1,
        in_list_view: 1
    },
    postal_code: {
        type: "Text",
        label: "Postal Code"
    },
    country: {
        type: "Text",
        label: "Country",
        default: "Thailand"
    }
}, {
    label: "Address",
    naming_series: "{{address_name}} - {{address_type}}",
    search_fields: "address_name\naddress_type\ncity\nprovince",
    track_changes: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Address Information", align: "left" },
                [
                    { type: "field", value: "address_name", align: "left" },
                    { type: "field", value: "address_type", align: "left" }
                ],
                [
                    { type: "field", value: "address_line1", align: "left" },
                    { type: "field", value: "address_line2", align: "left" }
                ],
                [
                    { type: "field", value: "city", align: "left" },
                    { type: "field", value: "province", align: "left" },
                    { type: "field", value: "postal_code", align: "left" }
                ],
                [
                    { type: "field", value: "country", align: "left" }
                ]
            ]
        }
    ])
})
