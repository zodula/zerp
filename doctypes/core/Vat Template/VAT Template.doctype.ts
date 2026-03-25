export default $doctype<"VAT Template">(
  {
    title: {
      type: "Text",
      label: "Title",
      required: 1,
      in_list_view: 1,
    },
    vat_type: {
      type: "Select",
      label: "VAT Type",
      options: "Included\nExcluded",
      default: "Excluded",
      required: 1,
      in_list_view: 1,
    },
    vat_rate: {
      type: "Float",
      label: "VAT Rate",
      required: 0,
      in_list_view: 1,
    },
  },
  {
    label: "VAT Template",
    naming_series: "{{title}}",
    search_fields: "title",
    is_quick_entry: 1,
    tabs: JSON.stringify([
      {
        type: "Tab",
        label: "Main",
        layout: [
          { type: "section", value: "VAT", align: "left" },
          [
            { type: "field", value: "title", align: "left" },
            { type: "field", value: "vat_type", align: "left" },
            { type: "field", value: "vat_rate", align: "left" },
          ],
        ],
      },
    ]),
  }
);
