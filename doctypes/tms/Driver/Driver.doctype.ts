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
        in_quick_entry: 1,
    },
    license_number: {
        type: "Text",
        label: "License Number",
        in_quick_entry: 1,
    },
    transporter: {
        type: "Reference",
        label: "Transporter (Supplier)",
        reference: "Supplier",
        required: 0,
        in_list_view: 1,
        in_quick_entry: 1,
    },
    address: {
        type: "Text",
        label: "Address",
        in_quick_entry: 1,
    },
}, {
    label: "Driver",
    naming_series: "{{name}}",
    search_fields: "name\nphone\nlicense_number\ntransporter",
    is_quick_entry: 1,
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
