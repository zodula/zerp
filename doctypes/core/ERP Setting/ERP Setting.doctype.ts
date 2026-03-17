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
    default_delivery_sales_product: {
      type: "Reference",
      label: "Default Delivery Sales Product",
      reference: "Product",
      required: 0,
      in_list_view: 1,
    },
    default_delivery_note_price_project: {
      type: "Reference",
      label: "Default Delivery Note Price Project",
      reference: "Price Project",
      required: 0,
    },
    default_delivery_note_tax_template: {
      type: "Reference",
      label: "Default Delivery Note Tax Template",
      reference: "Tax Template",
      required: 0,
    },
    enable_delivery_order_weight_calculation: {
      type: "Check",
      label: "Enable Delivery Order Weight Calculation",
      default: "0",
      description: "When enabled, shows the Calculate Price By Weight button on Delivery Note items.",
    },
    additional_menu_delivery_note_tracking: {
      type: "Check",
      label: "Delivery Note Tracking",
      default: "0",
      description: "Show Track Delivery link on organization name card (public org page).",
    },
  },
  {
    label: "ERP Setting",
    is_organization_single: 1,
    track_changes: 1,
    comments_enabled: 1,
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Website",
        layout: [
          { type: "section", value: "Name Card Menu", align: "left" },
          [{ type: "field", value: "additional_menu_delivery_note_tracking", align: "left" }],
        ],
      },
      {
        type: "Tab",
        label: "Accounting",
        layout: [
          { type: "section", value: "Price", align: "left" },
          [
            { type: "field", value: "is_save_price", align: "left" },
            { type: "field", value: "price_save_for", align: "left" },
          ],
        ],
      },
      {
        type: "Tab",
        label: "Delivery",
        layout: [
          [{ type: "field", value: "default_delivery_sales_product", align: "left" }],
          [
            { type: "field", value: "default_delivery_note_price_project", align: "left" },
            { type: "field", value: "default_delivery_note_tax_template", align: "left" },
          ],
          [{ type: "field", value: "enable_delivery_order_weight_calculation", align: "left" }],
        ],
      },
    ]),
  }
);
