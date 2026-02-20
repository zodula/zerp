export default $doctype<"Sales Invoice Item">({
    product: {
        type: "Reference",
        label: "Product",
        reference: "Product",
        required: 1,
        in_list_view: 1,
        no_print: 1
    },
    product_name: {
        type: "Text",
        label: "Product Name",
        required: 1,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "product.product_name"
    },
    price_list: {
        type: "Reference",
        label: "Price List",
        reference: "Price List",
        required: 0,
        no_print: 1,
        in_list_view: 1,
        description: "Can select price list only when Customer, Price Project, and Product are provided.",
    },
    product_image: {    
        type: "Image Preview",
        label: "Product Image",
        readonly: 1,
        fetch_from: "product.product_image",
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
        in_list_view: 1
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
    length: {
        type: "Float",
        label: "Length",
        readonly: 1,
        fetch_from: "product.length"
    },
    width: {
        type: "Float",
        label: "Width",
        readonly: 1,
        fetch_from: "product.width"
    },
    height: {
        type: "Float",
        label: "Height",
        readonly: 1,
        fetch_from: "product.height"
    },
    weight: {
        type: "Float",
        label: "Weight",
        readonly: 1,
        fetch_from: "product.weight"
    }
}, {
    label: "Sales Invoice Item",
    is_child_doctype: 1,
    search_fields: "product_name\nitem_description",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Item Information", align: "left" },
                [
                    { type: "field", value: "sales_invoice", align: "left" },
                    { type: "field", value: "product", align: "left" },
                    { type: "field", value: "product_name", align: "left" },
                    { type: "field", value: "price_list", align: "left" },
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
                ]
            ]
        }
    ])
})

