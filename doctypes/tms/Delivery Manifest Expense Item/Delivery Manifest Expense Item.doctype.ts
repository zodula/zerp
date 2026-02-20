export default $doctype({
    expense_type: {
        type: "Reference",
        label: "Expense Type",
        reference: "Freight Expense Type",
        required: 0,
        in_list_view: 1,
    },
    description: {
        type: "Text",
        label: "Description",
        required: 0,
        in_list_view: 1,
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
        readonly: 1,
        fetch_from: "expense_type.uom",
        no_print: 1,
        in_list_view: 1,
    },
    rate: {
        type: "Currency",
        label: "Rate",
        required: 1,
        in_list_view: 1,
    },
    amount: {
        type: "Currency",
        label: "Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1,
    },
    product: {
        type: "Reference",
        label: "Product",
        reference: "Product",
        required: 0,
        readonly: 1,
        fetch_from: "expense_type.product",
        no_print: 1,
    },
}, {
    label: "Delivery Manifest Expense Item",
    is_child_doctype: 1,
    search_fields: "expense_type\ndescription",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Expense", align: "left" },
                [
                    { type: "field", value: "delivery_manifest", align: "left" },
                    { type: "field", value: "expense_type", align: "left" },
                    { type: "field", value: "description", align: "left" },
                    { type: "field", value: "quantity", align: "left" },
                    { type: "field", value: "rate", align: "left" },
                    { type: "field", value: "amount", align: "left" },
                ],
                { type: "section", value: "Product (from Expense Type)", align: "left" },
                [
                    { type: "field", value: "product", align: "left" },
                    { type: "field", value: "uom", align: "left" },
                ],
            ],
        },
    ]),
});
