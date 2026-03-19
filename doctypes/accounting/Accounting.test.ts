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
  const productCategoryName = `Category ${suffix}`;
  const productName = `Product ${suffix}`;

  await $zodula.doctype("Customer").insert({ name: customerName }).bypass(true);
  await $zodula.doctype("UOM").insert({ name: uomName }).bypass(true);
  await $zodula
    .doctype("Product Category")
    .insert({ name: productCategoryName })
    .bypass(true);

  const product = await $zodula
    .doctype("Product")
    .insert({
      product_name: productName,
      product_category: productCategoryName,
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
          product: product.id,
          product_name: productName,
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
  const productCategoryName = `Category ${suffix}`;
  const productName = `Product ${suffix}`;

  await $zodula.doctype("Customer").insert({ name: customerName }).bypass(true);
  await $zodula.doctype("UOM").insert({ name: uomName }).bypass(true);
  await $zodula
    .doctype("Product Category")
    .insert({ name: productCategoryName })
    .bypass(true);

  const product = await $zodula
    .doctype("Product")
    .insert({
      product_name: productName,
      product_category: productCategoryName,
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
          product: product.id,
          product_name: productName,
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

