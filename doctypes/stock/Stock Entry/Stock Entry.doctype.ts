export default $doctype<"Stock Entry">(
  {
    posting_date: {
      type: "Date",
      label: "Posting Date",
      required: 1,
      default: "TODAY()",
      in_list_view: 1,
    },
    reference_doctype: {
      type: "Text",
      label: "Reference Doctype",
      required: 0,
      readonly: 1,
      in_list_view: 1,
    },
    reference_id: {
      type: "Text",
      label: "Reference ID",
      required: 0,
      readonly: 1,
      in_list_view: 1,
    },
    remarks: {
      type: "Text",
      label: "Remarks",
    },
    total_qty: {
      type: "Float",
      label: "Total Qty",
      readonly: 1,
      in_list_view: 1,
    },
    stock_entry_items: {
      type: "Reference Table",
      label: "Stock Entry Items",
      reference: "Stock Entry Item",
      required: 1,
      height: 220,
    },
  },
  {
    label: "Stock Entry",
    naming_series: "STE-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "reference_doctype\nreference_id",
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Main",
        layout: [
          { type: "section", value: "Basic", align: "left" },
          [
            { type: "field", value: "posting_date", align: "left" },
            { type: "field", value: "reference_doctype", align: "left" },
            { type: "field", value: "reference_id", align: "left" },
          ],
          [{ type: "field", value: "remarks", align: "left" }],
          { type: "section", value: "Items", align: "left" },
          [{ type: "field", value: "stock_entry_items", align: "left" }],
          [{ type: "empty" }, { type: "empty" }, { type: "field", value: "total_qty", align: "left" }],
        ],
      },
    ]),
  }
)
  .on("before_change", async ({ doc }) => {
    const rows = Array.isArray((doc as any).stock_entry_items) ? (doc as any).stock_entry_items : [];
    let sum = 0;
    for (const row of rows) {
      const q = Math.abs(parseFloat(String((row as any)?.quantity ?? 0)) || 0);
      (row as any).quantity = q;
      sum += q;
    }
    (doc as any).total_qty = sum;
  })
  .on("before_submit", async ({ doc }) => {
    const rows = Array.isArray((doc as any).stock_entry_items) ? (doc as any).stock_entry_items : [];
    if (!rows.length) {
      throw new Error("Stock Entry must have at least one item.");
    }
    for (const row of rows) {
      const item = String((row as any).item ?? "").trim();
      const src = String((row as any).source_warehouse ?? "").trim();
      const tgt = String((row as any).target_warehouse ?? "").trim();
      const qty = Math.abs(parseFloat(String((row as any).quantity ?? 0)) || 0);
      if (!item || qty <= 0) {
        throw new Error("Each stock row must include item and quantity > 0.");
      }
      if (!src && !tgt) {
        throw new Error("Each stock row must set Source Warehouse and/or Target Warehouse.");
      }
      if (src && tgt && src === tgt) {
        throw new Error("Source and Target Warehouse must differ when both are set.");
      }
      const itemDoc = await $zodula.doctype("Item").get(item);
      if (!itemDoc || Number((itemDoc as any).maintain_stock ?? 0) !== 1) {
        throw new Error(`Item ${item} is not maintain stock.`);
      }
    }
  });
