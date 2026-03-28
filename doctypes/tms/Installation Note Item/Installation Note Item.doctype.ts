export default $doctype<"Installation Note Item">({
    item: {
        type: "Reference",
        label: "Item",
        reference: "Item",
        required: 1,
        in_list_view: 1,
    },
    item_name: {
        type: "Text",
        label: "Item Name",
        required: 1,
        in_list_view: 1,
        readonly: 1,
    },
    quantity: {
        type: "Float",
        label: "Quantity",
        required: 1,
        in_list_view: 1,
    },
    uom: {
        type: "Reference",
        label: "UOM",
        reference: "UOM",
        required: 1,
        in_list_view: 1,
        readonly: 1,
    },
}, {
    label: "Installation Note Item",
    is_child_doctype: 1,
    search_fields: "item_name",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Item", align: "left" },
                [
                    { type: "field", value: "installation_note", align: "left" },
                    { type: "field", value: "item", align: "left" },
                    { type: "field", value: "item_name", align: "left" },
                    { type: "field", value: "quantity", align: "left" },
                    { type: "field", value: "uom", align: "left" },
                ],
            ],
        },
    ]),
});
