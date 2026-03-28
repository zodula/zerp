export default $doctype<"Address">({
    name: {
        type: "Text",
        label: "Name",
        required: 1,
        in_list_view: 1,
        in_quick_entry: 1,
    },
    address_type: {
        type: "Select",
        label: "Address Type",
        options: "\nBilling\nShipping\nSender\nOther",
        in_list_view: 1,
        in_quick_entry: 1,
    },
    address_line1: {
        type: "Text",
        label: "Address Line 1",
        required: 1
    },
    address_line2: {
        type: "Text",
        label: "Address Line 2",
        in_quick_entry: 1,
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
        label: "Postal Code",
        in_quick_entry: 1,
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
    link_type: {
        type: "Reference",
        label: "Link Type",
        reference: "Doctype",
        required: 0,
        in_quick_entry: 1,
    },
    link_id: {
        type: "Reference",
        label: "Link ID",
        reference: "{{link_type}}",
        required: 0,
        in_quick_entry: 1,
    },
}, {
    label: "Address",
    naming_series: "ADDR-{YYYY}-{MM}-{DD}-{#####}",
    search_fields: "address_type\ncity\nprovince\ninline_address",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Address Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
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
                { type: "section", value: "Link", align: "left" },
                [
                    { type: "field", value: "link_type", align: "left" },
                    { type: "field", value: "link_id", align: "left" }
                ],
            ]
        }
    ])
})
    .on("before_save", async ({ doc }) => {
        doc.inline_address = [doc.address_line1, doc.address_line2, doc.city, doc.province, doc.postal_code, doc.country].filter(Boolean).join(" ");
    })