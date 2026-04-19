export default $doctype<"Delivery Note">(
  {
    customer: {
      type: "Reference",
      label: "Customer",
      reference: "Customer",
      required: 1,
    },
    customer_tax_id: {
      type: "Text",
      label: "Customer Tax ID",
      required: 0,
      no_print: 1,
      readonly: 1,
    },
    customer_phone: {
      type: "Text",
      label: "Customer Phone",
      required: 0,
      no_print: 1,
      readonly: 1,
    },
    customer_address: {
      type: "Text",
      label: "Customer Address",
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
      unique: 1,
      filters: JSON.stringify([["doc_status", "=", "Submitted"]]),
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
      required: 1,
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
    billing_address: {
      type: "Reference",
      label: "Billing Address",
      reference: "Address",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"], ["address_type", "=", "Billing"]]),
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
    billing_inline_contact: {
      type: "Text",
      label: "Billing Inline Contact",
      required: 0,
      readonly: 1,
      fetch_from: "billing_address.inline_contact",
    },
    shipping_address: {
      type: "Reference",
      label: "Shipping Address",
      reference: "Address",
      required: 1,
      no_print: 1,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"], ["address_type", "=", "Shipping"]]),
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
    shipping_inline_contact: {
      type: "Text",
      label: "Shipping Inline Contact",
      required: 0,
      readonly: 1,
      fetch_from: "shipping_address.inline_contact",
    },
    sender_address: {
      type: "Reference",
      label: "Sender Address",
      reference: "Address",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", "{{customer}}"], ["address_type", "=", "Sender"]]),
    },
    sender_address_name: {
      type: "Text",
      label: "Sender Address Name",
      required: 0,
      readonly: 1,
      fetch_from: "sender_address.name",
    },
    sender_inline_address: {
      type: "Text",
      label: "Sender Inline Address",
      required: 0,
      readonly: 1,
      fetch_from: "sender_address.inline_address",
    },
    sender_inline_contact: {
      type: "Text",
      label: "Sender Inline Contact",
      required: 0,
      readonly: 1,
      fetch_from: "sender_address.inline_contact",
    },
    target_warehouse: {
      type: "Reference",
      label: "Target Warehouse",
      reference: "Warehouse",
      required: 0,
      no_print: 1,
      readonly: 1,
    },
    driver: {
      type: "Reference",
      label: "Driver",
      reference: "Driver",
      required: 0,
      readonly: 1,
      no_print: 1,
    },
    vehicle: {
      type: "Reference",
      label: "Vehicle",
      reference: "Vehicle",
      required: 0,
      readonly: 1,
      no_print: 1,
    },
    transporter: {
      type: "Reference",
      label: "Transporter (Driver's Supplier)",
      reference: "Supplier",
      required: 0,
      readonly: 1,
      no_print: 1,
      fetch_from: "driver.transporter",
    },
    installation_percentage: {
      type: "Float",
      label: "Installation %",
      readonly: 1,
      default: "0",
      no_print: 1,
      in_list_view: 1,
    },
    installation_status: {
      type: "Select",
      label: "Installation Status",
      options: "Open\nClosed",
      default: "Open",
      required: 0,
      allow_on_submit: 1,
      no_print: 1,
      in_list_view: 1,
    },
    installation_close_remark: {
      type: "Long Text",
      label: "Installation Close Remark",
      required: 0,
      allow_on_submit: 1,
      no_print: 1,
      depends_on: "doc.installation_status == 'Closed'",
    },
  },
  {
    label: "Delivery Note",
    naming_series: "DN-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    comments_enabled: 1,
    default_show_id_qrcode: 1,
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
            { type: "field", value: "payment_status", align: "left" },
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
            { type: "empty" },
            { type: "empty" },
          ],
          [
            { type: "field", value: "sender_address_name", align: "left" },
            { type: "field", value: "sender_inline_address", align: "left" },
            { type: "field", value: "sender_inline_contact", align: "left" },
          ],
          { type: "section", value: "Shipping", align: "left" },
          [
            { type: "field", value: "shipping_address", align: "left" },
            { type: "empty" },
            { type: "empty" },
          ],
          [
            { type: "field", value: "shipping_address_name", align: "left" },
            { type: "field", value: "shipping_inline_address", align: "left" },
            { type: "field", value: "shipping_inline_contact", align: "left" },
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
            { type: "empty" },
            { type: "empty" },
          ],
          [
            { type: "field", value: "billing_address_name", align: "left" },
            { type: "field", value: "billing_inline_address", align: "left" },
            { type: "field", value: "billing_inline_contact", align: "left" },
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
            { type: "field", value: "installation_status", align: "left" },
          ],
          [
            { type: "field", value: "installation_close_remark", align: "left" },
          ],
          { type: "section", value: "Trip Information", align: "left" },
          [
            { type: "field", value: "target_warehouse", align: "left" },
            { type: "field", value: "driver", align: "left" },
            { type: "field", value: "vehicle", align: "left" },
            { type: "field", value: "transporter", align: "left" },
          ],
          [
            { type: "field", value: "driver_name", align: "left" },
            { type: "field", value: "vehicle_plate", align: "left" },
            { type: "field", value: "transporter_name", align: "left" },
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

    const installPct = num(docAny.installation_percentage);
    if (installPct >= 100) {
      docAny.installation_status = "Closed";
    } else if (docAny.installation_status === "Closed") {
      const remark = String(docAny.installation_close_remark ?? "").trim();
      if (!remark) {
        throw new Error(
          "Installation is Closed but Installation % is not 100. Enter Installation Close Remark."
        );
      }
    }
  })
  .on("before_save", async ({ doc }) => {
    if (doc.source_warehouse) {
      (doc as any).target_warehouse = doc.source_warehouse;
    }
  })
  .on("before_submit", async ({ doc }) => {
    const qid = String((doc as any).quotation ?? "").trim();
    if (!qid) return;
    const q = await $zodula.doctype("Quotation").get(qid);
    if (!q) {
      throw new Error(`Quotation ${qid} not found.`);
    }
    const qAny = q as any;
    if (String(qAny.doc_status ?? "") !== "Submitted") {
      throw new Error("Linked Quotation must be Submitted.");
    }
    if (Number(qAny.is_delivery_order) !== 1) {
      throw new Error(
        "Delivery Note requires a Quotation with Is Delivery Order enabled."
      );
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
    for (const row of items) {
      const itemId = row?.item;
      const uom = row?.uom;
      const unitPrice = row?.unit_price != null ? parseFloat(String(row.unit_price)) : NaN;
      if (!itemId || !uom || Number.isNaN(unitPrice)) continue;
      const { docs } = await $zodula.doctype("Price")
        .select()
        .where("price_project", "=", priceProject)
        .where("customer", "=", customer)
        .where("is_selling", "=", 1)
        .where("from_date", "<=", baseDate)
        .where("until_date", ">=", baseDate)
        .where("item", "=", itemId)
        .limit(1);
      if (docs.length === 0) {
        await $zodula.doctype("Price").insert({
          price_project: priceProject,
          is_selling: 1,
          customer,
          item: itemId,
          item_name: row?.item_name ?? "",
          price: unitPrice,
          uom,
          from_date: baseDate,
          until_date: untilDate,
        });
      }
    }
  })