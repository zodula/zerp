export default $doctype({
    plate_number: {
        type: "Text",
        label: "Plate Number",
        in_list_view: 1,
    },
    vehicle_type: {
        type: "Text",
        label: "Vehicle Type",
    },
    capacity: {
        type: "Text",
        label: "Capacity (e.g. weight/volume)",
    },
    status: {
        type: "Select",
        label: "Status",
        options: "Active\nInactive\nMaintenance",
        default: "Active",
        in_list_view: 1,
    },
}, {
    label: "Vehicle",
    naming_series: "VEH-{#####}",
    search_fields: "plate_number",
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
