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
    parent_account: {
        type: "Reference",
        label: "Parent Account",
        reference: "zerp__Account"
    },
    is_group: {
        type: "Check",
        label: "Is Group",
        default: "0"
    },
    currency: {
        type: "Reference",
        label: "Currency",
        reference: "zerp__Currency"
    }
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
                { type: "section", value: "Hierarchy", align: "left" },
                [
                    { type: "field", value: "parent_account", align: "left" },
                    { type: "field", value: "is_group", align: "left" }
                ],
                { type: "section", value: "Currency", align: "left" },
                [
                    { type: "field", value: "currency", align: "left" }
                ]
            ]
        }
    ])
})
