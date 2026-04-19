export default $doctype({
    name: {
        type: "Text",
        label: "Warehouse Name",
        required: 1,
        in_list_view: 1,
        in_quick_entry: 1,
    },
    warehouse_code: {
        type: "Text",
        label: "Warehouse Code",
        in_list_view: 1,
        in_quick_entry: 1,
        required: 1,
    },
    address: {
        type: "Text",
        label: "Address",
        in_quick_entry: 1,
    },
    phone: {
        type: "Text",
        label: "Phone",
        in_quick_entry: 1,
    },
}, {
    label: "Warehouse",
    naming_series: "{{warehouse_code}} - {{name}}",
    search_fields: "name\nwarehouse_code\naddress",
    is_quick_entry: 1,
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
