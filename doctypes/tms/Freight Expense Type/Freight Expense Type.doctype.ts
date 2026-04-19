export default $doctype({
    expense_type_name: {
        type: "Text",
        label: "Expense Type Name",
        required: 1,
        in_list_view: 1,
        in_quick_entry: 1,
    },
    item: {
        type: "Reference",
        label: "Item",
        reference: "Item",
        required: 1,
        in_list_view: 1,
        in_quick_entry: 1,
    },
    uom: {
        type: "Reference",
        label: "UOM",
        reference: "UOM",
        required: 1,
        in_list_view: 1,
        in_quick_entry: 1,
    },
}, {
    label: "Freight Expense Type",
    naming_series: "{{expense_type_name}}",
    display_field: "expense_type_name",
    search_fields: "expense_type_name\nitem",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Expense Type", align: "left" },
                [
                    { type: "field", value: "expense_type_name", align: "left" },
                    { type: "field", value: "item", align: "left" },
                    { type: "field", value: "uom", align: "left" },
                ],
            ],
        },
    ]),
});
