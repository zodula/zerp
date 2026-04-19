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
    county: {
        type: "Text",
        label: "County",
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
    email: {
        type: "Email",
        label: "Contact Email",
        in_quick_entry: 1,
    },
    phone: {
        type: "Text",
        label: "Contact Phone",
        in_quick_entry: 1,
    },
    inline_address: {
        type: "Long Text",
        label: "Inline Address",
        readonly: 1,
        in_list_view: 1
    },
    inline_contact: {
        type: "Long Text",
        label: "Inline Contact",
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
    search_fields: "address_type\ncity\nprovince\ninline_address\ninline_contact\ncontact_person",
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
                { type: "section", value: "Contact", align: "left" },
                [
                    { type: "field", value: "contact_person", align: "left" },
                    { type: "field", value: "contact_email", align: "left" },
                    { type: "field", value: "contact_phone", align: "left" }
                ],
                [
                    { type: "field", value: "inline_address", align: "left" },
                    { type: "field", value: "inline_contact", align: "left" }
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
        const d = doc as any;
        d.inline_address = [d.address_line1, d.address_line2, d.city, d.province, d.postal_code, d.country].filter(Boolean).join(" ");
        d.inline_contact = [d.email, d.phone].filter(Boolean).join(" ");
    })
