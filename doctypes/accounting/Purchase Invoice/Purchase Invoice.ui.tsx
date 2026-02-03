import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";
import { zodula } from "@/zodula/client";

const calculate = (frm: FormType) => {
    const items = frm.get_value("purchase_invoice_items") || [];
    if (Array.isArray(items)) {
        const totalAmount = items.reduce((total: number, item: any) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unit_price) || 0;
            return total + (quantity * unitPrice);
        }, 0);
        frm.set_value("total_amount", totalAmount);
        // Initialize payment_amount to total_amount for new invoices
        if (frm.is_new() || !frm.get_value("payment_amount")) {
            frm.set_value("payment_amount", totalAmount);
        }
    }
}

export default function PurchaseInvoiceScripts() {
    useEffect(() => {
        // Purchase Invoice Calculations - Calculate total from invoice items
        zui.form.on("zerp__Purchase Invoice", {
            purchase_invoice_items: function(frm) {
                calculate(frm);
            },
            total_amount: function(frm) {
                calculate(frm);
            },
            refresh: function(frm) {
                if (frm.is_new()) {
                    // Set default values for new invoices
                    if (!frm.get_value("invoice_date")) {
                        frm.set_value("invoice_date", new Date().toISOString().split('T')[0]);
                    }
                    if (!frm.get_value("due_date")) {
                        const dueDate = new Date();
                        dueDate.setDate(dueDate.getDate() + 30);
                        frm.set_value("due_date", dueDate.toISOString().split('T')[0]);
                    }
                    if (!frm.get_value("payment_status")) {
                        frm.set_value("payment_status", "Unpaid");
                    }
                }
            }
        });

        // Purchase Invoice List Scripts - Add badge for payment_status field
        zui.list.on("zerp__Purchase Invoice", {
            on_format: function(context) {
                context.addBadge("payment_status", {
                    variant: "default", // Will be determined dynamically
                    size: "sm",
                    getValue: (doc: any) => {
                        const status = doc.payment_status || "Unpaid";
                        // Return object with status and variant
                        return { status, variant: status === "Paid" ? "success" : status === "Partially Paid" ? "warning" : "default" };
                    }
                });
            }
        });
    }, []);

    return null; // This is a script component, not a visual component
}

