import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

export default function InstallationNoteScripts() {
    useZui(async (zui) => {
        zui.form.on("Installation Note", {
            delivery_note: async (frm) => {
                const deliveryNoteId = frm.get_value("delivery_note");
                if (!deliveryNoteId) {
                    frm.clear_table?.("installation_note_items");
                    return;
                }
                frm.clear_table?.("installation_note_items");
                const dn = await zodula.doc.get_doc("Delivery Note" as any, deliveryNoteId) as any;
                const items = (dn?.delivery_note_items ?? []) as any[];
                for (let i = 0; i < items.length; i++) {
                    const row = items[i];
                    await frm.set_value(`installation_note_items.${i}.product`, row?.product ?? "");
                    await frm.set_value(`installation_note_items.${i}.product_name`, row?.product_name ?? "");
                    await frm.set_value(`installation_note_items.${i}.quantity`, num(row?.quantity));
                    await frm.set_value(`installation_note_items.${i}.uom`, row?.uom ?? "");
                }
                if (!frm.get_value("installation_date")) {
                    await frm.set_value("installation_date", zodula.date.today());
                }
                if (!frm.get_value("installation_time")) {
                    await frm.set_value("installation_time", zodula.date.today());
                }
            },
        });
    }, []);

    return <></>;
}
