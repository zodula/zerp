export default $doctype({
    account_code: {
        type: "Text",
        label: "Account Code",
        required: 1,
        unique: 1,
        in_list_view: 1
    },
    account_name: {
        type: "Text",
        label: "Account Name",
        required: 1,
        in_list_view: 1
    },
    account_type: {
        type: "Select",
        label: "Account Type",
        options: "Asset\nLiability\nEquity\nIncome\nExpense",
        required: 1,
        in_list_view: 1
    },
    balance: {
        type: "Currency",
        label: "Balance",
        default: "0",
        readonly: 1
    },
    party_type: {
        type: "Reference",
        label: "Party Type",
        reference: "zodula__Doctype",
        filters: JSON.stringify([["name", "IN", ["zerp__Customer", "zerp__Supplier"]]]),
        in_list_view: 1
    },
    party: {
        type: "Reference",
        label: "Party",
        reference: "{{party_type}}",
        in_list_view: 1
    },
    is_bank_account: {
        type: "Check",
        label: "Is Bank Account",
        default: "0",
        in_list_view: 1
    },
    bank: {
        type: "Reference",
        label: "Bank",
        reference: "zerp__Bank",
        required: 0,
        in_list_view: 1
    },
    bank_name: {
        type: "Text",
        label: "Bank Name",
        required: 0,
        in_list_view: 1,
        fetch_from: "bank.name",
    },
    bank_account_no: {
        type: "Text",
        label: "Bank Account No",
        required: 0,
        in_list_view: 1
    },
}, {
    label: "Account",
    naming_series: "{{account_code}}",
    search_fields: "account_code\naccount_name",
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Account Information", align: "left" },
                [
                    { type: "field", value: "account_code", align: "left" },
                    { type: "field", value: "account_name", align: "left" },
                    { type: "field", value: "account_type", align: "left" }
                ],
                { type: "section", value: "Balance", align: "left" },
                [
                    { type: "field", value: "balance", align: "left" }
                ]
            ]
        }
    ])
})
