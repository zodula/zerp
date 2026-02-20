export default $doctype<"Delivery Manifest">({
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        in_list_view: 1,
    },
    posting_time: {
        type: "Time",
        label: "Posting Time",
        required: 0,
        in_list_view: 1,
    },
    source_warehouse: {
        type: "Reference",
        label: "Source Warehouse",
        reference: "Warehouse",
        required: 1,
        in_list_view: 1,
    },
    target_warehouse: {
        type: "Reference",
        label: "Target Warehouse",
        reference: "Warehouse",
        required: 1,
        in_list_view: 1,
    },
    driver: {
        type: "Reference",
        label: "Driver",
        reference: "Driver",
        required: 0,
        in_list_view: 1,
    },
    driver_name: {
        type: "Text",
        label: "Driver Name",
        required: 0,
        readonly: 1,
        in_list_view: 1,
        fetch_from: "driver.name",
    },
    vehicle: {
        type: "Reference",
        label: "Vehicle",
        reference: "Vehicle",
        required: 0,
        in_list_view: 1,
    },
    vehicle_plate: {
        type: "Text",
        label: "Vehicle Plate",
        required: 0,
        readonly: 1,
        in_list_view: 1,
        fetch_from: "vehicle.plate_number",
    },
    transporter: {
        type: "Reference",
        label: "Transporter (Driver's Supplier)",
        reference: "Supplier",
        required: 0,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "driver.transporter",
    },
    transporter_name: {
        type: "Text",
        label: "Transporter Name",
        required: 0,
        readonly: 1,
        in_list_view: 1,
        fetch_from: "transporter.name",
    },
    delivery_manifest_items: {
        type: "Reference Table",
        label: "Delivery Manifest Items",
        reference: "Delivery Manifest Item",
        required: 0,
    },
    delivery_manifest_expense_items: {
        type: "Reference Table",
        label: "Delivery Manifest Expense Items",
        reference: "Delivery Manifest Expense Item",
        required: 0,
    },
    total_expense_amount: {
        type: "Currency",
        label: "Total Expense Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1,
    },
}, {
    label: "Delivery Manifest",
    naming_series: "DOT-{{organization_abbr}}-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "source_warehouse\ntarget_warehouse\ndriver\nvehicle\ntransporter",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Date & Time", align: "left" },
                [
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "posting_time", align: "left" },
                ],
                { type: "section", value: "Warehouses", align: "left" },
                [
                    { type: "field", value: "source_warehouse", align: "left" },
                    { type: "field", value: "target_warehouse", align: "left" },
                ],
                { type: "section", value: "Logistics", align: "left" },
                [
                    { type: "field", value: "driver", align: "left" },
                    { type: "field", value: "vehicle", align: "left" },
                    { type: "field", value: "transporter", align: "left" },
                ],
                [
                    { type: "field", value: "driver_name", align: "left" },
                    { type: "field", value: "vehicle_plate", align: "left" },
                    { type: "field", value: "transporter_name", align: "left" },
                ],
                { type: "section", value: "Delivery Manifest Items", align: "left" },
                [
                    { type: "field", value: "delivery_manifest_items", align: "left" },
                ],
                { type: "section", value: "Expenses", align: "left" },
                [
                    { type: "field", value: "delivery_manifest_expense_items", align: "left" },
                ],
                [
                    // empty
                    { type: "empty", value: "", align: "left" },
                    { type: "empty", value: "", align: "left" },
                    { type: "field", value: "total_expense_amount", align: "left" },
                ],
            ],
        },
    ]),
})
.on("before_change", async ({ doc }) => {
    let total = 0;
    const items = (doc as any).delivery_manifest_expense_items;
    if (Array.isArray(items)) {
        for (const row of items) {
            const qty = parseFloat(String((row as any).quantity ?? 0)) || 0;
            const rate = parseFloat(String((row as any).rate ?? 0)) || 0;
            const amount = parseFloat(String((row as any).amount ?? 0)) || qty * rate;
            total += amount;
        }
    }
    (doc as any).total_expense_amount = total;
});
