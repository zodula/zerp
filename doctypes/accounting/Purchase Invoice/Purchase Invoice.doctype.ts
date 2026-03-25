export default $doctype<"Purchase Invoice">(
  {
    supplier: {
      type: "Reference",
      label: "Supplier",
      reference: "Supplier",
      required: 1,
      no_print: 1,
    },
    delivery_trip: {
      type: "Reference",
      label: "Delivery Trip",
      reference: "Delivery Trip",
      required: 0,
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
      reference: "Price Project",
      required: 0,
      no_print: 1,
      filters: JSON.stringify([["is_buying", "=", 1]]),
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
            { type: "field", value: "delivery_trip", align: "left" },
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
            { type: "field", value: "delivery_trip", align: "left" },
          ],
        ],
      },
    ]),
  }
)
.on("before_change", async ({ doc }) => {
    const num = (v: any) => parseFloat(String(v ?? 0)) || 0;
    const items = (doc.purchase_invoice_items ?? []) as any[];
    const net = items.reduce((sum, r) => sum + num(r?.total_price), 0);
    doc.net_total = net;
    doc.total_taxes_and_charges = 0;
    doc.grand_total = net;
})

