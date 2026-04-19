export default $doctype<"Stock Entry Item">(
  {
    item: {
      type: "Reference",
      label: "Item",
      reference: "Item",
      required: 1,
      in_list_view: 1,
    },
    item_name: {
      type: "Text",
      label: "Item Name",
      readonly: 1,
      in_list_view: 1,
    },
    source_warehouse: {
      type: "Reference",
      label: "Source Warehouse",
      reference: "Warehouse",
      required: 0,
      in_list_view: 1,
      description: "Issue / transfer-out warehouse. Leave empty for pure receipt.",
    },
    target_warehouse: {
      type: "Reference",
      label: "Target Warehouse",
      reference: "Warehouse",
      required: 0,
      in_list_view: 1,
      description: "Receipt / transfer-in warehouse. Leave empty for pure issue.",
    },
    quantity: {
      type: "Float",
      label: "Quantity",
      required: 1,
      in_list_view: 1,
    },
    note: {
      type: "Text",
      label: "Note",
    },
  },
  {
    label: "Stock Entry Item",
    is_child_doctype: 1,
    search_fields: "item\nsource_warehouse\ntarget_warehouse",
  }
);
