export default $doctype({
    sales_invoice: {
        type: "Reference",
        label: "Sales Invoice",
        reference: "zerp__Sales Invoice",
        required: 1
    },
    product_code: {
        type: "Reference",
        label: "Product Code",
        reference: "zerp__Product",
        required: 1,
        in_list_view: 1
    },
    product_name: {
        type: "Text",
        label: "Product Name",
        required: 1,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "product_code.product_name"
    },
    item_description: {
        type: "Text",
        label: "Item Description"
    },
    quantity: {
        type: "Float",
        label: "Quantity",
        required: 1,
        in_list_view: 1
    },
    uom: {
        type: "Reference",
        label: "UOM",
        reference: "zerp__UOM",
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
    }
}, {
    label: "Sales Invoice Item",
    search_fields: "product_name\nitem_description",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Item Information", align: "left" },
                [
                    { type: "field", value: "sales_invoice", align: "left" },
                    { type: "field", value: "product_code", align: "left" },
                    { type: "field", value: "product_name", align: "left" },
                    { type: "field", value: "item_description", align: "left" }
                ],
                { type: "section", value: "Quantity & Pricing", align: "left" },
                [
                    { type: "field", value: "quantity", align: "left" },
                    { type: "field", value: "uom", align: "left" },
                    { type: "field", value: "unit_price", align: "left" },
                    { type: "field", value: "total_price", align: "left" }
                ]
            ]
        }
    ])
})

