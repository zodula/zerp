export default $doctype({
    product: {
        type: "Reference",
        label: "Product",
        reference: "Product",
        required: 1,
        in_list_view: 1
    },
    customer: {
        type: "Reference",
        label: "Customer",
        reference: "Customer",
        required: 1,
        in_list_view: 1
    }
}, {
    label: "Product Customer",
    is_child_doctype: 1,
    search_fields: "product\ncustomer",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Link", align: "left" },
                [
                    { type: "field", value: "product", align: "left" },
                    { type: "field", value: "customer", align: "left" }
                ]
            ]
        }
    ])
})
