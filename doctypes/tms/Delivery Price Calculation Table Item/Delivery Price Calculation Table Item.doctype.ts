export default $doctype({
    weight: {
        type: "Float",
        label: "Max Weight",
        required: 1,
        in_list_view: 1,
        description: "Maximum weight (or equivalent) this price applies to.",
    },
    price: {
        type: "Currency",
        label: "Price",
        required: 1,
        in_list_view: 1,
    },
}, {
    label: "Delivery Price Calculation Table Item",
    is_child_doctype: 1,
    search_fields: "weight\nprice",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Rule", align: "left" },
                [
                    { type: "field", value: "weight", align: "left" },
                    { type: "field", value: "price", align: "left" },
                ],
            ],
        },
    ]),
})

