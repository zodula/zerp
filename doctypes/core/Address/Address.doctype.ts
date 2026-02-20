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
        options: "\nBilling\nShipping\nOffice\nHome\nOther",
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
        label: "Country"
    },
    inline_address: {
        type: "Long Text",
        label: "Inline Address",
        readonly: 1,
        in_list_view: 1
    },
    is_organization_address: {
        type: "Check",
        label: "Is Organization Address"
    },
    links: {
        type: "Reference Table",
        label: "Links",
        reference: "zerp__Address Link Item",
        required: 0
    }
}, {
    label: "Address",
    naming_series: "ADS-{{organization_abbr}}-{YYYY}{MM}{DD}{#####}",
    search_fields: "address_name\naddress_type\ncity\nprovince\ninline_address",
    track_changes: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Address Information", align: "left" },
                [
                    { type: "field", value: "address_name", align: "left" },
                    { type: "field", value: "address_type", align: "left" },
                    { type: "field", value: "is_organization_address", align: "left" }
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
                ],
                [
                    { type: "field", value: "inline_address", align: "left" }
                ],
                { type: "section", value: "Links", align: "left" },
                [
                    { type: "field", value: "links", align: "left" }
                ]
            ]
        }
    ])
})
