import { useEffect } from "react";
import { zui } from "@/zodula/ui";
import { zodula } from "@/zodula/client";

export default function SalesInvoiceItemScripts() {
    useEffect(() => {
        zui.form.on("Sales Invoice Item", {
            product: async function (frm) {
                const productId = frm.get_value("product");
                if (productId) {
                    try {
                        const product = await zodula.doc.get_doc("Product", productId, {});
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
            price_list: async function (frm) {
                const priceListId = frm.get_value("price_list");
                if (!priceListId) return;
                try {
                    const pl = await zodula.doc.get_doc("Price List", priceListId, { fields: ["price", "uom"] });
                    if (pl?.price != null) {
                        frm.set_value("unit_price", pl.price);
                    }
                    if (pl?.uom) {
                        frm.set_value("uom", pl.uom);
                    }
                } catch (error) {
                    console.error("Error fetching Price List:", error);
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
        });
    }, []);

    return null;
}
