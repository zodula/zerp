import { useEffect } from "react";
import { zui } from "@/zodula/ui";

export default function InvoiceItemScripts() {
    useEffect(() => {
        // Invoice Item Calculations - Calculate total price
        zui.form.on("zerp__Invoice Item", {
            quantity: function(frm) {
                const quantity = parseFloat(frm.get_value("quantity")) || 0;
                const unitPrice = parseFloat(frm.get_value("unit_price")) || 0;
                const totalPrice = quantity * unitPrice;
                frm.set_value("total_price", totalPrice);
            },
            unit_price: function(frm) {
                const unitPrice = parseFloat(frm.get_value("unit_price")) || 0;
                const quantity = parseFloat(frm.get_value("quantity")) || 0;
                const totalPrice = quantity * unitPrice;
                frm.set_value("total_price", totalPrice);
            }
        });
    }, []);

    return null; // This is a script component, not a visual component
}
