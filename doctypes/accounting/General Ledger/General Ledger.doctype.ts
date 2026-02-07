export default $doctype<"zerp__General Ledger">({
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        in_list_view: 1
    },
    account: {
        type: "Reference",
        label: "Account",
        reference: "zerp__Account",
        required: 1,
        in_list_view: 1
    },
    debit_amount: {
        type: "Currency",
        label: "Debit Amount",
        default: "0",
        required: 1,
        in_list_view: 1
    },
    credit_amount: {
        type: "Currency",
        label: "Credit Amount",
        default: "0",
        required: 1,
        in_list_view: 1
    },
    reference_doctype: {
        type: "Text",
        label: "Reference Doctype",
        required: 1,
        in_list_view: 1
    },
    reference_id: {
        type: "Text",
        label: "Reference ID",
        required: 1,
        in_list_view: 1
    },
    description: {
        type: "Text",
        label: "Description"
    },
    party_type: {
        type: "Reference",
        label: "Party Type",
        reference: "zodula__Doctype",
        filters: JSON.stringify([["name", "IN", ["zerp__Customer", "zerp__Supplier"]]])
    },
    party: {
        type: "Reference",
        label: "Party",
        reference: "{{party_type}}"
    }
}, {
    label: "General Ledger",
    search_fields: "account\nreference_doctype\nreference_id\ndescription",
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "account", align: "left" }
                ],
                { type: "section", value: "Amounts", align: "left" },
                [
                    { type: "field", value: "debit_amount", align: "left" },
                    { type: "field", value: "credit_amount", align: "left" }
                ],
                { type: "section", value: "Reference", align: "left" },
                [
                    { type: "field", value: "reference_doctype", align: "left" },
                    { type: "field", value: "reference_id", align: "left" },
                    { type: "field", value: "description", align: "left" }
                ],
                { type: "section", value: "Party Information", align: "left" },
                [
                    { type: "field", value: "party_type", align: "left" },
                    { type: "field", value: "party", align: "left" }
                ]
            ]
        }
    ])
})
.on("after_insert", async ({ doc }) => {
    // Update account balance when a new General Ledger entry is created
    await updateAccountBalance(doc.account as string);
})
.on("after_delete", async ({ doc }) => {
    // Update account balance when a General Ledger entry is deleted
    await updateAccountBalance(doc.account as string);
});

async function updateAccountBalance(accountId: string) {
    if (!accountId) return;
    
    // Get all General Ledger entries for this account
    const glEntries = await $zodula.doctype("zerp__General Ledger")
        .select()
        .where("account", "=", accountId)
        .limit(100000);
    
    // Calculate total balance
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const entry of glEntries.docs) {
        const debit = parseFloat(String(entry.debit_amount || 0)) || 0;
        const credit = parseFloat(String(entry.credit_amount || 0)) || 0;
        totalDebit += debit;
        totalCredit += credit;
    }
    
    // Get account to determine account type
    const account = await $zodula.doctype("zerp__Account").get(accountId);
    if (!account) return;
    
    // Calculate balance based on account type
    // Assets, Expenses: Debit - Credit (positive = debit balance)
    // Liabilities, Equity, Income: Credit - Debit (positive = credit balance)
    const accountType = account.account_type as string;
    let balance = 0;
    
    if (accountType === "Asset" || accountType === "Expense") {
        balance = totalDebit - totalCredit;
    } else {
        balance = totalCredit - totalDebit;
    }
    
    // Update account balance
    await $zodula.doctype("zerp__Account").update(accountId, {
        balance: balance
    } as any);
}

