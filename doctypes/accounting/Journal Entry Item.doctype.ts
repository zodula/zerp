export default $doctype({
    journal_entry: {
        type: "Reference",
        label: "Journal Entry",
        reference: "zerp__Journal Entry",
        required: 1
    },
    account: {
        type: "Reference",
        label: "Account",
        reference: "zerp__Account",
        required: 1,
        in_list_view: 1
    },
    debit_amount: {
        type: "Float",
        label: "Debit Amount",
        default: "0",
    },
    credit_amount: {
        type: "Float",
        label: "Credit Amount",
        default: "0"
    },
    memo: {
        type: "Text",
        label: "Memo"
    },
    currency: {
        type: "Reference",
        label: "Currency",
        reference: "zerp__Currency"
    },
    exchange_rate: {
        type: "Float",
        label: "Exchange Rate",
        default: "1"
    }
}, {
    label: "Journal Entry Item",
    search_fields: "account\nmemo"
})
