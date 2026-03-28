const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

export async function getAccountIdByCode(accountCode: string): Promise<string | null> {
  const { docs } = await $zodula
    .doctype("Account")
    .select()
    .where("account_code", "=", accountCode)
    .limit(1)
    .bypass(true);
  return docs[0]?.id ?? null;
}

export async function requireAccountByCode(accountCode: string, label: string): Promise<string> {
  const id = await getAccountIdByCode(accountCode);
  if (!id) {
    throw new Error(
      `Chart account ${accountCode} (${label}) not found. Run company setup or create the account.`
    );
  }
  return id;
}

export async function deleteGlForReference(referenceDoctype: string, referenceId: string | undefined) {
  if (!referenceId) return;
  const glEntries = await $zodula
    .doctype("General Ledger")
    .select()
    .where("reference_doctype", "=", referenceDoctype)
    .where("reference_id", "=", referenceId);
  for (const glEntry of glEntries.docs) {
    await $zodula.doctype("General Ledger").delete(glEntry.id);
  }
}

async function insertGlRow(args: {
  posting_date: string;
  account: string;
  debit_amount: number;
  credit_amount: number;
  reference_doctype: string;
  reference_id: string;
  description: string;
  party_type?: string;
  party?: string;
}) {
  await $zodula.doctype("General Ledger").insert({
    posting_date: args.posting_date,
    account: args.account,
    debit_amount: args.debit_amount,
    credit_amount: args.credit_amount,
    reference_doctype: args.reference_doctype,
    reference_id: args.reference_id,
    description: args.description,
    party_type: args.party_type,
    party: args.party,
  } as any);
}

export async function postSalesInvoiceGl(doc: Record<string, unknown>) {
  const id = doc.id as string | undefined;
  if (!id) return;

  const postingDate = String(doc.posting_date ?? "").slice(0, 10) || $zodula.date.today();
  const isCreditNote = Number(doc.is_credit_note ?? 0) === 1;
  const customer = String(doc.customer ?? "");

  const net = num(doc.net_total);
  const vat = num(doc.total_taxes_and_charges);
  const grand = num(doc.grand_total);
  const vatType = String(doc.vat_type ?? "Excluded");

  const absNet = Math.abs(net);
  const absVat = Math.abs(vat);
  const absGrand = Math.abs(grand);

  let absSales: number;
  if (vatType === "Included" && absVat > 0.0001) {
    absSales = Math.max(0, absNet - absVat);
  } else {
    absSales = absNet;
  }

  const vatId = absVat > 0.0001 ? await requireAccountByCode("2310", "Output VAT") : null;
  const arId = await requireAccountByCode("1310", "Debtors");
  const salesId = await requireAccountByCode("4110", "Sales");

  const desc = `Sales Invoice ${id}`;

  if (!isCreditNote) {
    await insertGlRow({
      posting_date: postingDate,
      account: arId,
      debit_amount: absGrand,
      credit_amount: 0,
      reference_doctype: "Sales Invoice",
      reference_id: id,
      description: desc,
      party_type: "Customer",
      party: customer,
    });
    await insertGlRow({
      posting_date: postingDate,
      account: salesId,
      debit_amount: 0,
      credit_amount: absSales,
      reference_doctype: "Sales Invoice",
      reference_id: id,
      description: desc,
    });
    if (vatId) {
      await insertGlRow({
        posting_date: postingDate,
        account: vatId,
        debit_amount: 0,
        credit_amount: absVat,
        reference_doctype: "Sales Invoice",
        reference_id: id,
        description: desc,
      });
    }
  } else {
    await insertGlRow({
      posting_date: postingDate,
      account: arId,
      debit_amount: 0,
      credit_amount: absGrand,
      reference_doctype: "Sales Invoice",
      reference_id: id,
      description: desc,
      party_type: "Customer",
      party: customer,
    });
    await insertGlRow({
      posting_date: postingDate,
      account: salesId,
      debit_amount: absSales,
      credit_amount: 0,
      reference_doctype: "Sales Invoice",
      reference_id: id,
      description: desc,
    });
    if (vatId) {
      await insertGlRow({
        posting_date: postingDate,
        account: vatId,
        debit_amount: absVat,
        credit_amount: 0,
        reference_doctype: "Sales Invoice",
        reference_id: id,
        description: desc,
      });
    }
  }
}

export async function postPurchaseInvoiceGl(doc: Record<string, unknown>) {
  const id = doc.id as string | undefined;
  if (!id) return;

  const postingDate = String(doc.posting_date ?? "").slice(0, 10) || $zodula.date.today();
  const supplier = String(doc.supplier ?? "");

  const net = num(doc.net_total);
  const vat = num(doc.total_taxes_and_charges);
  const grand = num(doc.grand_total);
  const vatType = String(doc.vat_type ?? "Excluded");

  const absNet = Math.abs(net);
  const absVat = Math.abs(vat);
  const absGrand = Math.abs(grand);

  let absExpense: number;
  if (vatType === "Included" && absVat > 0.0001) {
    absExpense = Math.max(0, absNet - absVat);
  } else {
    absExpense = absNet;
  }

  const expenseId = await requireAccountByCode("5111", "Cost of Goods Sold");
  const vatId = absVat > 0.0001 ? await requireAccountByCode("2340", "Input VAT") : null;
  const apId = await requireAccountByCode("2110", "Creditors");

  const desc = `Purchase Invoice ${id}`;

  await insertGlRow({
    posting_date: postingDate,
    account: expenseId,
    debit_amount: absExpense,
    credit_amount: 0,
    reference_doctype: "Purchase Invoice",
    reference_id: id,
    description: desc,
  });
  if (vatId) {
    await insertGlRow({
      posting_date: postingDate,
      account: vatId,
      debit_amount: absVat,
      credit_amount: 0,
      reference_doctype: "Purchase Invoice",
      reference_id: id,
      description: desc,
    });
  }
  await insertGlRow({
    posting_date: postingDate,
    account: apId,
    debit_amount: 0,
    credit_amount: absGrand,
    reference_doctype: "Purchase Invoice",
    reference_id: id,
    description: desc,
    party_type: "Supplier",
    party: supplier,
  });
}
