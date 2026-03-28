import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

export default function DeliveryTripScripts() {
    useZui((zui) => {
        async function appendDeliveryNotes(frm: any, deliveryNoteIds: string[]) {
            const currentRows = (frm.get_value("delivery_trip_items") ?? []) as any[];
            const existingDeliveryNoteIds = new Set(
                currentRows
                    .map((row) => String(row?.delivery_note ?? "").trim())
                    .filter(Boolean)
            );

            let nextIdx = currentRows.length;
            let appended = 0;
            for (const id of deliveryNoteIds) {
                const deliveryNoteId = String(id ?? "").trim();
                if (!deliveryNoteId || existingDeliveryNoteIds.has(deliveryNoteId)) continue;
                await frm.set_value(`delivery_trip_items.${nextIdx}.delivery_note`, deliveryNoteId);
                existingDeliveryNoteIds.add(deliveryNoteId);
                nextIdx += 1;
                appended += 1;
            }

            if (appended > 0) {
                zui.toast.success(`Appended ${appended} Delivery Note row(s).`);
                return;
            }
            zui.toast.info("All selected Delivery Notes are already in Delivery Trip Items.");
        }

        async function appendScannedDeliveryNote(frm: any) {
            const scanned = String(frm.get_value("append_delivery_note") ?? "").trim();
            if (!scanned) return;
            try {
                await appendDeliveryNotes(frm, [scanned]);
            } finally {
                await frm.set_value("append_delivery_note", "");
            }
        }

        zui.form.on("Delivery Trip" as any, {
            append_delivery_note: async (frm: any) => {
                await appendScannedDeliveryNote(frm);
            },
        } as any);

        zui.form.set_secondary_button("Delivery Trip", "Select Delivery Note", async (frm) => {
            const selected = await zui.open_multiselect_dialog({
                doctype: "Delivery Note",
                standard_filter_fields: ["id", "customer", "posting_date", "doc_status"],
                columns: ["id", "customer", "posting_date", "shipping_inline_address", "doc_status"],
                defaultFilters: [["doc_status", "=", "Submitted"]],
            }, {
                title: "Select Delivery Note",
                maxWidth: 1100,
            });
            if (!selected) return;

            const ids = "ids" in selected ? selected.ids : (selected.id ? [selected.id] : []);
            if (!ids.length) return;
            await appendDeliveryNotes(frm, ids.map((id) => String(id ?? "").trim()).filter(Boolean));
        }, { icon: "ListChecks", condition: (ctx) => (ctx?.doc?.doc_status ?? "Draft") === "Draft" });

        zui.form.set_secondary_button("Delivery Trip", "Create Purchase Invoice", async (frm) => {
            const tripId = frm.get_value("id") ?? frm?.doc?.id;
            const postingDate = frm.get_value("posting_date") || zodula.date.today();
            const prefill: Record<string, any> = {
                delivery_trip: tripId,
                supplier: frm.get_value("transporter"),
                posting_date: postingDate,
                due_date: postingDate,
                ignore_price_project: 1,
            };

            const expenseRows = (frm.get_value("delivery_trip_expense_items") ?? []) as any[];
            let nextIdx = 0;
            for (const row of expenseRows) {
                const item = String(row?.item ?? "").trim();
                if (!item) continue;
                const base = `purchase_invoice_items.${nextIdx}.`;
                prefill[`${base}item`] = item;
                prefill[`${base}quantity`] = row?.quantity ?? 0;
                prefill[`${base}uom`] = row?.uom ?? "";
                prefill[`${base}unit_price`] = row?.rate ?? 0;
                prefill[`${base}total_price`] = row?.amount ?? 0;
                nextIdx += 1;
            }

            zui.router?.push(`/desk/doctypes/Purchase Invoice/form`, { state: { prefill } });
        }, { icon: "ReceiptText", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" });
    }, []);
    return <></>;
}
