import { useZui } from "@/zodula/ui";

/**
 * Form scripts for Delivery Note Item (child of Delivery Note).
 * Price is auto-fetched from Price when product is selected (in Delivery Note.ui.tsx).
 * total_price = quantity * unit_price when quantity or unit_price changes.
 */
export default function DeliveryOrderItemScripts() {
    useZui((zui) => {
        zui.form.on("Delivery Note Item", {
            quantity(frm) {
                const qty = parseFloat(String(frm.get_value("quantity") ?? 0)) || 0;
                const unitPrice = parseFloat(String(frm.get_value("unit_price") ?? 0)) || 0;
                frm.set_value("total_price", qty * unitPrice);

                const volume = parseFloat(String(frm.get_value("volume") ?? 0)) || 0;
                const weight = parseFloat(String(frm.get_value("weight") ?? 0)) || 0;
                const volumeTotal = volume * qty;
                const weightTotal = weight * qty;
                frm.set_value("volume_total", volumeTotal);
                frm.set_value("weight_total", weightTotal);
            },
            unit_price(frm) {
                const qty = parseFloat(String(frm.get_value("quantity") ?? 0)) || 0;
                const unitPrice = parseFloat(String(frm.get_value("unit_price") ?? 0)) || 0;
                frm.set_value("total_price", qty * unitPrice);
            },
        });
    }, []);

    return <></>;
}
