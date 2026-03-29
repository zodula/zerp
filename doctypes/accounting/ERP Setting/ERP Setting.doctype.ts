export default $doctype<"ERP Setting">(
  {
    is_save_price: {
      type: "Check",
      label: "Save Price",
      default: "0",
      description: "When enabled, submitted Delivery Note prices are saved to Price (days from price_save_for).",
    },
    price_save_for: {
      type: "Select",
      label: "Price Save For (Days)",
      options: "\n30\n60\n365",
      required: 0,
      description: "Number of days for saved price validity (used when Save Price to Price is on).",
      depends_on: "doc.is_save_price",
    },
    default_delivery_sales_item: {
      type: "Reference",
      label: "Default Delivery Sales Item",
      reference: "Item",
      required: 0,
      in_list_view: 1,
    },
    default_sales_invoice_price_project: {
      type: "Reference",
      label: "Default Sales Invoice Price Project",
      reference: "Price Project",
      required: 0,
    },
    default_purchase_invoice_price_project: {
      type: "Reference",
      label: "Default Purchase Invoice Price Project",
      reference: "Price Project",
      required: 0,
    },
    default_delivery_note_price_project: {
      type: "Reference",
      label: "Default Delivery Note Price Project",
      reference: "Price Project",
      required: 0,
    },
    default_vat_template: {
      type: "Reference",
      label: "Default VAT Template",
      reference: "VAT Template",
      required: 0,
      description: "Applied on new Sales Invoice and Delivery Note when VAT rate is not set yet.",
    },
    enable_delivery_order_weight_calculation: {
      type: "Check",
      label: "Enable Delivery Note Weight Calculation",
      default: "0",
      description: "When enabled, shows the Calculate Price By Weight button on Delivery Note items.",
    },
    default_write_off_account: {
      type: "Reference",
      label: "Write Off",
      reference: "Account",
      required: 0,
    },
    default_receivable_account: {
      type: "Reference",
      label: "Receivable",
      reference: "Account",
      required: 0,
    },
    default_payable_account: {
      type: "Reference",
      label: "Payable",
      reference: "Account",
      required: 0,
    },
    default_round_off_account: {
      type: "Reference",
      label: "Round Off",
      reference: "Account",
      required: 0,
    },
    default_payroll_payable_account: {
      type: "Reference",
      label: "Payroll Payable",
      reference: "Account",
      required: 0,
    },
    default_expense_claim_account: {
      type: "Reference",
      label: "Expense Claim",
      reference: "Account",
      required: 0,
    },
    default_employee_advance_account: {
      type: "Reference",
      label: "Employee Advance",
      reference: "Account",
      required: 0,
    },
  },
  {
    label: "ERP Setting",
    track_changes: 1,
    comments_enabled: 1,
    is_single: 1,
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Accounting",
        layout: [
          { type: "section", value: "Price", align: "left" },
          [
            { type: "field", value: "is_save_price", align: "left" },
            { type: "field", value: "price_save_for", align: "left" },
          ],
          { type: "section", value: "VAT", align: "left" },
          [
            { type: "field", value: "default_vat_template", align: "left" },
          ],
          { type: "section", value: "Default accounts", align: "left" },
          [
            { type: "field", value: "default_write_off_account", align: "left" },
            { type: "field", value: "default_receivable_account", align: "left" },
            { type: "field", value: "default_payable_account", align: "left" },
            { type: "field", value: "default_round_off_account", align: "left" },
            { type: "field", value: "default_payroll_payable_account", align: "left" },
            { type: "field", value: "default_expense_claim_account", align: "left" },
            { type: "field", value: "default_employee_advance_account", align: "left" },
          ],
        ],
      },
      {
        type: "Tab",
        label: "Price Project",
        layout: [
          { type: "section", value: "Defaults", align: "left" },
          [
            { type: "field", value: "default_sales_invoice_price_project", align: "left" },
            { type: "field", value: "default_purchase_invoice_price_project", align: "left" },
            { type: "field", value: "default_delivery_note_price_project", align: "left" },
          ],
        ],
      },
      {
        type: "Tab",
        label: "Delivery",
        layout: [
          [{ type: "field", value: "default_delivery_sales_item", align: "left" }],
          [{ type: "field", value: "enable_delivery_order_weight_calculation", align: "left" }],
        ],
      },
    ]),
  }
);
