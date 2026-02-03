export default $doctype(
  {
    supplier: {
      type: "Reference",
      label: "Supplier",
      reference: "zerp__Supplier",
      required: 1,
      in_list_view: 1,
    },
    price_project: {
      type: "Reference",
      label: "Price Project",
      reference: "zerp__Price Project",
      required: 0,
      in_list_view: 1,
    },
    invoice_date: {
      type: "Date",
      label: "Invoice Date",
      required: 1,
      in_list_view: 1,
    },
    due_date: {
      type: "Date",
      label: "Due Date",
      required: 1,
    },
    total_amount: {
      type: "Currency",
      label: "Total Amount",
      required: 0,
      in_list_view: 1,
      readonly: 1,
    },
    payment_amount: {
      type: "Currency",
      label: "Payment Amount",
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
      in_list_view: 1,
      readonly: 1,
      no_print: 1,
    },
    purchase_invoice_items: {
      type: "Reference Table",
      label: "Purchase Invoice Items",
      reference: "zerp__Purchase Invoice Item",
      required: 0
    },
  },
  {
    label: "Purchase Invoice",
    naming_series: "PINV-{{invoice_date}}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    comments_enabled: 1,
    search_fields: "supplier\nstatus",
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Main",
        layout: [
          { type: "section", value: "Basic Information", align: "left" },
          [
            { type: "field", value: "supplier", align: "left" },
            { type: "field", value: "price_project", align: "left" },
            { type: "field", value: "invoice_date", align: "left" },
            { type: "field", value: "due_date", align: "left" },
          ],
          { type: "section", value: "Amounts", align: "left" },
          { type: "field", value: "purchase_invoice_items", align: "left" },
          [
            { type: "field", value: "total_amount", align: "left" },
          ],
        ],
      },
      {
        type: "Tab",
        label: "Payment",
        layout: [
          { type: "section", value: "Payment Information", align: "left" },
          [
            { type: "field", value: "payment_amount", align: "left" },
            { type: "field", value: "payment_status", align: "left" },
          ],
        ],
      },
    ]),
  }
);

