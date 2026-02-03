import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";

const calculate = (frm: FormType) => {
    const items = frm.get_value("invoice_items") || [];
    if (Array.isArray(items)) {
        const totalAmount = items.reduce((total: number, item: any) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unit_price) || 0;
            return total + (quantity * unitPrice);
        }, 0);
        const exchangeRate = parseFloat(frm.get_value("exchange_rate")) || 1;
        const currencyAmount = totalAmount * exchangeRate;
        frm.set_value("total_amount", totalAmount);
        frm.set_value("currency_amount", currencyAmount);
    }
}

export default function InvoiceScripts() {
    useEffect(() => {
        // Invoice Calculations - Calculate total from invoice items
        zui.form.on("zerp__Invoice", {
            invoice_items: function(frm) {
                calculate(frm);
            },
            exchange_rate: function(frm) {
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
                    if (!frm.get_value("exchange_rate")) {
                        frm.set_value("exchange_rate", 1);
                    }
                    if (!frm.get_value("payment_status")) {
                        frm.set_value("payment_status", "Unpaid");
                    }
                }
            }
        });
    }, []);

    return null; // This is a script component, not a visual component
}
