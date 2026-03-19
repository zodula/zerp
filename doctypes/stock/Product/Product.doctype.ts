export default $doctype<"Product">({
    product_name: {
        type: "Text",
        label: "Item Name",
        required: 1,
        in_list_view: 1,
        unique: 1,
        group: "group1",
    },
    product_category: {
        type: "Reference",
        label: "Product Category",
        reference: "Product Category",
        required: 1,
        in_list_view: 1
    },
    product_description: {
        type: "Text",
        label: "Item Description"
    },
    length: {
        type: "Float",
        label: "Length (cm)"
    },
    width: {
        type: "Float",
        label: "Width (cm)"
    },
    height: {
        type: "Float",
        label: "Height (cm)"
    },
    volume: {
        type: "Float",
        label: "Volume (cm³)",
        readonly: 1,
        description: "Automatically calculated: length × width × height"
    },
    weight: {
        type: "Float",
        label: "Weight (kg)"
    },
    barcode: {
        type: "Text",
        label: "Barcode"
    },
    uom: {
        type: "Reference",
        label: "UOM",
        reference: "UOM",
        required: 1,
        in_list_view: 1,
        group: "group1",
        unique: 1,
    },
    product_image: {
        type: "File",
        label: "Product Image"
    }
}, {
    label: "Product",
    naming_series: "ITM-{YYYY}{MM}{DD}{#####}",
    search_fields: "product_name\nuom",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "product_name", align: "left" },
                    { type: "field", value: "product_category", align: "left" }
                ],
                [
                    { type: "field", value: "product_description", align: "left" }
                ],
                { type: "section", value: "Dimensions & Weight", align: "left" },
                [
                    { type: "field", value: "length", align: "left" },
                    { type: "field", value: "width", align: "left" },
                    { type: "field", value: "height", align: "left" },
                    { type: "field", value: "volume", align: "left" },
                    { type: "field", value: "weight", align: "left" }
                ],
                { type: "section", value: "Barcode & UOM", align: "left" },
                [
                    { type: "field", value: "barcode", align: "left" },
                    { type: "field", value: "uom", align: "left" }
                ],
                { type: "section", value: "Product Image", align: "left" },
                [
                    { type: "field", value: "product_image", align: "left" }
                ],
                { type: "section", value: "Customers", align: "left" },
                [
                    { type: "field", value: "product_customer", align: "left" }
                ]
            ]
        }
    ])
})
    .on("before_save", async ({ doc }) => {
        const l = Number(doc.length || 0);
        const w = Number(doc.width || 0);
        const h = Number(doc.height || 0);
        doc.volume = l * w * h;
    })
    .on("after_change", async ({ doc }) => {
        const priceLists = await $zodula.doctype("Price").select().where("product", "=", doc?.id)
        for (const priceList of priceLists.docs) {
            // if product_name and uom are not match with product, update the price list
            if (priceList.product_name !== doc.product_name || priceList.uom !== doc.uom) {
                await $zodula.doctype("Price").update(priceList.id, {
                    product_name: doc.product_name,
                    uom: doc.uom
                } as any);
            }
        }
    })