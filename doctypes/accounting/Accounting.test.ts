import { test } from "bun:test";
import { expect } from "bun:test";

let _suffixCounter = 0;
function uniqueSuffix() {
  // Mix timestamp + counter to avoid collisions across repeated test runs.
  _suffixCounter++;
  return `${Date.now()}-${_suffixCounter}`;
}

test("Sales Invoice: grand_total is computed from items", async () => {
  const suffix = uniqueSuffix();

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

  const invoice = await $zodula
    .doctype("Sales Invoice")
    .insert({
      customer: customerName,
      posting_date: "2026-03-19",
      due_date: "2026-03-19",
      sales_invoice_items: [
        {
          item: item.id,
          item_name: itemName,
          uom: uomName,
          quantity: 1,
          unit_price: 100,
          total_price: 100,
        },
      ],
    } as any)
    .bypass(true);

  const saved = await $zodula.doctype("Sales Invoice").get(invoice.id).bypass(true);
  expect(Number((saved as any).grand_total)).toBe(100);
});

test("Payment Entry: updates Sales Invoice payment_status via references", async () => {
  const suffix = uniqueSuffix();

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

  // Keep Sales Invoice in Draft; Payment Entry payment allocation should still work.
  const invoice = await $zodula
    .doctype("Sales Invoice")
    .insert({
      customer: customerName,
      posting_date: "2026-03-19",
      due_date: "2026-03-19",
      sales_invoice_items: [
        {
          item: item.id,
          item_name: itemName,
          uom: uomName,
          quantity: 1,
          unit_price: 100,
          total_price: 100,
        },
      ],
    } as any)
    .bypass(true);

  const paymentEntry = await $zodula
    .doctype("Payment Entry")
    .insert({
      payment_type: "Receive",
      posting_date: "2026-03-19",
      party_type: "Customer",
      party: customerName,
      paid_amount: 100,
      to_paid_amount: 100,
      payment_method: "Cash",
      references: [
        {
          reference_type: "Sales Invoice",
          reference_id: invoice.id,
          allocate_amount: 100,
        },
      ],
    } as any)
    .bypass(true);

  await $zodula
    .doctype("Payment Entry")
    .submit(paymentEntry.id)
    .bypass(true);

  const updatedInvoice = await $zodula
    .doctype("Sales Invoice")
    .get(invoice.id)
    .bypass(true);

  expect((updatedInvoice as any).payment_status).toBe("Paid");
});

test("Sales Invoice Credit Note: computes signed totals and links original invoice", async () => {
  const suffix = uniqueSuffix();

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

  const original = await $zodula
    .doctype("Sales Invoice")
    .insert({
      customer: customerName,
      posting_date: "2026-03-19",
      due_date: "2026-03-19",
      sales_invoice_items: [
        {
          item: item.id,
          item_name: itemName,
          uom: uomName,
          quantity: 1,
          unit_price: 100,
          total_price: 100,
        },
      ],
    } as any)
    .bypass(true);
  await $zodula.doctype("Sales Invoice").submit(original.id).bypass(true);

  const credit = await $zodula
    .doctype("Sales Invoice")
    .insert({
      customer: customerName,
      posting_date: "2026-03-20",
      due_date: "2026-03-20",
      is_credit_note: 1,
      return_against_sales_invoice: original.id,
      credit_note_reason: "Returned item",
      sales_invoice_items: [
        {
          item: item.id,
          item_name: itemName,
          uom: uomName,
          quantity: 1,
          unit_price: 100,
          total_price: 100,
        },
      ],
    } as any)
    .bypass(true);

  const saved = await $zodula.doctype("Sales Invoice").get(credit.id).bypass(true);
  expect(Number((saved as any).is_credit_note)).toBe(1);
  expect(String((saved as any).return_against_sales_invoice)).toBe(original.id);
  expect(Number((saved as any).grand_total)).toBe(-100);
});

test("Sales Invoice Credit Note: payment_status is updated by Payment Entry", async () => {
  const suffix = uniqueSuffix();

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

  const original = await $zodula
    .doctype("Sales Invoice")
    .insert({
      customer: customerName,
      posting_date: "2026-03-19",
      due_date: "2026-03-19",
      sales_invoice_items: [
        {
          item: item.id,
          item_name: itemName,
          uom: uomName,
          quantity: 1,
          unit_price: 100,
          total_price: 100,
        },
      ],
    } as any)
    .bypass(true);
  await $zodula.doctype("Sales Invoice").submit(original.id).bypass(true);

  const credit = await $zodula
    .doctype("Sales Invoice")
    .insert({
      customer: customerName,
      posting_date: "2026-03-20",
      due_date: "2026-03-20",
      is_credit_note: 1,
      return_against_sales_invoice: original.id,
      sales_invoice_items: [
        {
          item: item.id,
          item_name: itemName,
          uom: uomName,
          quantity: 1,
          unit_price: 100,
          total_price: 100,
        },
      ],
    } as any)
    .bypass(true);
  await $zodula.doctype("Sales Invoice").submit(credit.id).bypass(true);

  const pe = await $zodula
    .doctype("Payment Entry")
    .insert({
      payment_type: "Pay",
      posting_date: "2026-03-21",
      party_type: "Customer",
      party: customerName,
      paid_amount: 100,
      to_paid_amount: 100,
      payment_method: "Cash",
      references: [
        {
          reference_type: "Sales Invoice",
          reference_id: credit.id,
          allocate_amount: 100,
        },
      ],
    } as any)
    .bypass(true);
  await $zodula.doctype("Payment Entry").submit(pe.id).bypass(true);

  const updatedCredit = await $zodula.doctype("Sales Invoice").get(credit.id).bypass(true);
  expect((updatedCredit as any).payment_status).toBe("Paid");
});

