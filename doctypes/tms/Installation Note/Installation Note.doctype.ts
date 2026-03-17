export default $doctype<"Installation Note">(
  {
    delivery_note: {
      type: "Reference",
      label: "Delivery Note",
      reference: "Delivery Note",
      required: 1,
      in_list_view: 1,
      filters: JSON.stringify([["doc_status", "=", "Submitted"], ["installation_percentage", "<", "100"]]),
    },
    installation_proof: {
      type: "File",
      accept: "image/*",
      label: "Installation Proof",
      required: 0,
      in_list_view: 1,
    },
    installation_date: {
      type: "Date",
      label: "Installation Date",
      required: 1,
      in_list_view: 1,
      default: "TODAY()",
    },
    installation_time: {
      type: "Time",
      label: "Installation Time",
      required: 0,
      in_list_view: 1,
      default: "NOW()",
    },
    receiver_signature: {
      type: "Signature",
      label: "Receiver Signature",
      required: 1,
      in_list_view: 0,
      allow_on_submit: 1,
    },
    remarks: {
      type: "Long Text",
      label: "Remarks",
      required: 0,
    },
    installation_note_items: {
      type: "Reference Table",
      label: "Installation Note Items",
      reference: "Installation Note Item",
      required: 0,
      height: 200,
    },
  },
  {
    label: "Installation Note",
    naming_series: "IN-{{doc_organization_abbr}}-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "delivery_note",
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Main",
        layout: [
          { type: "section", value: "Reference", align: "left" },
          [
            { type: "field", value: "delivery_note", align: "left" },
          ],
          { type: "section", value: "Installation", align: "left" },
          [
            { type: "field", value: "installation_date", align: "left" },
            { type: "field", value: "installation_time", align: "left" },
            { type: "field", value: "remarks", align: "left" },
          ],
          { type: "section", value: "Items", align: "left" },
          [
            { type: "field", value: "installation_note_items", align: "left" },
          ],
          { type: "section", value: "Proof", align: "left" },
          [
            { type: "field", value: "installation_proof", align: "left" },
            { type: "field", value: "receiver_signature", align: "left" },
          ],
        ],
      },
    ]),
  }
)
  .on("before_submit", async ({ doc }) => {
    const deliveryNoteId = doc.delivery_note;
    if (!deliveryNoteId) throw new Error("Delivery Note is required");
    const dn = await $zodula.doctype("Delivery Note").get(deliveryNoteId);
    const dnItems = (dn as any).delivery_note_items as any[] | undefined;
    const allowedProducts = new Set<string>();
    if (Array.isArray(dnItems)) {
      for (const row of dnItems) {
        if (row?.product) allowedProducts.add(String(row.product));
      }
    }
    const items = doc.installation_note_items as any[] | undefined;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("At least one Installation Note Item is required");
    }
    for (const row of items) {
      const product = row?.product;
      if (!product) throw new Error("Each item must have a Product");
      if (!allowedProducts.has(String(product))) {
        throw new Error(`Product ${product} is not in the selected Delivery Note`);
      }
    }
  })
  .on("after_submit", async ({ doc }) => {
    if (doc.delivery_note) await updateDeliveryNoteInstallationPercentage(doc.delivery_note);
  })
  .on("after_cancel", async ({ doc }) => {
    if (doc.delivery_note) await updateDeliveryNoteInstallationPercentage(doc.delivery_note);
  });

async function updateDeliveryNoteInstallationPercentage(deliveryNoteId: string | undefined) {
  if (!deliveryNoteId) return;
  const dn = await $zodula.doctype("Delivery Note").get(deliveryNoteId) as any;
  const dnItems = dn?.delivery_note_items as any[] | undefined;
  let deliveredTotal = 0;
  if (Array.isArray(dnItems)) {
    for (const row of dnItems) {
      deliveredTotal += parseFloat(String(row?.quantity ?? 0)) || 0;
    }
  }
  const { docs: inDocs } = await $zodula.doctype("Installation Note")
    .select()
    .where("delivery_note", "=", deliveryNoteId)
    .where("doc_status", "=", "Submitted");
  let installedTotal = 0;
  for (const inDoc of inDocs) {
    const full = await $zodula.doctype("Installation Note").get(inDoc.id) as any;
    const items = full?.installation_note_items as any[] | undefined;
    if (Array.isArray(items)) {
      for (const row of items) {
        installedTotal += parseFloat(String(row?.quantity ?? 0)) || 0;
      }
    }
  }
  const pct = deliveredTotal > 0 ? Math.min(100, (installedTotal / deliveredTotal) * 100) : 0;
  await $zodula.doctype("Delivery Note").update(deliveryNoteId, { installation_percentage: pct });
}
