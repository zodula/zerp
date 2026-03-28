export default $doctype<"Item">({
    item_name: {
        type: "Text",
        label: "Item Name",
        required: 1,
        in_list_view: 1,
        unique: 1,
        group: "group1",
    },
    item_category: {
        type: "Reference",
        label: "Item Category",
        reference: "Item Category",
        required: 1,
        in_list_view: 1
    },
    item_description: {
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
    item_image: {
        type: "File",
        label: "Item Image"
    }
}, {
    label: "Item",
    naming_series: "ITM-{YYYY}{MM}{DD}{#####}",
    search_fields: "item_name\nuom",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "item_name", align: "left" },
                    { type: "field", value: "item_category", align: "left" }
                ],
                [
                    { type: "field", value: "item_description", align: "left" }
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
                { type: "section", value: "Item Image", align: "left" },
                [
                    { type: "field", value: "item_image", align: "left" }
                ],
                { type: "section", value: "Customers", align: "left" },
                [
                    { type: "field", value: "item_customer", align: "left" }
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
        const priceLists = await $zodula.doctype("Price").select().where("item", "=", doc?.id)
        for (const priceList of priceLists.docs) {
            // if item_name and uom are not match with item, update the price list
            if (priceList.item_name !== doc.item_name || priceList.uom !== doc.uom) {
                await $zodula.doctype("Price").update(priceList.id, {
                    item_name: doc.item_name,
                    item_image: doc.item_image,
                    uom: doc.uom
                } as any);
            }
        }
    })