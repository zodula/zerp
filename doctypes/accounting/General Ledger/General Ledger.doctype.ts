export default $doctype<"General Ledger">({
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        in_list_view: 1
    },
    account: {
        type: "Reference",
        label: "Account",
        reference: "Account",
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
        reference: "Doctype",
        filters: JSON.stringify([["name", "IN", ["Customer", "Supplier"]]])
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
.on("before_save", async ({ doc }) => {
    await assertAccountIsNotGroupForGl(doc.account as string | undefined);
    const postingDate = String(doc.posting_date ?? "").slice(0, 10);
    if (!postingDate) return;
})
.on("before_delete", async ({ doc }) => {
    await assertAccountIsNotGroupForGl(doc.account as string | undefined);
})
.on("after_insert", async ({ doc }) => {
    await updateAccountBalanceFromGlAndRollup(doc.account as string);
})
.on("after_delete", async ({ doc }) => {
    await updateAccountBalanceFromGlAndRollup(doc.account as string);
});

async function assertAccountIsNotGroupForGl(accountId: string | undefined) {
    if (!accountId) return;
    const account = await $zodula.doctype("Account").get(accountId);
    if (!account) return;
    if (Number((account as any).is_group) === 1) {
        throw new Error("General Ledger cannot use a group account; post only to ledger (non-group) accounts.");
    }
}

/** Leaf balance from GL lines; group balance = sum of direct child balances. Then refresh every ancestor group. */
async function updateAccountBalanceFromGlAndRollup(accountId: string) {
    if (!accountId) return;

    const account = await $zodula.doctype("Account").get(accountId);
    if (!account) return;

    if (Number((account as any).is_group) === 1) {
        await recalcGroupBalanceFromChildren(accountId);
    } else {
        await recalcLeafBalanceFromGeneralLedger(accountId);
    }

    let parentId = (account as any).parent_account as string | undefined | null;
    while (parentId) {
        await recalcGroupBalanceFromChildren(parentId);
        const parent = await $zodula.doctype("Account").get(parentId);
        if (!parent) break;
        parentId = (parent as any).parent_account as string | undefined | null;
    }
}

async function recalcLeafBalanceFromGeneralLedger(accountId: string) {
    const glEntries = await $zodula.doctype("General Ledger")
        .select()
        .where("account", "=", accountId);

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of glEntries.docs) {
        const debit = parseFloat(String(entry.debit_amount || 0)) || 0;
        const credit = parseFloat(String(entry.credit_amount || 0)) || 0;
        totalDebit += debit;
        totalCredit += credit;
    }

    const account = await $zodula.doctype("Account").get(accountId);
    if (!account) return;

    const rootType = account.root_type as string;
    let balance = 0;

    if (rootType === "Asset" || rootType === "Expense") {
        balance = totalDebit - totalCredit;
    } else {
        balance = totalCredit - totalDebit;
    }

    await $zodula.doctype("Account").update(accountId, {
        balance,
    } as any);
}

async function recalcGroupBalanceFromChildren(groupId: string) {
    const { docs: children } = await $zodula
        .doctype("Account")
        .select()
        .where("parent_account", "=", groupId);
    let sum = 0;
    for (const c of children) {
        sum += parseFloat(String((c as any).balance ?? 0)) || 0;
    }
    await $zodula.doctype("Account").update(groupId, { balance: sum } as any);
}

async function resolveFiscalYearByDate(date: string) {
    const rows = await $zodula.doctype("Fiscal Year").select();
    const hit = rows.docs.find((fy: any) => {
        const s = String(fy.start_date ?? "").slice(0, 10);
        const e = String(fy.end_date ?? "").slice(0, 10);
        return !!s && !!e && s <= date && date <= e;
    });
    return hit ?? null;
}

