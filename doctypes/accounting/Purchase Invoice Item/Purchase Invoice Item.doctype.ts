export default $doctype<"Purchase Invoice Item">({
    item: {
        type: "Reference",
        label: "Item",
        reference: "Item",
        required: 1,
        in_list_view: 1,
        no_print: 1
    },
    item_name: {
        type: "Text",
        label: "Item Name",
        required: 1,
        in_list_view: 1,
        readonly: 1,
    },
    item_image: {
        type: "Image Preview",
        label: "Item Image",
        readonly: 1,
    },
    item_description: {
        type: "Text",
        label: "Item Description"
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
    unit_price: {
        type: "Float",
        label: "Unit Price",
        required: 1,
        in_list_view: 1
    },
    total_price: {
        type: "Float",
        label: "Total Price",
        required: 1,
        in_list_view: 1,
        readonly: 1
    },
    weight: {
        type: "Float",
        label: "Weight (kg)",
        readonly: 1,
    },
    volume: {
        type: "Float",
        label: "Volume (cm³)",
        readonly: 1,
    },
    length: {
        type: "Float",
        label: "Length (cm)",
        readonly: 1,
    },
    width: {
        type: "Float",
        label: "Width (cm)",
        readonly: 1,
    },
    height: {
        type: "Float",
        label: "Height",
        readonly: 1,
    },
    volume_total: {
        type: "Float",
        label: "Total Volume (cm³)",
        readonly: 1,
    },
    weight_total: {
        type: "Float",
        label: "Total Weight (kg)",
        readonly: 1,
    }
}, {
    label: "Purchase Invoice Item",
    is_child_doctype: 1,
    search_fields: "item_name\nitem_description",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Item Information", align: "left" },
                [
                    { type: "field", value: "purchase_invoice", align: "left" },
                    { type: "field", value: "item", align: "left" },
                    { type: "field", value: "item_name", align: "left" },
                    { type: "field", value: "item_description", align: "left" }
                ],
                { type: "section", value: "Quantity & Pricing", align: "left" },
                [
                    { type: "field", value: "quantity", align: "left" },
                    { type: "field", value: "uom", align: "left" },
                    { type: "field", value: "unit_price", align: "left" },
                    { type: "field", value: "total_price", align: "left" }
                ],
                { type: "section", value: "Dimensions & Weight", align: "left" },
                [
                    { type: "field", value: "length", align: "left" },
                    { type: "field", value: "width", align: "left" },
                    { type: "field", value: "height", align: "left" },
                    { type: "field", value: "weight", align: "left" }
                ],
                [
                    { type: "field", value: "volume", align: "left" },
                    { type: "field", value: "volume_total", align: "left" },
                    { type: "field", value: "weight_total", align: "left" }
                ]
            ]
        }
    ])
})
