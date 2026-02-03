export default $doctype({
    price_project: {
        type: "Reference",
        label: "Price Project",
        reference: "zerp__Price Project",
        required: 1,
        in_list_view: 1
    },
    party_type: {
        type: "Select",
        label: "Party Type",
        options: "Customer\nSupplier",
        required: 1,
        in_list_view: 1
    },
    customer: {
        type: "Reference",
        label: "Customer",
        reference: "zerp__Customer",
        required: 0,
        in_list_view: 1
    },
    supplier: {
        type: "Reference",
        label: "Supplier",
        reference: "zerp__Supplier",
        required: 0,
        in_list_view: 1
    },
    product: {
        type: "Reference",
        label: "Product",
        reference: "zerp__Product",
        required: 1,
        in_list_view: 1
    },
    price: {
        type: "Float",
        label: "Price",
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
    until_date: {
        type: "Date",
        label: "Until Date",
        required: 0
    }
}, {
    label: "Price List",
    naming_series: "PL-{YYYY}-{MM}-{########}",
    search_fields: "price_project\nparty_type\ncustomer\nsupplier\nproduct",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "price_project", align: "left" },
                    { type: "field", value: "party_type", align: "left" },
                    { type: "field", value: "customer", align: "left" },
                    { type: "field", value: "supplier", align: "left" }
                ],
                { type: "section", value: "Product & Pricing", align: "left" },
                [
                    { type: "field", value: "product", align: "left" },
                    { type: "field", value: "price", align: "left" },
                    { type: "field", value: "uom", align: "left" },
                    { type: "field", value: "until_date", align: "left" }
                ]
            ]
        }
    ])
})
.on("after_save", async (ctx) => {
    $zodula.enqueue("zodula.example", {
        
    })
})