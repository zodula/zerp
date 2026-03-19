export default $doctype<"Delivery Trip">({
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        in_list_view: 1,
        default: "TODAY()",
    },
    posting_time: {
        type: "Time",
        label: "Posting Time",
        required: 0,
        in_list_view: 1,
        default: "NOW()",
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
    delivery_trip_items: {
        type: "Reference Table",
        label: "Delivery Trip Items",
        reference: "Delivery Trip Item",
        required: 0,
    },
    delivery_trip_expense_items: {
        type: "Reference Table",
        label: "Delivery Trip Expense Items",
        reference: "Delivery Trip Expense Item",
        required: 0,
    },
    total_expense_amount: {
        type: "Currency",
        label: "Total Expense Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1,
    },
    payment_type: {
        type: "Select",
        label: "Payment Type",
        options: "Cash\nCheque\nBank\nOther",
        required: 0,
        in_list_view: 1,
    }
}, {
    label: "Delivery Trip",
    naming_series: "DOT-{YYYY}-{MM}-{DD}-{#####}",
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
                    { type: "field", value: "payment_type", align: "left" },
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
                { type: "section", value: "Delivery Trip Items", align: "left" },
                [
                    { type: "field", value: "delivery_trip_items", align: "left" },
                ],
                { type: "section", value: "Expenses", align: "left" },
                [
                    { type: "field", value: "delivery_trip_expense_items", align: "left" },
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
    const items = (doc as any).delivery_trip_expense_items;
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
