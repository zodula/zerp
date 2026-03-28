export default $doctype<"Purchase Invoice">(
  {
    supplier: {
      type: "Reference",
      label: "Supplier",
      reference: "Supplier",
      required: 1,
    },
    supplier_tax_id: {
      type: "Text",
      label: "Supplier Tax ID",
      required: 0,
      readonly: 1,
    },
    supplier_phone: {
      type: "Text",
      label: "Supplier Phone",
      required: 0,
      readonly: 1,
    },
    supplier_address: {
      type: "Text",
      label: "Supplier Address",
      required: 0,
      readonly: 1,
    },
    delivery_trip: {
      type: "Reference",
      label: "Delivery Trip",
      reference: "Delivery Trip",
      required: 0,
      readonly: 1,
    },
    ignore_price_project: {
      type: "Check",
      label: "Ignore Price Project",
      default: "0",
      no_print: 1,
      description: "Skip loading prices from Price list and do not save prices to Price on submit.",
    },
    price_project: {
      type: "Reference",
      label: "Price Project",
      reference: "Price Project",
      required: 1,
      filters: JSON.stringify([["is_buying", "=", 1]]),
      depends_on: "doc.ignore_price_project != 1",
      required_on: "doc.ignore_price_project != 1",
    },
    posting_date: {
      type: "Date",
      label: "Posting Date",
      required: 1,
      in_list_view: 1,
      default: "TODAY()",
    },
    due_date: {
      type: "Date",
      label: "Due Date",
      required: 1,
      in_list_view: 1,
      no_print: 1,
    },
    net_total: {
      type: "Currency",
      label: "Net Total",
      required: 0,
      in_list_view: 1,
      readonly: 1,
    },
    total_taxes_and_charges: {
      type: "Currency",
      label: "VAT Amount",
      required: 0,
      in_list_view: 1,
      readonly: 1,
    },
    grand_total: {
      type: "Currency",
      label: "Grand Total",
      required: 0,
      in_list_view: 1,
      readonly: 1,
    },
    payment_status: {
      type: "Select",
      label: "Payment Status",
      options: "To Bill\nUnpaid\nPartially Paid\nPaid",
      default: "To Bill",
      required: 1,
      readonly: 1,
      no_print: 1,
      hidden: 1,
    },
    apply_vat_template: {
      type: "Reference",
      label: "Apply VAT Template",
      reference: "VAT Template",
      required: 0,
      no_print: 1,
    },
    vat_type: {
      type: "Select",
      label: "Vat Type",
      options: "Included\nExcluded",
      default: "Excluded",
      required: 0,
      in_list_view: 1,
    },
    vat_rate: {
      type: "Float",
      label: "VAT Rate",
      required: 0,
      in_list_view: 1,
    },
    purchase_invoice_items: {
      type: "Reference Table",
      label: "Purchase Invoice Items",
      reference: "Purchase Invoice Item",
      required: 0,
      height: 200,
    },
    billing_address: {
      type: "Reference",
      label: "Billing Address",
      reference: "Address",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["link_type", "=", "Supplier"], ["link_id", "=", "{{supplier}}"]]),
    },
    billing_address_name: {
      type: "Text",
      label: "Billing Address Name",
      required: 0,
      readonly: 1,
      fetch_from: "billing_address.name",
    },
    billing_inline_address: {
      type: "Text",
      label: "Billing Inline Address",
      required: 0,
      readonly: 1,
      fetch_from: "billing_address.inline_address",
    },
    shipping_address: {
      type: "Reference",
      label: "Shipping Address",
      reference: "Address",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["link_type", "=", "Supplier"], ["link_id", "=", "{{supplier}}"]]),
    },
    shipping_address_name: {
      type: "Text",
      label: "Shipping Address Name",
      required: 0,
      readonly: 1,
      fetch_from: "shipping_address.name",
    },
    shipping_inline_address: {
      type: "Text",
      label: "Shipping Inline Address",
      required: 0,
      readonly: 1,
      fetch_from: "shipping_address.inline_address",
    },
    billing_contact: {
      type: "Reference",
      label: "Billing Contact",
      reference: "Contact",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["link_type", "=", "Supplier"], ["link_id", "=", "{{supplier}}"]]),
    },
    billing_contact_name: {
      type: "Text",
      label: "Billing Contact Name",
      required: 0,
      readonly: 1,
      fetch_from: "billing_contact.name",
    },
    billing_contact_inline: {
      type: "Text",
      label: "Billing Contact Inline",
      required: 0,
      readonly: 1,
      fetch_from: "billing_contact.inline_contact",
    },
    shipping_contact: {
      type: "Reference",
      label: "Shipping Contact",
      reference: "Contact",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["link_type", "=", "Supplier"], ["link_id", "=", "{{supplier}}"]]),
    },
    shipping_contact_name: {
      type: "Text",
      label: "Shipping Contact Name",
      required: 0,
      readonly: 1,
      fetch_from: "shipping_contact.name",
    },
    shipping_contact_inline: {
      type: "Text",
      label: "Shipping Contact Inline",
      required: 0,
      readonly: 1,
      fetch_from: "shipping_contact.inline_contact",
    },
  },
  {
    label: "Purchase Invoice",
    naming_series: "PINV-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    comments_enabled: 1,
    search_fields: "supplier",
    additional_connections: JSON.stringify([{
      doctype: "Payment Entry",
      filters: [["references.reference_type", "=", "Purchase Invoice"], ["references.reference_id", "=", "{{id}}"]],
      field: "references.reference_id"
    }]),
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Main",
        layout: [
          { type: "section", value: "Basic Information", align: "left" },
          [
            { type: "field", value: "supplier", align: "left" },
            { type: "field", value: "posting_date", align: "left" },
            { type: "field", value: "due_date", align: "left" },
            { type: "field", value: "ignore_price_project", align: "left" },
            { type: "field", value: "price_project", align: "left" },
          ],
          { type: "section", value: "Supplier Information", align: "left" },
          [
            { type: "field", value: "supplier_tax_id", align: "left" },
            { type: "field", value: "supplier_phone", align: "left" },
            { type: "field", value: "supplier_address", align: "left" },
          ],
          { type: "section", value: "Items", align: "left" },
          [
            { type: "field", value: "purchase_invoice_items", align: "left" },
          ],
          { type: "section", value: "VAT Configuration", align: "left" },
          [
            { type: "field", value: "apply_vat_template", align: "left" },
          ],
          { type: "section", value: "Tax and Totals", align: "left" },
          [
            { type: "empty" },
            { type: "empty" },
            { type: "field", value: "net_total", align: "left" },
          ],
          [
            { type: "empty" },
            { type: "empty" },
            { type: "field", value: "vat_type", align: "left" },
          ],
          [
            { type: "empty" },
            { type: "empty" },
            { type: "field", value: "vat_rate", align: "left" },
          ],
          [
            { type: "empty" },
            { type: "empty" },
            { type: "field", value: "total_taxes_and_charges", align: "left" },
          ],
          [
            { type: "empty" },
            { type: "empty" },
            { type: "field", value: "grand_total", align: "left" },
          ],
        ],
      },
      {
        type: "Tab",
        label: "Addresses",
        layout: [
          { type: "section", value: "Billing Address", align: "left" },
          [
            { type: "field", value: "billing_address", align: "left" },
            { type: "field", value: "billing_address_name", align: "left" },
            { type: "field", value: "billing_inline_address", align: "left" },
          ],
          [
            { type: "field", value: "billing_contact", align: "left" },
            { type: "field", value: "billing_contact_name", align: "left" },
            { type: "field", value: "billing_contact_inline", align: "left" },
          ],
          { type: "section", value: "Shipping Address", align: "left" },
          [
            { type: "field", value: "shipping_address", align: "left" },
            { type: "field", value: "shipping_address_name", align: "left" },
            { type: "field", value: "shipping_inline_address", align: "left" },
          ],
          [
            { type: "field", value: "shipping_contact", align: "left" },
            { type: "field", value: "shipping_contact_name", align: "left" },
            { type: "field", value: "shipping_contact_inline", align: "left" },
          ],
        ],
      },
      {
        type: "Tab",
        label: "References",
        layout: [
          { type: "section", value: "References", align: "left" },
          [
            { type: "field", value: "delivery_trip", align: "left" },
          ],
        ],
      },
    ]),
  }
)
  .on("before_change", async ({ doc }) => {
    const num = (v: any) => parseFloat(String(v ?? 0)) || 0;
    const items = doc.purchase_invoice_items as any[] | undefined;
    const net = Array.isArray(items) ? items.reduce((sum, r) => sum + num(r?.total_price), 0) : 0;
    doc.net_total = net;

    const docAny = doc as any;
    const vatType = (docAny.vat_type ?? "Excluded") as string;
    const vatRate = num(docAny.vat_rate);

    let vatAmount = 0;
    let grandTotal = net;

    if (vatRate > 0) {
      if (vatType === "Excluded") {
        vatAmount = (net * vatRate) / 100;
        grandTotal = net + vatAmount;
      } else {
        const denom = 100 + vatRate;
        vatAmount = denom !== 0 ? (net * vatRate) / denom : 0;
        grandTotal = net;
      }
    }

    docAny.total_taxes_and_charges = vatAmount;
    docAny.grand_total = grandTotal;
    if (!docAny.payment_status || docAny.payment_status === "To Bill") {
      docAny.payment_status = "Unpaid";
    }
  })
  .on("after_submit", async ({ doc }) => {
    if (!doc.id) return;
    if (Number((doc as any).ignore_price_project) === 1) return;
    const erp = await $zodula.doctype("ERP Setting").select().limit(1).then(r => r.docs[0]);
    const isSavePrice = erp?.is_save_price === 1;
    const priceSaveFor = erp?.price_save_for;
    if (!isSavePrice || !priceSaveFor) return;
    const priceProject = doc.price_project;
    const supplier = doc.supplier;
    if (!priceProject || !supplier) return;
    const days = parseInt(String(priceSaveFor), 10);
    if (Number.isNaN(days) || days <= 0) return;
    const baseDate = doc.posting_date ? String(doc.posting_date) : $zodula.date.today();
    const untilDate = $zodula.date.format($zodula.date.add(baseDate, days, "days"), "date");
    const items = doc.purchase_invoice_items as any[] | undefined;
    if (!Array.isArray(items)) return;
    for (const item of items) {
      const itemId = item?.item;
      const uom = item?.uom;
      const unitPrice = item?.unit_price != null ? parseFloat(String(item.unit_price)) : NaN;
      if (!itemId || !uom || Number.isNaN(unitPrice)) continue;
      const { docs } = await $zodula.doctype("Price")
        .select()
        .where("price_project", "=", priceProject)
        .where("supplier", "=", supplier)
        .where("is_buying", "=", 1)
        .where("item", "=", itemId)
        .where("uom", "=", uom)
        .limit(1);
      if (docs.length === 0) {
        await $zodula.doctype("Price").insert({
          price_project: priceProject,
          is_buying: 1,
          supplier,
          item: itemId,
          item_name: item?.item_name ?? "",
          price: unitPrice,
          uom,
          from_date: baseDate,
          until_date: untilDate,
        });
      }
    }
  });
