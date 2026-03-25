export default $doctype<"Delivery Note">(
  {
    customer: {
      type: "Reference",
      label: "Customer",
      reference: "Customer",
      required: 1,
      no_print: 1,
    },
    customer_tax_id: {
      type: "Text",
      label: "Customer Tax ID",
      required: 0,
      readonly: 1,
      no_print: 1,
    },
    customer_phone: {
      type: "Text",
      label: "Customer Phone",
      required: 0,
      readonly: 1,
      no_print: 1,
    },
    customer_address: {
      type: "Text",
      label: "Customer Address",
      required: 0,
      readonly: 1,
      no_print: 1,
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
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["is_selling", "=", 1]]),
      depends_on: "!doc.ignore_price_project",
    },
    posting_date: {
      type: "Date",
      label: "Posting Date",
      required: 1,
      in_list_view: 1,
      default: "TODAY()",
    },
    source_warehouse: {
      type: "Reference",
      label: "Source Warehouse",
      reference: "Warehouse",
      required: 0,
      in_list_view: 1,
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
    delivery_note_items: {
      type: "Reference Table",
      label: "Delivery Note Items",
      reference: "Delivery Note Item",
      required: 0,
      height: 200, // 200px
    },
    billing_inline_address: {
      type: "Text",
      label: "Billing Inline Address",
      required: 0,
      readonly: 1,
      fetch_from: "billing_address.inline_address",
    },
    billing_address: {
      type: "Reference",
      label: "Billing Address",
      reference: "Address",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"], ["address_type", "=", "Billing"]]),
    },
    shipping_address: {
      type: "Reference",
      label: "Shipping Address",
      reference: "Address",
      required: 1,
      no_print: 1,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"], ["address_type", "=", "Shipping"]]),
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
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"]]),
    },
    shipping_contact_inline: {
      type: "Text",
      label: "Shipping Contact Inline",
      required: 0,
      readonly: 1,
      fetch_from: "shipping_contact.inline_contact",
    },
    sender_address: {
      type: "Reference",
      label: "Sender Address",
      reference: "Address",
      required: 0,
      no_print: 0,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"], ["address_type", "=", "Sender"]]),
    },
    sender_inline_address: {
      type: "Text",
      label: "Sender Inline Address",
      required: 0,
      readonly: 1,
      fetch_from: "sender_address.inline_address",
    },
    sender_contact: {
      type: "Reference",
      label: "Sender Contact",
      reference: "Contact",
      required: 0,
      no_print: 0,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"]]),
    },
    sender_contact_inline: {
      type: "Text",
      label: "Sender Contact Inline",
      required: 0,
      readonly: 1,
      fetch_from: "sender_contact.inline_contact",
    },
    to_warehouse: {
      type: "Reference",
      label: "To Warehouse",
      reference: "Warehouse",
      required: 0,
      no_print: 0,
      readonly: 1,
    },
    installation_percentage: {
      type: "Float",
      label: "Installation %",
      required: 1,
      readonly: 1,
      default: "0",
      no_print: 1,
      in_list_view: 1,
    },
  },
  {
    label: "Delivery Note",
    naming_series: "DO-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    comments_enabled: 1,
    search_fields: "customer",
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Main",
        layout: [
          { type: "section", value: "Basic Information", align: "left" },
          [
            { type: "field", value: "customer", align: "left" },
            { type: "field", value: "posting_date", align: "left" },
            { type: "field", value: "ignore_price_project", align: "left" },
            { type: "field", value: "price_project", align: "left" },
          ],
          { type: "section", value: "Customer Information", align: "left" },
          [
            { type: "field", value: "customer_tax_id", align: "left" },
            { type: "field", value: "customer_phone", align: "left" },
            { type: "field", value: "customer_address", align: "left" },
          ],
          { type: "section", value: "Sender", align: "left" },
          [
            { type: "field", value: "sender_address", align: "left" },
            { type: "field", value: "sender_inline_address", align: "left" },
          ],
          [
            { type: "field", value: "sender_contact", align: "left" },
            { type: "field", value: "sender_contact_inline", align: "left" },
          ],
          { type: "section", value: "Shipping", align: "left" },
          [
            { type: "field", value: "shipping_address", align: "left" },
            { type: "field", value: "shipping_inline_address", align: "left" },
          ],
          [
            { type: "field", value: "shipping_contact", align: "left" },
            { type: "field", value: "shipping_contact_inline", align: "left" },
          ],
          { type: "section", value: "Items", align: "left" },
          [
            { type: "field", value: "source_warehouse", align: "left" },
            { type: "field", value: "physical_bill_no", align: "left" },
          ],
          [
            { type: "field", value: "delivery_note_items", align: "left" },
          ],
          { type: "section", value: "VAT Configuration", align: "left" },
          [
            { type: "field", value: "apply_vat_template", align: "left" },
            { type: "field", value: "vat_type", align: "left" },
            { type: "field", value: "vat_rate", align: "left" },
          ],
          { type: "section", value: "Totals", align: "left" },
          [
            { type: "field", value: "net_total", align: "left" },
            { type: "field", value: "total_taxes_and_charges", align: "left" },
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
            { type: "field", value: "billing_contact", align: "left" },
          ],
          [
            { type: "field", value: "billing_inline_address", align: "left" },
            { type: "field", value: "billing_contact_inline", align: "left" },
          ],
        ],
      },
      {
        type: "Tab",
        label: "More Information",
        layout: [
          { type: "section", value: "Installation", align: "left" },
          [
            { type: "field", value: "installation_percentage", align: "left" },
          ],
          { type: "section", value: "Trip Information", align: "left" },
          [
            { type: "field", value: "to_warehouse", align: "left" },
          ]
        ],
      }
    ]),
  }
)
  .on("before_change", async ({ doc }) => {
    const num = (v: any) => parseFloat(String(v ?? 0)) || 0;
    const items = doc.delivery_note_items as any[] | undefined;
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
        // VAT is included in the net_total, so extract the VAT portion.
        const denom = 100 + vatRate;
        vatAmount = denom !== 0 ? (net * vatRate) / denom : 0;
        grandTotal = net;
      }
    }

    docAny.total_taxes_and_charges = vatAmount;
    docAny.grand_total = grandTotal;
  })
  .on("before_save", async ({ doc }) => {
    if (doc.source_warehouse) {
      doc.to_warehouse = doc.source_warehouse;
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
    const customer = doc.customer;
    if (!priceProject || !customer) return;
    const days = parseInt(String(priceSaveFor), 10);
    if (Number.isNaN(days) || days <= 0) return;
    const baseDate = doc.posting_date ? String(doc.posting_date) : $zodula.date.today();
    const untilDate = $zodula.date.format($zodula.date.add(baseDate, days, "days"), "date");
    const items = doc.delivery_note_items as any[] | undefined;
    if (!Array.isArray(items)) return;
    for (const item of items) {
      const product = item?.product;
      const uom = item?.uom;
      const unitPrice = item?.unit_price != null ? parseFloat(String(item.unit_price)) : NaN;
      if (!product || !uom || Number.isNaN(unitPrice)) continue;
      const { docs } = await $zodula.doctype("Price")
        .select()
        .where("price_project", "=", priceProject)
        .where("customer", "=", customer)
        .where("is_selling", "=", 1)
        .where("from_date", "<=", baseDate)
        .where("until_date", ">=", baseDate)
        .where("product", "=", product)
        .limit(1);
      if (docs.length === 0) {
        await $zodula.doctype("Price").insert({
          price_project: priceProject,
          is_selling: 1,
          customer,
          product,
          product_name: item?.product_name ?? "",
          price: unitPrice,
          uom,
          from_date: baseDate,
          until_date: untilDate,
        });
      }
    }
  })