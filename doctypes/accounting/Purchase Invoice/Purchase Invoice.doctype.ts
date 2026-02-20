export default $doctype<"zerp__Purchase Invoice">(
  {
    supplier: {
      type: "Reference",
      label: "Supplier",
      reference: "zerp__Supplier",
      required: 1,
      no_print: 1,
    },
    delivery_manifest: {
      type: "Reference",
      label: "Delivery Manifest",
      reference: "zerp__Delivery Manifest",
      required: 0,
      no_print: 1,
    },
    supplier_name: {
      type: "Text",
      label: "Supplier Name",
      required: 0,
      readonly: 1,
      in_list_view: 1,
      fetch_from: "supplier.name",
      no_print: 1,
    },
    supplier_tax_id: {
      type: "Text",
      label: "Supplier Tax ID",
      required: 0,
      readonly: 1,
      fetch_from: "supplier.tax_id",
    },
    supplier_phone: {
      type: "Text",
      label: "Supplier Phone",
      required: 0,
      readonly: 1,
      fetch_from: "supplier.phone",
    },
    supplier_address: {
      type: "Text",
      label: "Supplier Address",
      required: 0,
      readonly: 1,
      fetch_from: "supplier.address",
    },
    price_project: {
      type: "Reference",
      label: "Price Project",
      reference: "zerp__Price Project",
      required: 0,
      no_print: 1,
    },
    posting_date: {
      type: "Date",
      label: "Posting Date",
      required: 1,
      in_list_view: 1,
    },
    due_date: {
      type: "Date",
      label: "Due Date",
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
      label: "Total Taxes and Charges",
      required: 0,
      in_list_view: 1,
      readonly: 1,
    },
    total_amount: {
      type: "Currency",
      label: "Total Amount",
      required: 0,
      in_list_view: 1,
      readonly: 1,
    },
    payment_status: {
      type: "Select",
      label: "Payment Status",
      options: "Unpaid\nPartially Paid\nPaid",
      default: "Unpaid",
      required: 1,
      readonly: 1,
      no_print: 1,
      hidden: 1,
    },
    apply_tax_template: {
      type: "Reference",
      label: "Apply Tax Template",
      reference: "zerp__Tax Template",
      required: 0,
      no_print: 1
    },
    purchase_invoice_items: {
      type: "Reference Table",
      label: "Purchase Invoice Items",
      reference: "zerp__Purchase Invoice Item",
      required: 0
    },
    tax_and_charges: {
      type: "Reference Table",
      label: "Tax and Charges",
      reference: "zerp__Tax and Charges",
      required: 0
    },
    billing_address: {
      type: "Reference",
      label: "Billing Address",
      reference: "zerp__Address",
      required: 0,
      no_print: 1
    },
    billing_inline_address: {
      type: "Text",
      label: "Billing Inline Address",
      required: 0,
      readonly: 1,
      fetch_from: "billing_address.inline_address",
    },
    billing_address_name: {
      type: "Text",
      label: "Billing Address Name",
      required: 0,
      readonly: 1,
      fetch_from: "billing_address.address_name",
    },
    shipping_address: {
      type: "Reference",
      label: "Shipping Address",
      reference: "zerp__Address",
      required: 0,
      no_print: 1
    },
    shipping_inline_address: {
      type: "Text",
      label: "Shipping Inline Address",
      required: 0,
      readonly: 1,
      fetch_from: "shipping_address.inline_address",
    },
    shipping_address_name: {
      type: "Text",
      label: "Shipping Address Name",
      required: 0,
      readonly: 1,
      fetch_from: "shipping_address.address_name",
    },
    billing_contact: {
      type: "Reference",
      label: "Billing Contact",
      reference: "zerp__Contact",
      required: 0,
      no_print: 1
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
      reference: "zerp__Contact",
      required: 0,
      no_print: 1
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
    naming_series: "PINV{{organization_abbr}}-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    comments_enabled: 1,
    search_fields: "supplier\nsupplier_name",
    additional_connections: JSON.stringify([{
      doctype: "zerp__Payment Entry",
      filters: [["references.reference_type", "=", "zerp__Purchase Invoice"],["references.reference_id", "=", "{{id}}"]],
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
            { type: "field", value: "supplier_name", align: "left" },
            { type: "field", value: "delivery_manifest", align: "left" },
            { type: "field", value: "posting_date", align: "left" },
            { type: "field", value: "due_date", align: "left" },
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
            { type: "field", value: "total_amount", align: "left" },
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
            { type: "field", value: "billing_address_name", align: "left" },
            { type: "field", value: "billing_contact_name", align: "left" },
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
            { type: "field", value: "shipping_address_name", align: "left" },
            { type: "field", value: "shipping_contact_name", align: "left" },
          ],
          [
            { type: "field", value: "shipping_inline_address", align: "left" },
            { type: "field", value: "shipping_contact_inline", align: "left" },
          ],
        ],
      },
    ]),
  }
)
.on("before_change", async ({ doc }) => {
    // Calculate net_total from items
    let netTotal = 0;
    if (doc.purchase_invoice_items && Array.isArray(doc.purchase_invoice_items)) {
        for (const item of doc.purchase_invoice_items) {
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
    doc.total_amount = runningTotal;
});

