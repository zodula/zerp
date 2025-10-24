export default $doctype({
    party: {
        type: "Reference",
        label: "Party",
        reference: "zerp__Party",
        required: 1,
        in_list_view: 1
    },
    invoice_type: {
        type: "Select",
        label: "Invoice Type",
        options: "Sales\nPurchase",
        required: 1,
        in_list_view: 1
    },
    invoice_date: {
        type: "Date",
        label: "Invoice Date",
        required: 1,
        in_list_view: 1
    },
    due_date: {
        type: "Date",
        label: "Due Date",
        required: 1
    },
    total_amount: {
        type: "Float",
        label: "Total Amount",
        required: 1,
        in_list_view: 1,
        readonly: 1
    },
    currency: {
        type: "Reference",
        label: "Currency",
        reference: "zodula__Currency",
        required: 1
    },
    currency_amount: {
        type: "Currency",
        label: "Currency Amount",
        readonly: 1
    },
    exchange_rate: {
        type: "Float",
        label: "Exchange Rate",
        default: "1"
    },
    payment_status: {
        type: "Select",
        label: "Payment Status",
        options: "Unpaid\nPartially Paid\nPaid",
        default: "Unpaid",
        required: 1,
        in_list_view: 1,
        readonly: 1
    }
}, {
    label: "Invoice",
    naming_series: "INV-{{invoice_date}}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "party\ninvoice_type\nstatus",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "party", align: "left" },
                    { type: "field", value: "invoice_type", align: "left" },
                    { type: "field", value: "invoice_date", align: "left" },
                    { type: "field", value: "due_date", align: "left" }
                ],
                { type: "section", value: "Amounts", align: "left" },
                { type: "field", value: "invoice_items", align: "left" },
                [
                    { type: "field", value: "total_amount", align: "left" },
                    { type: "field", value: "currency", align: "left" },
                    { type: "field", value: "exchange_rate", align: "left" },
                    { type: "field", value: "currency_amount", align: "left" }
                ]
            ]
        }
    ])
})
