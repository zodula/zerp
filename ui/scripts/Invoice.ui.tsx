import { useUIScriptRegistry, type UIScriptContext } from "@/zodula/ui/hooks/use-ui-script";
import { useEffect } from "react";

const calculate = (context: UIScriptContext) => {
    const items = context.getValue?.("invoice_items") || [];
    if (Array.isArray(items)) {
        const totalAmount = context.utils?.calculateTotal(items, 'quantity', 'unit_price') || 0;
        const exchangeRate = parseFloat(context.getValue?.("exchange_rate")) || 1;
        const currencyAmount = totalAmount * exchangeRate;
        context.setValue?.("total_amount", totalAmount);
        context.setValue?.("currency_amount", currencyAmount);
    }
}

export default function InvoiceScripts() {
    const { registerScript } = useUIScriptRegistry();

    useEffect(() => {

        // Invoice Calculations - Calculate total from invoice items
        registerScript("zerp__Invoice", {
            id: "invoice_calculations",
            doctype: "zerp__Invoice",
            name: "Invoice Calculations",
            description: "Calculate totals from invoice items",
            events: [
                {
                    type: "field_change",
                    target: "invoice_items",
                    action: async (context) => {
                        calculate(context);
                    }
                },
                {
                    type: "field_change",
                    target: "exchange_rate",
                    action: async (context) => {
                        calculate(context);
                    }
                },
                {
                    type: "field_change",
                    target: "total_amount",
                    action: async (context) => {
                        calculate(context);
                    }
                }
            ]
        });

        // Invoice Defaults - Set default values on form load
        registerScript("zerp__Invoice", {
            id: "invoice_defaults",
            doctype: "zerp__Invoice",
            name: "Invoice Defaults",
            description: "Set default values on form load",
            events: [
                {
                    type: "form_load",
                    action: async (context) => {
                        if (context.isCreate) {
                            // Set default values for new invoices
                            if (!context.getValue?.("invoice_date")) {
                                context.setValue?.("invoice_date", new Date().toISOString().split('T')[0]);
                            }
                            if (!context.getValue?.("due_date")) {
                                const dueDate = new Date();
                                dueDate.setDate(dueDate.getDate() + 30);
                                context.setValue?.("due_date", dueDate.toISOString().split('T')[0]);
                            }
                            if (!context.getValue?.("exchange_rate")) {
                                context.setValue?.("exchange_rate", 1);
                            }
                            if (!context.getValue?.("payment_status")) {
                                context.setValue?.("payment_status", "Unpaid");
                            }
                        }
                    }
                }
            ]
        });
    }, [])

    return null; // This is a script component, not a visual component
}
