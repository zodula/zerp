import { test, expect } from "bun:test";

function uniqueSuffix() {
  // timestamp + monotonic counter
  // (avoid collisions across fast reruns)
  (uniqueSuffix as any)._i = ((uniqueSuffix as any)._i ?? 0) + 1;
  const i = (uniqueSuffix as any)._i as number;
  return `${Date.now()}-${i}`;
}

async function createCustomerAndItem(suffix: string) {
  const customerName = `Test Customer ${suffix}`;
  const uomName = `UOM ${suffix}`;
  const itemCategoryName = `Category ${suffix}`;
  const itemName = `Item ${suffix}`;

  await $zodula.doctype("Customer").insert({ name: customerName }).bypass(true);
  await $zodula.doctype("UOM").insert({ name: uomName }).bypass(true);
  await $zodula
    .doctype("Item Category")
    .insert({ name: itemCategoryName })
    .bypass(true);

  const item = await $zodula
    .doctype("Item")
    .insert({
      item_name: itemName,
      item_category: itemCategoryName,
      uom: uomName,
    } as any)
    .bypass(true);

  return { customerName, uomName, itemName, itemCategoryName, item };
}

async function createSalesInvoice(args: {
  customerName: string;
  uomName: string;
  itemId: string;
  itemName: string;
}) {
  const { customerName, uomName, itemId, itemName } = args;

  // `item_name` is required on Sales Invoice Item and must be present
  // because Payment Entry updates the Sales Invoice and rewrites child rows.
  const invoice = await $zodula.doctype("Sales Invoice").insert({
    customer: customerName,
    posting_date: "2026-03-19",
    due_date: "2026-03-19",
    sales_invoice_items: [
      {
        item: itemId,
        item_name: itemName,
        uom: uomName,
        quantity: 1,
        unit_price: 100,
        total_price: 100,
      },
    ],
  } as any).bypass(true);

  return await $zodula.doctype("Sales Invoice").get(invoice.id).bypass(true);
}

async function createAccount(args: {
  code: string;
  name: string;
  rootType: string;
}) {
  const { code, name, rootType } = args;

  return await $zodula.doctype("Account").insert({
    account_code: code,
    account_name: name,
    root_type: rootType,
    account_type: "Cash",
    parent_account: null,
  } as any).bypass(true);
}

async function getGLRowsForPaymentEntry(paymentEntryId: string) {
  const res = await $zodula.doctype("General Ledger")
    .select()
    .bypass(true)
    .where("reference_doctype", "=", "Payment Entry")
    .where("reference_id", "=", paymentEntryId);
  return res.docs;
}

async function getAccountBalance(accountId: string) {
  const acc = await $zodula.doctype("Account").get(accountId).bypass(true);
  return Number((acc as any).balance ?? 0);
}

test("Payment Entry General Ledger: account_paid_from (Receive)", async () => {
  const suffix = uniqueSuffix();
  const { customerName, uomName, itemName, item } = await createCustomerAndItem(
    suffix
  );

  const invoice = await createSalesInvoice({
    customerName,
    uomName,
    itemId: item.id,
    itemName,
  });

  const accountFrom = await createAccount({
    code: `AF-${suffix}`,
    name: `Account From ${suffix}`,
    rootType: "Asset",
  });

  const pe = await $zodula.doctype("Payment Entry").insert({
    payment_type: "Receive",
    posting_date: "2026-03-19",
    party_type: "Customer",
    party: customerName,
    paid_amount: 100,
    to_paid_amount: 100,
    payment_method: "Cash",
    account_paid_from: accountFrom.id,
    references: [
      {
        reference_type: "Sales Invoice",
        reference_id: invoice.id,
        allocate_amount: 100,
      },
    ],
  } as any).bypass(true);

  await $zodula.doctype("Payment Entry").submit(pe.id).bypass(true);

  const gl = await getGLRowsForPaymentEntry(pe.id);
  expect(gl.length).toBe(1);
  expect((gl[0] as any).account).toBe(accountFrom.id);
  expect(Number((gl[0] as any).debit_amount)).toBe(0);
  expect(Number((gl[0] as any).credit_amount)).toBe(100);

  // Asset balance = totalDebit - totalCredit = 0 - 100
  expect(await getAccountBalance(accountFrom.id)).toBe(-100);

  await $zodula.doctype("Payment Entry").cancel(pe.id).bypass(true);

  const glAfter = await getGLRowsForPaymentEntry(pe.id);
  expect(glAfter.length).toBe(0);
  expect(await getAccountBalance(accountFrom.id)).toBe(0);
});

test("Payment Entry General Ledger: account_paid_to (Receive)", async () => {
  const suffix = uniqueSuffix();
  const { customerName, uomName, itemName, item } = await createCustomerAndItem(
    suffix
  );

  const invoice = await createSalesInvoice({
    customerName,
    uomName,
    itemId: item.id,
    itemName,
  });

  const accountTo = await createAccount({
    code: `AT-${suffix}`,
    name: `Account To ${suffix}`,
    rootType: "Liability",
  });

  const pe = await $zodula.doctype("Payment Entry").insert({
    payment_type: "Receive",
    posting_date: "2026-03-19",
    party_type: "Customer",
    party: customerName,
    paid_amount: 100,
    to_paid_amount: 100,
    payment_method: "Cash",
    account_paid_to: accountTo.id,
    references: [
      {
        reference_type: "Sales Invoice",
        reference_id: invoice.id,
        allocate_amount: 100,
      },
    ],
  } as any).bypass(true);

  await $zodula.doctype("Payment Entry").submit(pe.id).bypass(true);

  const gl = await getGLRowsForPaymentEntry(pe.id);
  expect(gl.length).toBe(1);
  expect((gl[0] as any).account).toBe(accountTo.id);
  expect(Number((gl[0] as any).debit_amount)).toBe(100);
  expect(Number((gl[0] as any).credit_amount)).toBe(0);

  // Liability balance = totalCredit - totalDebit = 0 - 100
  expect(await getAccountBalance(accountTo.id)).toBe(-100);

  await $zodula.doctype("Payment Entry").cancel(pe.id).bypass(true);

  const glAfter = await getGLRowsForPaymentEntry(pe.id);
  expect(glAfter.length).toBe(0);
  expect(await getAccountBalance(accountTo.id)).toBe(0);
});

test("Payment Entry General Ledger: both accounts (Receive)", async () => {
  const suffix = uniqueSuffix();
  const { customerName, uomName, itemName, item } = await createCustomerAndItem(
    suffix
  );

  const invoice = await createSalesInvoice({
    customerName,
    uomName,
    itemId: item.id,
    itemName,
  });

  const accountFrom = await createAccount({
    code: `AF-${suffix}`,
    name: `Account From ${suffix}`,
    rootType: "Asset",
  });
  const accountTo = await createAccount({
    code: `AT-${suffix}`,
    name: `Account To ${suffix}`,
    rootType: "Income",
  });

  const pe = await $zodula.doctype("Payment Entry").insert({
    payment_type: "Receive",
    posting_date: "2026-03-19",
    party_type: "Customer",
    party: customerName,
    paid_amount: 100,
    to_paid_amount: 100,
    payment_method: "Cash",
    account_paid_from: accountFrom.id,
    account_paid_to: accountTo.id,
    references: [
      {
        reference_type: "Sales Invoice",
        reference_id: invoice.id,
        allocate_amount: 100,
      },
    ],
  } as any).bypass(true);

  await $zodula.doctype("Payment Entry").submit(pe.id).bypass(true);

  const gl = await getGLRowsForPaymentEntry(pe.id);
  expect(gl.length).toBe(2);

  const byAccount = new Map<string, any>();
  for (const row of gl) {
    byAccount.set((row as any).account, row);
  }

  const rowFrom = byAccount.get(accountFrom.id);
  const rowTo = byAccount.get(accountTo.id);
  expect(rowFrom).toBeTruthy();
  expect(rowTo).toBeTruthy();

  expect(Number(rowFrom.debit_amount)).toBe(0);
  expect(Number(rowFrom.credit_amount)).toBe(100);

  expect(Number(rowTo.debit_amount)).toBe(100);
  expect(Number(rowTo.credit_amount)).toBe(0);

  expect(await getAccountBalance(accountFrom.id)).toBe(-100);
  expect(await getAccountBalance(accountTo.id)).toBe(-100);

  await $zodula.doctype("Payment Entry").cancel(pe.id).bypass(true);

  const glAfter = await getGLRowsForPaymentEntry(pe.id);
  expect(glAfter.length).toBe(0);
  expect(await getAccountBalance(accountFrom.id)).toBe(0);
  expect(await getAccountBalance(accountTo.id)).toBe(0);
});

test("Payment Entry: no references, unallocated drives total and GL", async () => {
  const suffix = uniqueSuffix();
  const customerName = `Test Customer ${suffix}`;
  await $zodula.doctype("Customer").insert({ name: customerName }).bypass(true);

  const accountFrom = await createAccount({
    code: `AF-${suffix}`,
    name: `Account From ${suffix}`,
    rootType: "Asset",
  });

  const pe = await $zodula.doctype("Payment Entry").insert({
    payment_type: "Receive",
    posting_date: "2026-03-19",
    party_type: "Customer",
    party: customerName,
    unallocated_amount: 80,
    paid_amount: 80,
    to_paid_amount: 80,
    payment_method: "Cash",
    account_paid_from: accountFrom.id,
    references: [],
  } as any).bypass(true);

  expect((pe as any).total_allocated).toBe(0);
  expect((pe as any).total_amount).toBe(80);

  await $zodula.doctype("Payment Entry").submit(pe.id).bypass(true);

  const gl = await getGLRowsForPaymentEntry(pe.id);
  expect(gl.length).toBe(1);
  expect(Number((gl[0] as any).credit_amount)).toBe(80);

  await $zodula.doctype("Payment Entry").cancel(pe.id).bypass(true);
});

test("Payment Entry: Pay flow supports Customer party (credit note refund)", async () => {
  const suffix = uniqueSuffix();
  const customerName = `Test Customer ${suffix}`;
  await $zodula.doctype("Customer").insert({ name: customerName }).bypass(true);

  const accountFrom = await createAccount({
    code: `AF-${suffix}`,
    name: `Account From ${suffix}`,
    rootType: "Asset",
  });

  const pe = await $zodula.doctype("Payment Entry").insert({
    payment_type: "Pay",
    posting_date: "2026-03-22",
    party_type: "Customer",
    party: customerName,
    unallocated_amount: 50,
    paid_amount: 50,
    to_paid_amount: 50,
    payment_method: "Cash",
    account_paid_from: accountFrom.id,
    references: [],
  } as any).bypass(true);

  await $zodula.doctype("Payment Entry").submit(pe.id).bypass(true);
  const gl = await getGLRowsForPaymentEntry(pe.id);
  expect(gl.length).toBe(1);
  expect(Number((gl[0] as any).credit_amount)).toBe(50);
  await $zodula.doctype("Payment Entry").cancel(pe.id).bypass(true);
});

