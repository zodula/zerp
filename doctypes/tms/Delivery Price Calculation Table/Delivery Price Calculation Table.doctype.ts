export default $doctype({
    pricing_project: {
        type: "Reference",
        label: "Price Project",
        reference: "Price Project",
        required: 1,
        in_list_view: 1,
    },
    volume_divider: {
        type: "Integer",
        label: "Volume Divider",
        required: 1,
        description: "Used to convert volume to weight equivalent for pricing.",
    },
    delivery_price_calculation_table_items: {
        type: "Reference Table",
        label: "Delivery Price Calculation Table Items",
        reference: "Delivery Price Calculation Table Item",
        required: 0,
    },
}, {
    label: "Delivery Price Calculation Table",
    naming_series: "DPCT-{YYYY}-{MM}-{########}",
    search_fields: "pricing_project",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "pricing_project", align: "left" },
                    { type: "field", value: "volume_divider", align: "left" },
                ],
                { type: "section", value: "Price Rules", align: "left" },
                [
                    { type: "field", value: "delivery_price_calculation_table_items", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_save", async ({ doc }) => {
        const items = (doc as any).delivery_price_calculation_table_items as any[] | undefined;
        if (!Array.isArray(items) || items.length === 0) return;
        items.sort((a, b) => {
            const wa = parseFloat(String((a as any).weight ?? 0)) || 0;
            const wb = parseFloat(String((b as any).weight ?? 0)) || 0;
            return wa - wb;
        });
        (doc as any).delivery_price_calculation_table_items = items;
    });

