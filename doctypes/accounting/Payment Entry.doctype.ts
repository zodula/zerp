export default $doctype({
    party: {
        type: "Reference",
        label: "Party",
        reference: "zerp__Party",
        required: 1,
        in_list_view: 1
    },
    payment_type: {
        type: "Select",
        label: "Payment Type",
        options: "Receive\nPay",
        required: 1,
        in_list_view: 1
    },
    payment_date: {
        type: "Date",
        label: "Payment Date",
        required: 1,
        in_list_view: 1
    },
    amount: {
        type: "Float",
        label: "Amount",
        required: 1,
        in_list_view: 1
    },
    currency: {
        type: "Reference",
        label: "Currency",
        reference: "zerp__Currency",
        required: 1
    },
    exchange_rate: {
        type: "Float",
        label: "Exchange Rate",
        default: "1"
    },
    payment_method: {
        type: "Select",
        label: "Payment Method",
        options: "Cash\nBank\nCard\nTransfer",
        required: 1,
        in_list_view: 1
    },
    reference_no: {
        type: "Text",
        label: "Reference No"
    }
}, {
    label: "Payment Entry",
    naming_series: "PE-{{payment_date}}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "party\npayment_type\nreference_no"
})
