import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";
import {
    PARTY_BY_PAYMENT,
    PAYMENT_ENTRY_ACCOUNT_FILTERS,
    REFERENCE_TYPES_BY_PARTY,
    REFERENCE_TYPE_TOTAL_AMOUNT_FIELD,
} from "@/zerp/src/shared/payment_entry";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

export default function PaymentEntryRequestScripts() {
    useZui((zui) => {
        async function setPartyTypeFilters(frm: any) {
            const paymentType = String(frm.get_value("payment_type") ?? "").trim();
            const partyTypes = PARTY_BY_PAYMENT[paymentType] ?? [];
            await frm.set_df_property("party_type", "filters", JSON.stringify([["name", "IN", partyTypes]]));
            const currentPartyType = String(frm.get_value("party_type") ?? "").trim();
            if (currentPartyType && !partyTypes.includes(currentPartyType)) {
                await frm.set_value("party_type", "");
            }
        }

        async function setAccountFieldProperties(frm: any) {
            const paymentType = String(frm.get_value("payment_type") ?? "").trim();
            const partyType = String(frm.get_value("party_type") ?? "").trim();
            if (paymentType === "Receive") {
                await frm.set_df_property("account_paid_to", "filters", PAYMENT_ENTRY_ACCOUNT_FILTERS.bankCash);
                await frm.set_df_property("account_paid_from", "filters", PAYMENT_ENTRY_ACCOUNT_FILTERS.receivable);
            } else if (paymentType === "Pay") {
                await frm.set_df_property("account_paid_from", "filters", PAYMENT_ENTRY_ACCOUNT_FILTERS.bankCash);
                await frm.set_df_property("account_paid_to", "filters", partyType === "Customer" ? PAYMENT_ENTRY_ACCOUNT_FILTERS.receivable : PAYMENT_ENTRY_ACCOUNT_FILTERS.payable);
            } else {
                await frm.set_df_property("account_paid_from", "filters", PAYMENT_ENTRY_ACCOUNT_FILTERS.notGroupBankCash);
                await frm.set_df_property("account_paid_to", "filters", PAYMENT_ENTRY_ACCOUNT_FILTERS.notGroupBankCash);
            }
        }

        async function setReferenceFilters(frm: any) {
            const partyType = String(frm.get_value("party_type") ?? "").trim();
            const allowedReferenceTypes = REFERENCE_TYPES_BY_PARTY[partyType] ?? [];
            await frm.set_df_property("references.-1.reference_type", "filters", JSON.stringify([["name", "IN", allowedReferenceTypes]]));
        }

        function setTotalAllocated(frm: any) {
            const rows = (frm.get_value("references") ?? []) as any[];
            const totalAllocated = rows.reduce((sum, row) => sum + num(row?.allocate_amount), 0);
            frm.set_value("total_allocated", totalAllocated);
        }

        async function getRemainingOutstanding(referenceType: string, referenceId: string, totalAmount: number) {
            const refsRes = await zodula.doc.select_docs("Payment Entry Reference" as any, {
                filters: [
                    ["reference_id", "=", referenceId],
                    ["reference_type", "=", referenceType],
                ],
                limit: 500,
                sort: "id",
                order: "asc",
            });

            let allocated = 0;
            for (const row of refsRes?.docs ?? []) {
                const paymentEntryId = (row as any).parentid;
                if (!paymentEntryId) continue;
                const paymentEntry = await zodula.doc.get_doc("Payment Entry" as any, paymentEntryId) as any;
                if (paymentEntry?.doc_status === "Submitted") {
                    allocated += Math.abs(num((row as any).allocate_amount));
                }
            }
            return Math.max(0, Math.abs(totalAmount) - allocated);
        }

        async function appendSalesInvoiceFromDeliveryNote(frm: any) {
            const scannedDeliveryNote = String(frm.get_value("append_sales_invoice_from_delivery_note") ?? "").trim();
            if (!scannedDeliveryNote) return;

            try {
                const paymentType = String(frm.get_value("payment_type") ?? "").trim();
                if (paymentType !== "Receive") {
                    zui.toast.error("Scanner works only when payment type is Receive.");
                    return;
                }

                const result = await zodula.doc.select_docs("Sales Invoice" as any, {
                    filters: [
                        ["delivery_note", "=", scannedDeliveryNote],
                        ["doc_status", "=", "Submitted"],
                        ["is_credit_note", "!=", 1],
                    ],
                    limit: 200,
                    sort: "posting_date",
                    order: "asc",
                });

                if (!(result?.docs?.length ?? 0)) {
                    zui.toast.error(`No submitted Sales Invoice found for Delivery Note ${scannedDeliveryNote}.`);
                    return;
                }

                const currentRows = (frm.get_value("references") ?? []) as any[];
                const existingSalesInvoiceIds = new Set(
                    currentRows
                        .filter((row) => String(row?.reference_type ?? "").trim() === "Sales Invoice")
                        .map((row) => String(row?.reference_id ?? "").trim())
                        .filter(Boolean)
                );
                let nextIdx = currentRows.length;
                let appended = 0;

                for (const invoice of result.docs) {
                    const invoiceId = String((invoice as any).id ?? "").trim();
                    if (!invoiceId) continue;
                    if (existingSalesInvoiceIds.has(invoiceId)) continue;

                    const totalAmount = num((invoice as any).grand_total);
                    const remaining = await getRemainingOutstanding("Sales Invoice", invoiceId, totalAmount);
                    await frm.set_value(`references.${nextIdx}.reference_type`, "Sales Invoice");
                    await frm.set_value(`references.${nextIdx}.reference_id`, invoiceId);
                    await frm.set_value(`references.${nextIdx}.outstanding_amount`, remaining);
                    await frm.set_value(`references.${nextIdx}.allocate_amount`, remaining);
                    existingSalesInvoiceIds.add(invoiceId);
                    nextIdx += 1;
                    appended += 1;
                }

                if (appended > 0) {
                    setTotalAllocated(frm);
                    zui.toast.success(`Appended ${appended} Sales Invoice row(s).`);
                } else {
                    zui.toast.info("All Sales Invoices for this Delivery Note are already in references.");
                }
            } finally {
                await frm.set_value("append_sales_invoice_from_delivery_note", "");
            }
        }

        zui.form.on("Payment Entry Request" as any, {
            on_render: async (frm: any) => {
                await setPartyTypeFilters(frm);
                await setReferenceFilters(frm);
                await setAccountFieldProperties(frm);
            },
            payment_type: async (frm: any) => {
                await frm.clear_table?.("references");
                await frm.set_value("total_allocated", 0);
                await frm.set_value("party_type", "");
                await setPartyTypeFilters(frm);
                await setReferenceFilters(frm);
                await setAccountFieldProperties(frm);
            },
            party_type: async (frm: any) => {
                await frm.clear_table?.("references");
                await frm.set_value("total_allocated", 0);
                await setReferenceFilters(frm);
                await setAccountFieldProperties(frm);
            },
            "references.reference_type": async (frm: any) => {
                const idx = frm.idx ?? 0;
                await frm.set_value(`references.${idx}.reference_id`, "");
                await frm.set_value(`references.${idx}.outstanding_amount`, 0);
                await frm.set_value(`references.${idx}.allocate_amount`, 0);
            },
            "references.reference_id": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const referenceType = String(frm.get_value(`references.${idx}.reference_type`) ?? "").trim();
                const referenceId = String(frm.get_value(`references.${idx}.reference_id`) ?? "").trim();
                if (!referenceType || !referenceId) {
                    await frm.set_value(`references.${idx}.outstanding_amount`, 0);
                    await frm.set_value(`references.${idx}.allocate_amount`, 0);
                    return;
                }
                const totalField = REFERENCE_TYPE_TOTAL_AMOUNT_FIELD[referenceType];
                if (!totalField) return;

                const baseDoc = await zodula.doc.get_doc(referenceType as any, referenceId) as any;
                if (!baseDoc) return;
                const totalAmount = Math.abs(num(baseDoc[totalField]));

                const refsRes = await zodula.doc.select_docs("Payment Entry Reference" as any, {
                    filters: [
                        ["reference_id", "=", referenceId],
                        ["reference_type", "=", referenceType],
                    ],
                    limit: 500,
                    sort: "id",
                    order: "asc",
                });

                let allocated = 0;
                for (const row of refsRes?.docs ?? []) {
                    const paymentEntryId = (row as any).parentid;
                    if (!paymentEntryId) continue;
                    const paymentEntry = await zodula.doc.get_doc("Payment Entry" as any, paymentEntryId) as any;
                    if (paymentEntry?.doc_status === "Submitted") {
                        allocated += Math.abs(num((row as any).allocate_amount));
                    }
                }

                const remaining = Math.max(0, totalAmount - allocated);
                await frm.set_value(`references.${idx}.outstanding_amount`, remaining);
                await frm.set_value(`references.${idx}.allocate_amount`, remaining);
            },
            "references.allocate_amount": (frm: any) => {
                setTotalAllocated(frm);
            },
            "references.idx": (frm: any) => {
                setTotalAllocated(frm);
            },
            append_sales_invoice_from_delivery_note: async (frm: any) => {
                await appendSalesInvoiceFromDeliveryNote(frm);
            },
        } as any);
    }, []);
    return <></>;
}
