export default $doctype({
    plate_number: {
        type: "Text",
        label: "Plate Number",
        in_list_view: 1,
        required: 1,
        in_quick_entry: 1,
    },
    vehicle_type: {
        type: "Text",
        label: "Vehicle Type",
        in_quick_entry: 1,
    },
    capacity: {
        type: "Text",
        label: "Capacity (e.g. weight/volume)",
        in_quick_entry: 1,
    },
}, {
    label: "Vehicle",
    naming_series: "{{plate_number}}",
    search_fields: "plate_number",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "plate_number", align: "left" },
                    { type: "field", value: "vehicle_type", align: "left" },
                    { type: "field", value: "status", align: "left" },
                ],
                [
                    { type: "field", value: "capacity", align: "left" },
                ],
            ],
        },
    ]),
});
