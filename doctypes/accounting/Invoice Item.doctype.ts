export default $doctype({
    invoice: {
        type: "Reference",
        label: "Invoice",
        reference: "zerp__Invoice",
        reference_alias: "invoice_items",
        reference_label: "Invoice Items",
        reference_type: "One to Many",
        required: 1
    },
    item_code: {
        type: "Text",
        label: "Item Code",
        in_list_view: 1
    },
    item_name: {
        type: "Text",
        label: "Item Name",
        required: 1,
        in_list_view: 1
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
    label: "Invoice Item",
    search_fields: "description\naccount",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Item Information", align: "left" },
                [
                    { type: "field", value: "invoice", align: "left" },
                    { type: "field", value: "description", align: "left" }
                ],
                { type: "section", value: "Quantity & Pricing", align: "left" },
                [
                    { type: "field", value: "quantity", align: "left" },
                    { type: "field", value: "unit_price", align: "left" }
                ],
                { type: "section", value: "Accounting", align: "left" },
                [
                    { type: "field", value: "account", align: "left" }
                ]
            ]
        }
    ])
})
