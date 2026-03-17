export default $doctype({
    name: {
        type: "Text",
        label: "Warehouse Name",
        required: 1,
        in_list_view: 1,
    },
    warehouse_code: {
        type: "Text",
        label: "Warehouse Code",
        in_list_view: 1,
    },
    address: {
        type: "Text",
        label: "Address",
    },
    phone: {
        type: "Text",
        label: "Phone",
    },
}, {
    label: "Warehouse",
    naming_series: "{{name}} - {{doc_organization_abbr}}",
    search_fields: "name\nwarehouse_code\naddress",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "warehouse_code", align: "left" },
                ],
                [
                    { type: "field", value: "address", align: "left" },
                    { type: "field", value: "phone", align: "left" },
                ],
            ],
        },
    ]),
});
