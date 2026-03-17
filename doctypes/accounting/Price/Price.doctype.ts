export default $doctype({
    price_project: {
        type: "Reference",
        label: "Price Project",
        reference: "Price Project",
        required: 1,
        in_list_view: 1
    },
    is_selling: {
        type: "Check",
        label: "Is Selling",
        default: "0",
        readonly: 1,
        description: "When enabled, this price is used for selling products.",
    },
    is_buying: {
        type: "Check",
        label: "Is Buying",
        default: "0",
        readonly: 1,
        description: "When enabled, this price is used for buying products.",
    },
    customer: {
        type: "Reference",
        label: "Customer",
        reference: "Customer",
        in_list_view: 1
    },
    customer_name: {
        type: "Text",
        label: "Customer Name",
        in_list_view: 1,
        readonly: 1,
        fetch_from: "customer.name"
    },
    supplier: {
        type: "Reference",
        label: "Supplier",
        reference: "Supplier",
        in_list_view: 1
    },
    supplier_name: {
        type: "Text",
        label: "Supplier Name",
        in_list_view: 1,
        readonly: 1,
        fetch_from: "supplier.name"
    },
    product: {
        type: "Reference",
        label: "Product",
        reference: "Product",
        required: 1,
        in_list_view: 1
    },
    product_name: {
        type: "Text",
        label: "Product Name",
        in_list_view: 1,
        readonly: 1,
        fetch_from: "product.product_name"
    },
    price: {
        type: "Float",
        label: "Price",
        required: 1,
        in_list_view: 1
    },
    uom: {
        type: "Reference",
        label: "UOM",
        reference: "UOM",
        required: 1,
        in_list_view: 1,
        readonly: 1,
        fetch_from: "product.uom"
    },
    from_date: {
        type: "Date",
        label: "From Date",
        required: 1
    },
    until_date: {
        type: "Date",
        label: "Until Date",
        required: 1
    },
}, {
    label: "Price",
    naming_series: "PL-{YYYY}-{MM}-{########}",
    search_fields: "product_name\nuom\nprice\nfrom_date\nuntil_date",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Party & Project", align: "left" },
                [
                    { type: "field", value: "price_project", align: "left" },
                    { type: "field", value: "is_selling", align: "left" },
                    { type: "field", value: "is_buying", align: "left" }
                ],
                [
                    { type: "field", value: "customer", align: "left" },
                    { type: "field", value: "supplier", align: "left" }
                ],
                [
                    { type: "field", value: "customer_name", align: "left" },
                    { type: "field", value: "supplier_name", align: "left" }
                ],
                { type: "section", value: "Product & Price", align: "left" },
                [
                    { type: "field", value: "product", align: "left" },
                    { type: "field", value: "product_name", align: "left" },
                    { type: "field", value: "uom", align: "left" }
                ],
                [
                    { type: "field", value: "price", align: "left" },
                    { type: "field", value: "from_date", align: "left" },
                    { type: "field", value: "until_date", align: "left" }
                ],
            ]
        }
    ])
})
    .on("before_save", async ({ doc }: { doc: Record<string, any> }) => {
        if (doc.party_type === "Customer") {
            doc.supplier = "";
        }
        if (doc.party_type === "Supplier") {
            doc.customer = "";
        }
        const fromDate = String(doc.from_date ?? "").trim();
        const untilDate = String(doc.until_date ?? "").trim();
        if (!fromDate || !untilDate) return;
        const { docs: others } = await $zodula.doctype("Price")
            .select()
            .where("price_project", "=", doc.price_project ?? "")
            .where("customer", "=", doc.customer ?? "")
            .where("supplier", "=", doc.supplier ?? "")
            .where("product", "=", doc.product ?? "")
            .where("uom", "=", doc.uom ?? "");
        const overlappingIds: string[] = [];
        for (const other of others ?? []) {
            if (other.id === doc.id) continue;
            const oFrom = String(other.from_date ?? "").trim();
            const oUntil = String(other.until_date ?? "").trim();
            if (!oFrom || !oUntil) continue;
            const overlaps = fromDate <= oUntil && oFrom <= untilDate;
            if (overlaps && other.id) overlappingIds.push(other.id);
        }
        if (overlappingIds.length > 0) {
            throw new Error(`Below Price(s) Have Overlapping Date:\n${overlappingIds.map((id) => `- ${id}`).join("\n")}`);
        }
    })
    .on("after_save", async (ctx) => {
        $zodula.enqueue("zodula.example", {

        })
    })