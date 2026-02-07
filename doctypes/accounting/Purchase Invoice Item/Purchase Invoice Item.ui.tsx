import { useEffect } from "react";
import { zui } from "@/zodula/ui";
import { zodula } from "@/zodula/client";

export default function PurchaseInvoiceItemScripts() {
    useEffect(() => {
        // Helper function to fetch price from Price List
        const fetchPriceFromPriceList = async (frm: any, updateUom: boolean = true) => {
            const doc = frm.get_doc();
            const productId = doc?.product;
            const priceProject = doc?.price_project;
            const supplier = doc?.supplier;
            const invoiceDate = doc?.posting_date;
            const uom = doc?.uom;
            // Guard: Check all required fields have values before fetching
            if (!productId || !priceProject || !supplier) {
                // If product is selected but required fields are missing, set price to 0
                if (productId) {
                    frm.set_value("unit_price", 0);
                }
                return;
            }

            try {
                // Query Price List for matching price
                const priceListResponse = await zodula.doc.select_docs("zerp__Price List", {
                    filters: [
                        ["price_project", "=", priceProject],
                        ["party_type", "=", "Supplier"],
                        ["supplier", "=", supplier],
                        ["product", "=", productId],
                        ["uom", "=", uom]
                    ],
                    limit: 100,
                    sort: "until_date",
                    order: "desc"
                });

                // Filter by until_date if posting_date is available
                // Only get price lists that are still valid (until_date is null or >= posting_date)
                let matchingPriceList = null;
                if (invoiceDate) {
                    matchingPriceList = priceListResponse.docs.find((pl: any) => {
                        // If until_date is null, it's always valid
                        if (!pl.until_date) return true;
                        // If until_date exists, it must be >= posting_date to be valid
                        const untilDate = new Date(pl.until_date);
                        const invDate = new Date(invoiceDate);
                        return untilDate >= invDate;
                    });
                } else {
                    // If no invoice date, get the first one without expiry or the most recent
                    matchingPriceList = priceListResponse.docs.find((pl: any) => !pl.until_date) || priceListResponse.docs[0];
                }

                if (matchingPriceList && matchingPriceList.price) {
                    // Always update price when fetching (user can still manually override)
                    frm.set_value("unit_price", matchingPriceList.price);
                    // Only update UOM from Price List if updateUom is true and UOM is not manually set
                    if (updateUom && matchingPriceList.uom) {
                        const currentUom = frm.get_value("uom");
                        // Only set UOM if it's empty or matches product's default (not manually changed)
                        if (!currentUom) {
                            frm.set_value("uom", matchingPriceList.uom);
                        }
                    }
                } else {
                    // No matching price list found, set price to 0
                    frm.set_value("unit_price", 0);
                }
            } catch (error) {
                console.error("Error fetching price from Price List:", error);
                // On error, set price to 0
                frm.set_value("unit_price", 0);
            }
        };

        // Purchase Invoice Item - Fetch product details and UOM when product changes
        zui.form.on("zerp__Purchase Invoice Item", {
            product: async function(frm) {
                const productId = frm.get_value("product");
                if (productId) {
                    try {
                        const product = await zodula.doc.get_doc("zerp__Product", productId, {});
                        if (product) {
                            // Set product name from product
                            if (product.product_name) {
                                frm.set_value("product_name", product.product_name);
                            }
                            // Set item description if available
                            if (product.item_description) {
                                frm.set_value("item_description", product.item_description);
                            }
                            // Set UOM from product's default_uom if not already set
                            if (product.default_uom && !frm.get_value("uom")) {
                                frm.set_value("uom", product.default_uom);
                            }
                        }

                        // Fetch price from Price List
                        await fetchPriceFromPriceList(frm);
                    } catch (error) {
                        console.error("Error fetching product:", error);
                    }
                } else {
                    // Clear fields if product is cleared
                    frm.set_value("product_name", "");
                    frm.set_value("item_description", "");
                    frm.set_value("uom", "");
                }
            },
            // Calculate total_price when quantity changes (don't fetch price - only calculate)
            quantity: async function(frm) {
                // Calculate total_price only
                const quantity = parseFloat(String(frm.get_value("quantity") || 0)) || 0;
                const unitPrice = parseFloat(String(frm.get_value("unit_price") || 0)) || 0;
                const totalPrice = quantity * unitPrice;
                frm.set_value("total_price", totalPrice);
                // Don't fetch price - only calculate total
            },
            // Calculate total_price when unit_price changes (don't fetch price - user is manually setting it)
            unit_price: async function(frm) {
                // Calculate total_price only
                const unitPrice = parseFloat(String(frm.get_value("unit_price") || 0)) || 0;
                const quantity = parseFloat(String(frm.get_value("quantity") || 0)) || 0;
                const totalPrice = quantity * unitPrice;
                frm.set_value("total_price", totalPrice);
                // Don't fetch price - user is manually setting it
            },
            // Calculate total_price when uom changes (don't fetch price - user may have manually set it)
            uom: async function(frm) {
                // Only calculate total_price, don't fetch price
                const quantity = parseFloat(String(frm.get_value("quantity") || 0)) || 0;
                const unitPrice = parseFloat(String(frm.get_value("unit_price") || 0)) || 0;
                const totalPrice = quantity * unitPrice;
                frm.set_value("total_price", totalPrice);
                // Don't fetch price - user may have manually set it
            },
            // Fetch price on form refresh (when parent fields might have changed)
            refresh: async function(frm) {
                await fetchPriceFromPriceList(frm);
            }
        });
    }, []);

    return null; // This is a script component, not a visual component
}

