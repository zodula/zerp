export default $doctype<"Quotation">(
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
    ignore_price_project: {
      type: "Check",
      label: "Ignore Price Project",
      default: "0",
      no_print: 1,
      description: "Skip loading prices from Price list. Quotation submit never writes prices to Price.",
    },
    price_project: {
      type: "Reference",
      label: "Price Project",
      reference: "Price Project",
      required: 1,
      filters: JSON.stringify([["is_selling", "=", 1]]),
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
      label: "Valid Until",
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
    quotation_items: {
      type: "Reference Table",
      label: "Quotation Items",
      reference: "Quotation Item",
      required: 0,
      height: 200,
    },
    billing_address: {
      type: "Reference",
      label: "Billing Address",
      reference: "Address",
      required: 0,
      no_print: 1,
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
  },
  {
    label: "Quotation",
    naming_series: "QUO-{YYYY}-{MM}-{DD}-{#####}",
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
            { type: "field", value: "due_date", align: "left" },
            { type: "field", value: "ignore_price_project", align: "left" },
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
            { type: "field", value: "quotation_items", align: "left" },
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
    ]),
  },
)
  .on("before_change", async ({ doc }) => {
    const num = (v: any) => parseFloat(String(v ?? 0)) || 0;
    const items = doc.quotation_items as any[] | undefined;
    const netRaw = Array.isArray(items) ? items.reduce((sum, r) => sum + num(r?.total_price), 0) : 0;
    doc.net_total = Math.abs(netRaw);

    const docAny = doc as any;
    const vatType = (docAny.vat_type ?? "Excluded") as string;
    const vatRate = num(docAny.vat_rate);

    let vatAmount = 0;
    let grandTotal = doc.net_total as number;

    if (vatRate > 0) {
      if (vatType === "Excluded") {
        vatAmount = ((doc.net_total as number) * vatRate) / 100;
        grandTotal = (doc.net_total as number) + vatAmount;
      } else {
        const denom = 100 + vatRate;
        vatAmount = denom !== 0 ? ((doc.net_total as number) * vatRate) / denom : 0;
        grandTotal = doc.net_total as number;
      }
    }

    docAny.total_taxes_and_charges = vatAmount;
    docAny.grand_total = grandTotal;
  });
