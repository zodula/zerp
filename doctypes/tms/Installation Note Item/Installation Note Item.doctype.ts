export default $doctype<"Installation Note Item">({
    product: {
        type: "Reference",
        label: "Product",
        reference: "Product",
        required: 1,
        in_list_view: 1,
    },
    product_name: {
        type: "Text",
        label: "Product Name",
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
    search_fields: "product_name",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Item", align: "left" },
                [
                    { type: "field", value: "installation_note", align: "left" },
                    { type: "field", value: "product", align: "left" },
                    { type: "field", value: "product_name", align: "left" },
                    { type: "field", value: "quantity", align: "left" },
                    { type: "field", value: "uom", align: "left" },
                ],
            ],
        },
    ]),
});
