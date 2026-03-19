export default $doctype({
    year: {
        type: "Integer",
        label: "Year",
        required: 1,
        in_list_view: 1,
    },
    from_date: {
        type: "Date",
        label: "From Date",
        required: 1,
        in_list_view: 1,
    },
    to_date: {
        type: "Date",
        label: "To Date",
        required: 1,
        in_list_view: 1,
    },
}, {
    label: "Leave Period",
    naming_series: "LP-{{year}}",
    search_fields: "year",
    display_field: "year",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Period", align: "left" },
                [
                    { type: "field", value: "year", align: "left" },
                    { type: "field", value: "from_date", align: "left" },
                    { type: "field", value: "to_date", align: "left" },
                ],
            ],
        },
    ]),
});
