export default $doctype({
    product_name: {
        type: "Text",
        label: "Item Name",
        required: 1,
        in_list_view: 1
    },
    product_category: {
        type: "Reference",
        label: "Product Category",
        reference: "Product Category",
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
        reference: "UOM",
        required: 1
    },
    length: {
        type: "Float",
        label: "Length"
    },
    width: {
        type: "Float",
        label: "Width"
    },
    height: {
        type: "Float",
        label: "Height"
    },
    weight: {
        type: "Float",
        label: "Weight"
    },
    barcode: {
        type: "Text",
        label: "Barcode"
    },
    product_image: {
        type: "File",
        label: "Product Image"
    },
    product_customer: {
        type: "Reference Table",
        label: "Product Customer",
        reference: "Product Customer",
        required: 0
    }
}, {
    label: "Product",
    naming_series: "ITM-{{organization_abbr}}-{YYYY}{MM}{DD}{#####}",
    search_fields: "product_name",
    display_field: "product_name",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "product_name", align: "left" },
                    { type: "field", value: "product_category", align: "left" }
                ],
                [
                    { type: "field", value: "item_description", align: "left" }
                ],
                { type: "section", value: "Unit Information", align: "left" },
                [
                    { type: "field", value: "default_uom", align: "left" }
                ],
                { type: "section", value: "Dimensions & Weight", align: "left" },
                [
                    { type: "field", value: "length", align: "left" },
                    { type: "field", value: "width", align: "left" },
                    { type: "field", value: "height", align: "left" },
                    { type: "field", value: "weight", align: "left" }
                ],
                { type: "section", value: "Barcode", align: "left" },
                [
                    { type: "field", value: "barcode", align: "left" }
                ],
                { type: "section", value: "Product Image", align: "left" },
                [
                    { type: "field", value: "product_image", align: "left" }
                ],
                { type: "section", value: "Customers", align: "left" },
                [
                    { type: "field", value: "product_customer", align: "left" }
                ]
            ]
        }
    ])
})
