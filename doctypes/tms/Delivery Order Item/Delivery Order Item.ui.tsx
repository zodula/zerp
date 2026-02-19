import { useEffect } from "react";
import { zui } from "@/zodula/ui";
import { zodula } from "@/zodula/client";

export default function DeliveryOrderItemScripts() {
    useEffect(() => {
        const fetchPriceFromPriceList = async (frm: any, updateUom: boolean = true) => {
            const doc = frm.get_doc();
            const productId = doc?.product;
            const priceProject = doc?.price_project;
            const customer = doc?.customer;
            const postingDate = doc?.posting_date;
            const uom = doc?.uom;

            if (!productId || !priceProject || !customer) {
                if (productId) {
                    frm.set_value("unit_price", 0);
                }
                return;
            }

            try {
                const priceListResponse = await zodula.doc.select_docs("zerp__Price List", {
                    filters: [
                        ["price_project", "=", priceProject],
                        ["party_type", "=", "Customer"],
                        ["customer", "=", customer],
                        ["product", "=", productId],
                        ["uom", "=", uom]
                    ],
                    limit: 100,
                    sort: "until_date",
                    order: "desc"
                });

                let matchingPriceList = null;
                if (postingDate) {
                    matchingPriceList = priceListResponse.docs.find((pl: any) => {
                        if (!pl.until_date) return true;
                        const untilDate = new Date(pl.until_date);
                        const invDate = new Date(postingDate);
                        return untilDate >= invDate;
                    });
                } else {
                    matchingPriceList = priceListResponse.docs.find((pl: any) => !pl.until_date) || priceListResponse.docs[0];
                }

                if (matchingPriceList && matchingPriceList.price) {
                    frm.set_value("unit_price", matchingPriceList.price);
                    if (updateUom && matchingPriceList.uom) {
                        const currentUom = frm.get_value("uom");
                        if (!currentUom) {
                            frm.set_value("uom", matchingPriceList.uom);
                        }
                    }
                } else {
                    frm.set_value("unit_price", 0);
                }
            } catch (error) {
                console.error("Error fetching price from Price List:", error);
                frm.set_value("unit_price", 0);
            }
        };

        zui.form.on("zerp__Delivery Order Item", {
            product: async function (frm) {
                const productId = frm.get_value("product");
                if (productId) {
                    try {
                        const product = await zodula.doc.get_doc("zerp__Product", productId, {});
                        if (product) {
                            if (product.product_name) {
                                frm.set_value("product_name", product.product_name);
                            }
                            if (product.item_description) {
                                frm.set_value("item_description", product.item_description);
                            }
                            if (product.default_uom && !frm.get_value("uom")) {
                                frm.set_value("uom", product.default_uom);
                            }
                        }
                        await fetchPriceFromPriceList(frm);
                    } catch (error) {
                        console.error("Error fetching product:", error);
                    }
                } else {
                    frm.set_value("product_name", "");
                    frm.set_value("item_description", "");
                    frm.set_value("uom", "");
                }
                const quantity = parseFloat(String(frm.get_value("quantity") || 0)) || 0;
                const unitPrice = parseFloat(String(frm.get_value("unit_price") || 0)) || 0;
                frm.set_value("total_price", quantity * unitPrice);
            },
            quantity: async function (frm) {
                const quantity = parseFloat(String(frm.get_value("quantity") || 0)) || 0;
                const unitPrice = parseFloat(String(frm.get_value("unit_price") || 0)) || 0;
                frm.set_value("total_price", quantity * unitPrice);
            },
            unit_price: async function (frm) {
                const unitPrice = parseFloat(String(frm.get_value("unit_price") || 0)) || 0;
                const quantity = parseFloat(String(frm.get_value("quantity") || 0)) || 0;
                frm.set_value("total_price", quantity * unitPrice);
            },
            uom: async function (frm) {
                const quantity = parseFloat(String(frm.get_value("quantity") || 0)) || 0;
                const unitPrice = parseFloat(String(frm.get_value("unit_price") || 0)) || 0;
                frm.set_value("total_price", quantity * unitPrice);
            },
            refresh: async function (frm) {
                await fetchPriceFromPriceList(frm);
            }
        });
    }, []);

    return null;
}
