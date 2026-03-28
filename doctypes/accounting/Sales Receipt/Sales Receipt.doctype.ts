export default $doctype<"Sales Receipt">(
  {
    from_sales_invoice: {
      type: "Reference",
      label: "From Sales Invoice",
      reference: "Sales Invoice",
      required: 1,
    },
    customer: {
      type: "Reference",
      label: "Customer",
      reference: "Customer",
      required: 1,
      readonly: 1,
      fetch_from: "from_sales_invoice.customer",
    },
    customer_tax_id: {
      type: "Text",
      label: "Customer Tax ID",
      required: 0,
      readonly: 1,
    },
    customer_phone: {
      type: "Text",
      label: "Customer Phone",
      required: 0,
      readonly: 1,
    },
    customer_address: {
      type: "Text",
      label: "Customer Address",
      required: 0,
      readonly: 1,
    },
    delivery_note: {
      type: "Reference",
      label: "Delivery Note",
      reference: "Delivery Note",
      required: 0,
      no_print: 1,
      readonly: 1,
    },
    quotation: {
      type: "Reference",
      label: "Quotation",
      reference: "Quotation",
      required: 0,
      readonly: 1,
    },
    posting_date: {
      type: "Date",
      label: "Posting Date",
      required: 1,
      in_list_view: 1,
      default: "TODAY()",
      readonly: 1,
    },
    net_total: {
      type: "Currency",
      label: "Net Total",
      required: 0,
      readonly: 1,
    },
    vat_type: {
      type: "Select",
      label: "Vat Type",
      options: "Included\nExcluded",
      required: 0,
      readonly: 1,
    },
    vat_rate: {
      type: "Float",
      label: "VAT Rate",
      required: 0,
      readonly: 1,
    },
    total_taxes_and_charges: {
      type: "Currency",
      label: "VAT Amount",
      required: 0,
      readonly: 1,
    },
    grand_total: {
      type: "Currency",
      label: "Grand Total",
      required: 0,
      in_list_view: 1,
      readonly: 1,
    },
    sales_receipt_items: {
      type: "Reference Table",
      label: "Sales Receipt Items",
      reference: "Sales Receipt Item",
      required: 0,
      height: 200,
      readonly: 1,
    },
    billing_address: {
      type: "Reference",
      label: "Billing Address",
      reference: "Address",
      required: 0,
      no_print: 1,
      readonly: 1,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"]]),
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
      readonly: 1,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"]]),
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
      readonly: 1,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"]]),
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
      readonly: 1,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"]]),
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
    remarks: {
      type: "Text",
      label: "Remarks",
      required: 0,
      readonly: 1,
    },
  },
  {
    label: "Sales Receipt",
    naming_series: "SREC-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    comments_enabled: 1,
    search_fields: "customer",
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Main",
        layout: [
          { type: "section", value: "Receipt", align: "left" },
          [
            { type: "field", value: "from_sales_invoice", align: "left" },
            { type: "field", value: "customer", align: "left" },
            { type: "field", value: "posting_date", align: "left" },
          ],
          { type: "section", value: "Customer Information", align: "left" },
          [
            { type: "field", value: "customer_tax_id", align: "left" },
            { type: "field", value: "customer_phone", align: "left" },
            { type: "field", value: "customer_address", align: "left" },
          ],
          { type: "section", value: "Items", align: "left" },
          [
            { type: "field", value: "sales_receipt_items", align: "left" },
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
          [
            { type: "field", value: "remarks", align: "left" },
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
            { type: "field", value: "quotation", align: "left" },
            { type: "field", value: "delivery_note", align: "left" },
          ],
        ],
      },
    ]),
  }
)
  .on("before_change", async ({ doc }) => {
    const invId = String((doc as any).from_sales_invoice ?? "").trim();
    if (!invId) return;
    const inv = await $zodula.doctype("Sales Invoice").get(invId) as any;
    if (!inv) {
      throw new Error(`Sales Invoice ${invId} not found.`);
    }
    if (Number(inv.is_credit_note) === 1) {
      throw new Error("Sales Receipt cannot be created from a Credit Note.");
    }
    const d = doc as any;
    d.customer = inv.customer;
    d.customer_tax_id = inv.customer_tax_id ?? "";
    d.customer_phone = inv.customer_phone ?? "";
    d.customer_address = inv.customer_address ?? "";
    d.quotation = inv.quotation ?? "";
    d.delivery_note = inv.delivery_note ?? "";
    d.billing_address = inv.billing_address ?? "";
    d.shipping_address = inv.shipping_address ?? "";
    d.billing_contact = inv.billing_contact ?? "";
    d.shipping_contact = inv.shipping_contact ?? "";
    d.net_total = inv.net_total;
    d.vat_type = inv.vat_type;
    d.vat_rate = inv.vat_rate;
    d.total_taxes_and_charges = inv.total_taxes_and_charges;
    d.grand_total = inv.grand_total;
    const invItems = inv.sales_invoice_items as any[] | undefined;
    d.sales_receipt_items = Array.isArray(invItems)
      ? invItems.map((row: any) => ({
          item: row.item,
          item_name: row.item_name ?? "",
          item_image: row.item_image ?? "",
          item_description: row.item_description ?? "",
          quantity: row.quantity,
          uom: row.uom,
          unit_price: row.unit_price,
          total_price: row.total_price,
          weight: row.weight,
          volume: row.volume,
          length: row.length,
          width: row.width,
          height: row.height,
          volume_total: row.volume_total,
          weight_total: row.weight_total,
        }))
      : [];
  })
  .on("before_submit", async ({ doc }) => {
    const invId = String((doc as any).from_sales_invoice ?? "").trim();
    if (!invId) {
      throw new Error("From Sales Invoice is required.");
    }
    const inv = await $zodula.doctype("Sales Invoice").get(invId) as any;
    if (!inv) {
      throw new Error(`Sales Invoice ${invId} not found.`);
    }
    if (String(inv.doc_status ?? "") !== "Submitted") {
      throw new Error("Sales Invoice must be submitted.");
    }
    if (String(inv.payment_status ?? "") !== "Paid") {
      throw new Error("Sales Invoice payment status must be Paid.");
    }
    const { docs: existing } = await $zodula.doctype("Sales Receipt")
      .select()
      .where("from_sales_invoice", "=", invId)
      .where("doc_status", "=", "Submitted");
    const dup = existing.find((r: any) => r.id && r.id !== doc.id);
    if (dup) {
      throw new Error("A submitted Sales Receipt already exists for this Sales Invoice.");
    }
  });
