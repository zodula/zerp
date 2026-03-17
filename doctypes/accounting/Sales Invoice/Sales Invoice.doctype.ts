export default $doctype<"Sales Invoice">(
  {
    customer: {
      type: "Reference",
      label: "Customer",
      reference: "Customer",
      required: 1,
      no_print: 1,
    },
    customer_name: {
      type: "Text",
      label: "Customer Name",
      required: 0,
      readonly: 1,
      in_list_view: 1,
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
    delivery_note: {
      type: "Reference",
      label: "Delivery Note",
      reference: "Delivery Note",
      required: 0,
      no_print: 1,
      readonly: 1,
    },
    price_project: {
      type: "Reference",
      label: "Price Project",
      reference: "Price Project",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["is_selling", "=", 1]]),
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
      label: "Total Taxes and Charges",
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
    apply_tax_template: {
      type: "Reference",
      label: "Apply Tax Template",
      reference: "Tax Template",
      required: 0,
      no_print: 1
    },
    sales_invoice_items: {
      type: "Reference Table",
      label: "Sales Invoice Items",
      reference: "Sales Invoice Item",
      required: 0,
      height: 200,
    },
    tax_and_charges: {
      type: "Reference Table",
      label: "Tax and Charges",
      reference: "Tax and Charges",
      required: 0
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
      filters: JSON.stringify([["links.link_doctype", "=", "Customer"], ["links.link_id", "=", "{{customer}}"]]),
    },
    shipping_address: {
      type: "Reference",
      label: "Shipping Address",
      reference: "Address",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["links.link_doctype", "=", "Customer"], ["links.link_id", "=", "{{customer}}"]]),
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
      filters: JSON.stringify([["links.link_doctype", "=", "Customer"], ["links.link_id", "=", "{{customer}}"]]),
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
      filters: JSON.stringify([["links.link_doctype", "=", "Customer"], ["links.link_id", "=", "{{customer}}"]]),
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
    label: "Sales Invoice",
    naming_series: "SINV{{doc_organization_abbr}}-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    comments_enabled: 1,
    search_fields: "customer\ncustomer_name",
    additional_connections: JSON.stringify([{
      doctype: "Payment Entry",
      filters: [["references.reference_type", "=", "Sales Invoice"], ["references.reference_id", "=", "{{id}}"]],
      field: "references.reference_id"
    }]),
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Main",
        layout: [
          { type: "section", value: "Basic Information", align: "left" },
          [
            { type: "field", value: "customer", align: "left" },
            { type: "field", value: "customer_name", align: "left" },
            { type: "field", value: "posting_date", align: "left" },
            { type: "field", value: "due_date", align: "left" },
            { type: "field", value: "price_project", align: "left" },
          ],
          { type: "section", value: "Customer Information", align: "left" },
          [
            { type: "field", value: "customer_tax_id", align: "left" },
            { type: "field", value: "customer_phone", align: "left" },
            { type: "field", value: "customer_address", align: "left" },
          ],
          { type: "section", value: "Items", align: "left" },
          [
            { type: "field", value: "sales_invoice_items", align: "left" },
          ],
          { type: "section", value: "Tax Configuration", align: "left" },
          [
            { type: "field", value: "apply_tax_template", align: "left" },
          ],
          { type: "section", value: "Taxes and Charges", align: "left" },
          [
            { type: "field", value: "tax_and_charges", align: "left" },
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
          { type: "section", value: "Shipping Address", align: "left" },
          [
            { type: "field", value: "shipping_address", align: "left" },
            { type: "field", value: "shipping_contact", align: "left" },
          ],
          [
            { type: "field", value: "shipping_inline_address", align: "left" },
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
            { type: "field", value: "delivery_note", align: "left" },
          ],
        ],
      },
    ]),
  }
)
  .on("before_change", async ({ doc }) => {
    // Calculate net_total from items
    let netTotal = 0;
    if (doc.sales_invoice_items && Array.isArray(doc.sales_invoice_items)) {
      for (const item of doc.sales_invoice_items) {
        const totalPrice = parseFloat(String((item as any).total_price || 0)) || 0;
        netTotal += totalPrice;
      }
    }
    doc.net_total = netTotal;

    // Calculate taxes and charges
    const taxRows = doc.tax_and_charges && Array.isArray(doc.tax_and_charges) ? doc.tax_and_charges : [];

    // Sort by idx to ensure proper order
    const sortedTaxRows = [...taxRows].sort((a: any, b: any) => {
      const idxA = (a as any).idx || 0;
      const idxB = (b as any).idx || 0;
      return idxA - idxB;
    });

    let runningTotal = netTotal;
    let totalTaxesAndCharges = 0;

    for (let i = 0; i < sortedTaxRows.length; i++) {
      const taxRow = sortedTaxRows[i] as any;
      const chargeType = taxRow.charge_type || "Actual";
      const rate = parseFloat(String(taxRow.rate || 0)) || 0;
      let taxAmount = 0;

      if (chargeType === "Actual") {
        taxAmount = parseFloat(String(taxRow.tax_amount || 0)) || 0;
      } else if (chargeType === "On Net Total") {
        taxAmount = (netTotal * rate) / 100;
      } else if (chargeType === "On Previous Row Amount") {
        if (i > 0) {
          const prevRow = sortedTaxRows[i - 1] as any;
          const prevTaxAmount = parseFloat(String(prevRow.tax_amount || 0)) || 0;
          taxAmount = (prevTaxAmount * rate) / 100;
        }
      } else if (chargeType === "On Previous Row Total") {
        if (i > 0) {
          const prevRow = sortedTaxRows[i - 1] as any;
          // Use tax_amount instead of total for "On Previous Row Total"
          const prevTaxAmount = parseFloat(String(prevRow.tax_amount || 0)) || 0;
          taxAmount = (prevTaxAmount * rate) / 100;
        }
      }

      taxRow.tax_amount = taxAmount;

      // For excluded taxes, add to running total; for included, it's already in the base
      if (taxRow.tax_type === "Excluded") {
        runningTotal += taxAmount;
        totalTaxesAndCharges += taxAmount;
      } else {
        // For included taxes, they're already in the base amount
        totalTaxesAndCharges += taxAmount;
      }
    }

    doc.total_taxes_and_charges = totalTaxesAndCharges;
    doc.grand_total = runningTotal;
  })
  .on("after_change", async ({ doc }) => {
    // Sync payment_status to linked Delivery Note when this Sales Invoice is saved
    const deliveryOrderId = (doc as any).delivery_note;
    const paymentStatus = (doc as any).payment_status;
    if (deliveryOrderId && paymentStatus) {
      try {
        await $zodula.doctype("Delivery Note").update(deliveryOrderId, {
          payment_status: paymentStatus
        } as any);
      } catch (error) {
        console.error("Error syncing Delivery Note payment_status:", error);
      }
    }
  })
  .on("after_submit", async ({ doc }) => {
    const org = doc.doc_organization;
    if (!org) return;
    const erp = await $zodula.doctype("ERP Setting").get(`ERP Setting - ${org}`);
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
    const items = doc.sales_invoice_items as any[] | undefined;
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
        .where("product", "=", product)
        .where("uom", "=", uom)
        .limit(1);
      if (docs.length === 0) {
        await $zodula.doctype("Price").insert({
          price_project: priceProject,
          is_selling: 1,
          customer,
          customer_name: doc.customer_name ?? "",
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