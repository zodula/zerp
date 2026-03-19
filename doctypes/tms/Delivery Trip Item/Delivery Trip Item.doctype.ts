export default $doctype({
    delivery_note: {
        type: "Reference",
        label: "Delivery Note",
        reference: "Delivery Note",
        required: 1,
        in_list_view: 1,
    },
    delivery_note_customer: {
        type: "Text",
        label: "Customer",
        required: 0,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "delivery_note.customer_name",
    },
    shipping_address_name: {
        type: "Text",
        label: "Shipping Address Name",
        required: 0,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "delivery_note.shipping_address.inline_address",
    },
    shipping_address: {
        type: "Reference",
        label: "Shipping Address",
        reference: "Address",
        required: 0,
        readonly: 1,
        fetch_from: "delivery_note.shipping_address",
    },
    shipping_inline_address: {
        type: "Text",
        label: "Shipping Address Inline",
        required: 0,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "delivery_note.shipping_inline_address",
    },
}, {
    label: "Delivery Trip Item",
    is_child_doctype: 1,
    search_fields: "delivery_note",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Reference", align: "left" },
                [
                    { type: "field", value: "delivery_trip", align: "left" },
                    { type: "field", value: "delivery_note", align: "left" },
                    { type: "field", value: "delivery_note_customer", align: "left" },
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
