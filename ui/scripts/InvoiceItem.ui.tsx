import { useUIScriptRegistry } from "@/zodula/ui/hooks/use-ui-script";
import { useEffect } from "react";

export default function InvoiceItemScripts() {
    const { registerScript } = useUIScriptRegistry();

    useEffect(() => {
        // Invoice Item Calculations - Calculate total price
        registerScript("zerp__Invoice Item", {
            id: "invoice_item_calculations",
            doctype: "zerp__Invoice Item",
            name: "Invoice Item Calculations",
            description: "Calculate total price from quantity and unit price",
            events: [
                {
                    type: "field_change",
                    target: "quantity",
                    action: async (context) => {
                        const quantity = parseFloat(context.value) || 0;
                        const unitPrice = parseFloat(context.getValue?.("unit_price")) || 0;
                        const totalPrice = quantity * unitPrice;
                        context.setValue?.("total_price", totalPrice);
                    }
                },
                {
                    type: "field_change",
                    target: "unit_price",
                    action: async (context) => {
                        const unitPrice = parseFloat(context.value) || 0;
                        const quantity = parseFloat(context.getValue?.("quantity")) || 0;
                        const totalPrice = quantity * unitPrice;
                        context.setValue?.("total_price", totalPrice);
                    }
                }
            ]
        });
    }, [])

    return null; // This is a script component, not a visual component
}
