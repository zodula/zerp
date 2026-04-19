const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

type MovementLine = {
  item: string;
  qty: number;
  source_warehouse?: string;
  target_warehouse?: string;
  note?: string;
};

async function getMaintainStockItemSet(itemIds: string[]): Promise<Set<string>> {
  const ids = Array.from(new Set(itemIds.map((v) => String(v || "").trim()).filter(Boolean)));
  if (!ids.length) return new Set<string>();
  const items = await $zodula
    .doctype("Item")
    .select()
    .where("id", "IN", ids)
    .limit(2000)
    .bypass(true);
  const set = new Set<string>();
  for (const row of items.docs ?? []) {
    if (Number((row as any).maintain_stock ?? 0) === 1) {
      set.add(String((row as any).id));
    }
  }
  return set;
}

async function getItemNameMap(itemIds: string[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(itemIds.map((v) => String(v || "").trim()).filter(Boolean)));
  if (!ids.length) return new Map<string, string>();
  const items = await $zodula
    .doctype("Item")
    .select()
    .where("id", "IN", ids)
    .limit(2000)
    .bypass(true);
  const out = new Map<string, string>();
  for (const row of items.docs ?? []) {
    out.set(String((row as any).id), String((row as any).item_name ?? ""));
  }
  return out;
}

async function createAndSubmitStockEntry(
  referenceDoctype: string,
  referenceId: string,
  postingDate: string,
  remarks: string,
  lines: MovementLine[]
) {
  const valid = lines.filter((l) => {
    const src = String(l.source_warehouse ?? "").trim();
    const tgt = String(l.target_warehouse ?? "").trim();
    const ok = !!l.item && num(l.qty) > 0 && (src || tgt) && !(src && tgt && src === tgt);
    return ok;
  });
  if (!valid.length) return;

  const itemNameMap = await getItemNameMap(valid.map((l) => l.item));
  const rows = valid.map((l) => ({
    item: l.item,
    item_name: itemNameMap.get(l.item) || l.item,
    source_warehouse: String(l.source_warehouse ?? "").trim() || undefined,
    target_warehouse: String(l.target_warehouse ?? "").trim() || undefined,
    quantity: num(l.qty),
    note: l.note || "",
  }));

  const se = await $zodula.doctype("Stock Entry").insert({
    posting_date: postingDate || $zodula.date.today(),
    reference_doctype: referenceDoctype,
    reference_id: referenceId,
    remarks,
    stock_entry_items: rows,
  } as any)
  .bypass(true)
  await $zodula.doctype("Stock Entry").submit((se as any).id);
}

export async function deleteStockEntryByReference(referenceDoctype: string, referenceId: string) {
  const docs = await $zodula
    .doctype("Stock Entry")
    .select()
    .where("reference_doctype", "=", referenceDoctype)
    .where("reference_id", "=", referenceId)
    .limit(200)
    .bypass(true);
  for (const row of docs.docs ?? []) {
    const id = String((row as any).id || "");
    if (!id) continue;
    const status = String((row as any).doc_status || "");
    if (status === "Submitted") {
      await $zodula.doctype("Stock Entry").cancel(id);
    }
    await $zodula.doctype("Stock Entry").delete(id);
  }
}

export async function createStockEntryForPurchaseInvoice(doc: any) {
  const warehouse = String(doc.source_warehouse ?? "").trim();
  const refId = String(doc.id ?? "").trim();
  if (!warehouse || !refId) return;
  const items = Array.isArray(doc.purchase_invoice_items) ? doc.purchase_invoice_items : [];
  const itemIds = items.map((r: any) => String(r?.item ?? "").trim()).filter(Boolean);
  const maintainSet = await getMaintainStockItemSet(itemIds);
  const agg = new Map<string, number>();
  for (const row of items) {
    const item = String((row as any)?.item ?? "").trim();
    if (!item || !maintainSet.has(item)) continue;
    const qty = num((row as any)?.quantity);
    if (qty <= 0) continue;
    agg.set(item, (agg.get(item) || 0) + qty);
  }
  const lines: MovementLine[] = Array.from(agg.entries()).map(([item, qty]) => ({
    item,
    qty,
    target_warehouse: warehouse,
  }));
  await createAndSubmitStockEntry(
    "Purchase Invoice",
    refId,
    String(doc.posting_date ?? $zodula.date.today()),
    `Stock from Purchase Invoice ${refId}`,
    lines
  );
}

export async function createStockEntryForSalesInvoice(doc: any) {
  const warehouse = String(doc.source_warehouse ?? "").trim();
  const refId = String(doc.id ?? "").trim();
  if (!warehouse || !refId) return;
  const items = Array.isArray(doc.sales_invoice_items) ? doc.sales_invoice_items : [];
  const itemIds = items.map((r: any) => String(r?.item ?? "").trim()).filter(Boolean);
  const maintainSet = await getMaintainStockItemSet(itemIds);
  const agg = new Map<string, number>();
  for (const row of items) {
    const item = String((row as any)?.item ?? "").trim();
    if (!item || !maintainSet.has(item)) continue;
    const qty = Math.abs(num((row as any)?.quantity));
    if (qty <= 0) continue;
    agg.set(item, (agg.get(item) || 0) + qty);
  }
  const isCreditNote = Number((doc as any).is_credit_note ?? 0) === 1;
  const lines: MovementLine[] = Array.from(agg.entries()).map(([item, qty]) =>
    isCreditNote
      ? { item, qty, target_warehouse: warehouse }
      : { item, qty, source_warehouse: warehouse }
  );
  await createAndSubmitStockEntry(
    "Sales Invoice",
    refId,
    String(doc.posting_date ?? $zodula.date.today()),
    `Stock from Sales Invoice ${refId}`,
    lines
  );
}

export async function createStockEntryForDeliveryTrip(doc: any) {
  const sourceWarehouse = String(doc.source_warehouse ?? "").trim();
  const targetWarehouse = String(doc.target_warehouse ?? "").trim();
  const refId = String(doc.id ?? "").trim();
  if (!sourceWarehouse || !targetWarehouse || !refId) return;
  if (sourceWarehouse === targetWarehouse) return;

  const tripRows = Array.isArray(doc.delivery_trip_items) ? doc.delivery_trip_items : [];
  const dnIds = Array.from(
    new Set(
      tripRows
        .map((r: any) => String((r as any)?.delivery_note ?? "").trim())
        .filter(Boolean)
    )
  );
  if (!dnIds.length) return;

  const qtyByItem = new Map<string, number>();
  const itemIds: string[] = [];
  for (const dnId of dnIds) {
    const dn = await $zodula.doctype("Delivery Note").get(dnId as string);
    const dnItems = Array.isArray((dn as any)?.delivery_note_items) ? (dn as any).delivery_note_items : [];
    for (const row of dnItems) {
      const item = String((row as any)?.item ?? "").trim();
      if (!item) continue;
      itemIds.push(item);
      const qty = Math.abs(num((row as any)?.quantity));
      if (qty <= 0) continue;
      qtyByItem.set(item, (qtyByItem.get(item) || 0) + qty);
    }
  }

  const maintainSet = await getMaintainStockItemSet(itemIds);
  const lines: MovementLine[] = [];
  for (const [item, qty] of qtyByItem.entries()) {
    if (!maintainSet.has(item)) continue;
    lines.push({
      item,
      qty,
      source_warehouse: sourceWarehouse,
      target_warehouse: targetWarehouse,
      note: `Transfer via Delivery Trip ${refId}`,
    });
  }

  await createAndSubmitStockEntry(
    "Delivery Trip",
    refId,
    String(doc.posting_date ?? $zodula.date.today()),
    `Stock transfer from Delivery Trip ${refId}`,
    lines
  );
}
