export default $doctype<"Journal Entry">({
    journal_date: {
        type: "Date",
        label: "Journal Date",
        required: 1,
        in_list_view: 1
    },
    description: {
        type: "Text",
        label: "Description"
    },
    reference_doctype: {
        type: "Text",
        label: "Reference Doctype"
    },
    reference_id: {
        type: "Text",
        label: "Reference ID"
    },
    journal_entry_items: {
        type: "Reference Table",
        label: "Journal Entry Items",
        reference: "Journal Entry Item",
        required: 0
    }
}, {
    label: "Journal Entry",
    naming_series: "JE-{{journal_date}}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "description\nreference_doctype\nreference_id",
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "journal_date", align: "left" },
                    { type: "field", value: "description", align: "left" }
                ],
                { type: "section", value: "Journal Entry Items", align: "left" },
                [
                    { type: "field", value: "journal_entry_items", align: "left" }
                ],
                { type: "section", value: "Reference", align: "left" },
                [
                    { type: "field", value: "reference_doctype", align: "left" },
                    { type: "field", value: "reference_id", align: "left" }
                ],
                { type: "section", value: "Approval", align: "left" },
                [
                    { type: "field", value: "created_by", align: "left" },
                    { type: "field", value: "approved_by", align: "left" }
                ]
            ]
        }
    ])
})
.on("before_submit", async ({ doc }) => {
    // Validate that debits equal credits
    if (!doc.journal_entry_items || !Array.isArray(doc.journal_entry_items) || doc.journal_entry_items.length === 0) {
        throw new Error("Journal Entry must have at least one item");
    }
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const item of doc.journal_entry_items) {
        const debit = parseFloat(String((item as any).debit_amount || 0)) || 0;
        const credit = parseFloat(String((item as any).credit_amount || 0)) || 0;
        
        if (debit < 0 || credit < 0) {
            throw new Error("Debit and Credit amounts cannot be negative");
        }
        
        if (debit > 0 && credit > 0) {
            throw new Error("An item cannot have both debit and credit amounts");
        }
        
        totalDebit += debit;
        totalCredit += credit;
    }
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Total Debits (${totalDebit}) must equal Total Credits (${totalCredit})`);
    }
})
.on("after_submit", async ({ doc }) => {
    // Create General Ledger entries for each journal entry item (aligned with General Ledger doctype)
    if (doc.journal_entry_items && Array.isArray(doc.journal_entry_items)) {
        const description = doc.description ? `Journal Entry ${doc.id} - ${doc.description}` : `Journal Entry ${doc.id}`;
        for (const item of doc.journal_entry_items) {
            const itemData = item as any;
            const account = itemData.account;
            const debitAmount = parseFloat(String(itemData.debit_amount || 0)) || 0;
            const creditAmount = parseFloat(String(itemData.credit_amount || 0)) || 0;

            if (!account) continue;

            await $zodula.doctype("General Ledger").insert({
                posting_date: doc.journal_date,
                account: account,
                debit_amount: debitAmount,
                credit_amount: creditAmount,
                reference_doctype: "Journal Entry",
                reference_id: doc.id,
                description: itemData.memo || description,
                party_type: itemData.party_type ?? undefined,
                party: itemData.party ?? undefined
            } as any);
        }
    }
})
.on("after_cancel", async ({ doc }) => {
    // Delete General Ledger entries for this Journal Entry (same pattern as Payment Entry)
    // after_delete on General Ledger will update account balances
    const glEntries = await $zodula.doctype("General Ledger")
        .select()
        .where("reference_doctype", "=", "Journal Entry")
        .where("reference_id", "=", doc.id);

    for (const glEntry of glEntries.docs) {
        await $zodula.doctype("General Ledger").delete(glEntry.id);
    }
})
