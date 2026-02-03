export default $doctype({
    product_code: {
        type: "Text",
        label: "Item Code",
        required: 1,
        unique: 1,
        in_list_view: 1
    },
    product_name: {
        type: "Text",
        label: "Item Name",
        required: 1,
        in_list_view: 1
    },
    item_description: {
        type: "Text",
        label: "Item Description"
    },
    default_uom: {
        type: "Reference",
        label: "Default UOM",
        reference: "zerp__UOM",
        required: 1
    }
}, {
    label: "Product",
    naming_series: "{{product_code}}",
    search_fields: "product_code\nproduct_name",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "product_code", align: "left" },
                    { type: "field", value: "product_name", align: "left" }
                ],
                [
                    { type: "field", value: "item_description", align: "left" }
                ],
                { type: "section", value: "Unit Information", align: "left" },
                [
                    { type: "field", value: "default_uom", align: "left" }
                ]
            ]
        }
    ])
})
