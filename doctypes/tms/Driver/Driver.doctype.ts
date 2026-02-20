export default $doctype({
    name: {
        type: "Text",
        label: "Driver Name",
        required: 1,
        in_list_view: 1,
    },
    phone: {
        type: "Text",
        label: "Phone",
        in_list_view: 1,
    },
    license_number: {
        type: "Text",
        label: "License Number",
    },
    transporter: {
        type: "Reference",
        label: "Transporter (Supplier)",
        reference: "Supplier",
        required: 0,
        in_list_view: 1,
    },
    address: {
        type: "Text",
        label: "Address",
    },
    status: {
        type: "Select",
        label: "Status",
        options: "Active\nInactive",
        default: "Active",
        in_list_view: 1,
    },
}, {
    label: "Driver",
    naming_series: "DRV-{{organization_abbr}}-{#####}",
    search_fields: "name\nphone\nlicense_number\ntransporter",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "phone", align: "left" },
                    { type: "field", value: "status", align: "left" },
                ],
                { type: "section", value: "Transporter", align: "left" },
                [
                    { type: "field", value: "transporter", align: "left" },
                ],
                { type: "section", value: "Additional", align: "left" },
                [
                    { type: "field", value: "license_number", align: "left" },
                    { type: "field", value: "address", align: "left" },
                ],
            ],
        },
    ]),
});
