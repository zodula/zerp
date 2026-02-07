export default $doctype(
  {
    customer: {
      type: "Reference",
      label: "Customer",
      reference: "zerp__Customer",
      required: 1,
      no_print: 1,
    },
    customer_name: {
      type: "Text",
      label: "Customer Name",
      required: 0,
      readonly: 1,
      in_list_view: 1,
      fetch_from: "customer.name",
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
    },
    sales_invoice_items: {
      type: "Reference Table",
      label: "Sales Invoice Items",
      reference: "zerp__Sales Invoice Item",
      reference_field: "sales_invoice",
      required: 0
    },
  },
  {
    label: "Sales Invoice",
    naming_series: "SINV{{organization}}{YYYY}{MM}{DD}{#####}",
    is_submittable: 1,
    track_changes: 1,
    comments_enabled: 1,
    search_fields: "customer\ncustomer_name",
    additional_connections: JSON.stringify([{
      doctype: "zerp__Payment Entry",
      filters: [["references.reference_type", "=", "zerp__Sales Invoice"],["references.reference_id", "=", "{{id}}"]],
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
            { type: "field", value: "price_project", align: "left" },
            { type: "field", value: "posting_date", align: "left" },
            { type: "field", value: "due_date", align: "left" },
          ],
          { type: "section", value: "Amounts", align: "left" },
          { type: "field", value: "sales_invoice_items", align: "left" },
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
            { type: "field", value: "payment_status", align: "left" },
          ],
        ],
      },
    ]),
  }
);