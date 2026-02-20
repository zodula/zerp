export default $doctype({
    delivery_order: {
        type: "Reference",
        label: "Delivery Order",
        reference: "zerp__Delivery Order",
        required: 1,
        in_list_view: 1,
    },
    delivery_order_customer: {
        type: "Text",
        label: "Customer",
        required: 0,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "delivery_order.customer_name",
    },
    shipping_address_name: {
        type: "Text",
        label: "Shipping Address Name",
        required: 0,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "delivery_order.shipping_address.address_name",
    },
    shipping_address: {
        type: "Reference",
        label: "Shipping Address",
        reference: "zerp__Address",
        required: 0,
        readonly: 1,
        fetch_from: "delivery_order.shipping_address",
    },
    shipping_inline_address: {
        type: "Text",
        label: "Shipping Address Inline",
        required: 0,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "delivery_order.shipping_inline_address",
    },
}, {
    label: "Delivery Manifest Item",
    is_child_doctype: 1,
    search_fields: "delivery_order",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Reference", align: "left" },
                [
                    { type: "field", value: "delivery_manifest", align: "left" },
                    { type: "field", value: "delivery_order", align: "left" },
                    { type: "field", value: "delivery_order_customer", align: "left" },
                ],
                { type: "section", value: "Shipping", align: "left" },
                [
                    { type: "field", value: "shipping_address_name", align: "left" },
                    { type: "field", value: "shipping_address", align: "left" },
                    { type: "field", value: "shipping_inline_address", align: "left" },
                ],
            ],
        },
    ]),
});
