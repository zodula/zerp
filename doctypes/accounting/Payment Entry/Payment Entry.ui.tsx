import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

const PARTY_BY_PAYMENT: Record<string, string[]> = {
    Receive: ["Customer", "Employee"],
    Pay: ["Supplier"],
    Transfer: [],
};
const REFERENCE_TYPES_BY_PARTY: Record<string, string[]> = {
    Customer: ["Sales Invoice"],
    Employee: [],
    Supplier: ["Purchase Invoice"],
};

/** Field on each reference type doctype that holds grand total (used to set remaining_amount). */
const REFERENCE_TYPE_TOTAL_AMOUNT_FIELD: Record<string, string> = {
    "Sales Invoice": "grand_total",
    "Purchase Invoice": "grand_total",
    "Delivery Note": "grand_total",
};

/** Field on each reference type doctype that links to party (customer/supplier); used to filter reference_id. */
const REFERENCE_TYPE_PARTY_FIELD: Record<string, string> = {
    "Sales Invoice": "customer",
    "Purchase Invoice": "supplier",
    "Delivery Note": "customer",
};

const NOT_GROUP = ["is_group", "!=", 1];
const FILTERS = {
    bankCash: JSON.stringify([["account_type", "IN", ["Bank", "Cash"]], NOT_GROUP]),
    receivable: JSON.stringify([["account_type", "IN", ["Receivable"]], NOT_GROUP]),
    payable: JSON.stringify([["account_type", "IN", ["Payable"]], NOT_GROUP]),
    notGroup: JSON.stringify([NOT_GROUP, ["account_type", "IN", ["Bank", "Cash"]]]),
};

function recalcAllocations(frm: any): number {
    const refs = (frm.get_value("references") ?? []) as any[];
    const totalAllocated = refs.reduce((sum, r) => sum + num(r?.allocate_amount), 0);
    frm.set_value("total_allocated", totalAllocated);
    const paidAmount = num(frm.get_value("paid_amount"));
    frm.set_value("unallocated_amount", paidAmount - totalAllocated);
    return totalAllocated;
}

function recalcTaxesWithBase(frm: any, baseAmount: number) {
    const taxes = (frm.get_value("tax_and_charges") ?? []) as any[];
    const sorted = [...taxes].sort((a, b) => (a?.idx ?? 0) - (b?.idx ?? 0));
    let run = baseAmount;
    const amt = new Map<any, number>();
    const tot = new Map<any, number>();
    sorted.forEach((r, i) => {
        const rate = num(r?.rate);
        const ct = r?.charge_type ?? "Actual";
        const a =
            ct === "Actual"
                ? rate
                : ct === "On Net Total"
                    ? (baseAmount * rate) / 100
                    : ct === "On Previous Row Amount" && i > 0
                        ? ((amt.get(sorted[i - 1]) ?? 0) * rate) / 100
                        : ct === "On Previous Row Total" && i > 0
                            ? ((tot.get(sorted[i - 1]) ?? run) * rate) / 100
                            : 0;
        amt.set(r, a);
        if (r?.tax_type === "Excluded") run += a;
        tot.set(r, run);
    });
    sorted.forEach((r, i) => {
        frm.set_value(`tax_and_charges.${i}.tax_amount`, amt.get(r) ?? 0);
        frm.set_value(`tax_and_charges.${i}.total`, tot.get(r) ?? 0);
    });
    frm.set_value("total_taxes_and_charges", sorted.reduce((s, r) => s + (amt.get(r) ?? 0), 0));
    frm.set_value("total_grand_total", run);
}

function recalcTaxes(frm: any) {
    recalcTaxesWithBase(frm, num(frm.get_value("total_allocated")));
}

function recalcAllocationsAndTaxes(frm: any) {
    console.log("recalcAllocationsAndTaxes", frm);
    const baseAmount = recalcAllocations(frm);
    recalcTaxesWithBase(frm, baseAmount);
}

export default function PaymentEntryScripts() {
    useZui((zui) => {
        async function setPartyFields(frm: any) {
            const paymentType = String(frm.get_value("payment_type") ?? "").trim();
            const partyTypes = PARTY_BY_PAYMENT[paymentType] ?? [];
            if (partyTypes.length === 0) {
                await frm.set_df_property("party_type", "hidden", 1);
                await frm.set_df_property("party", "hidden", 1);
                await frm.set_value("party_type", "");
                await frm.set_value("party", "");
                await frm.set_df_property("references.-1.reference_type", "filters", JSON.stringify([["name", "IN", []]]));
                return;
            }
            await frm.set_df_property("party_type", "hidden", 0);
            await frm.set_df_property("party_type", "filters", JSON.stringify([["name", "IN", partyTypes]]));
            await frm.set_df_property("party", "hidden", 0);
            const current = String(frm.get_value("party_type") ?? "").trim();
            if (current && !partyTypes.includes(current)) {
                await frm.set_value("party_type", "");
                await frm.set_value("party", "");
            }
            const key = current || partyTypes[0] || "";
            await frm.set_df_property("references.-1.reference_type", "filters", JSON.stringify([["name", "IN", REFERENCE_TYPES_BY_PARTY[key] ?? []]]));
        }

        /** On payment_type change: clear party so user must re-select. */
        async function onPaymentTypeChange(frm: any) {
            await frm.set_value("party_type", "");
            await frm.set_value("party", "");
            frm.clear_table?.("references");
            frm.clear_table?.("tax_and_charges");
            await onLoadOrPaymentTypeChange(frm);
        }

        /** On party change: clear references and tax_and_charges tables. */
        async function onPartyChange(frm: any) {
            frm.clear_table?.("references");
            frm.clear_table?.("tax_and_charges");
            await setReferenceIdFiltersForParty(frm);
            recalcAllocationsAndTaxes(frm);
        }

        async function setReferenceTypeFilter(frm: any) {
            const partyType = String(frm.get_value("party_type") ?? "").trim();
            await frm.set_df_property("references.-1.reference_type", "filters", JSON.stringify([["name", "IN", REFERENCE_TYPES_BY_PARTY[partyType] ?? []]]));
            await setReferenceIdFiltersForParty(frm);
        }

        /** Set reference_id filters so only docs for the selected party (customer/supplier) are listed. */
        async function setReferenceIdFiltersForParty(frm: any) {
            const party = frm.get_value("party");
            const partyType = String(frm.get_value("party_type") ?? "").trim();
            const refTypes = REFERENCE_TYPES_BY_PARTY[partyType] ?? [];
            if (!party || refTypes.length === 0) {
                await frm.set_df_property("references.-1.reference_id", "filters", JSON.stringify([["name", "IN", []]]));
                return;
            }
            const firstRefType = refTypes[0] ?? "";
            const partyField = firstRefType ? REFERENCE_TYPE_PARTY_FIELD[firstRefType] : null;
            const newRowFilter = partyField ? JSON.stringify([[partyField, "=", party]]) : JSON.stringify([["name", "IN", []]]);
            await frm.set_df_property("references.-1.reference_id", "filters", newRowFilter);

            const refs = (frm.get_value("references") ?? []) as any[];
            for (let i = 0; i < refs.length; i++) {
                const refType = String(refs[i]?.reference_type ?? "").trim();
                const field = refType ? REFERENCE_TYPE_PARTY_FIELD[refType] : null;
                const filter = field ? JSON.stringify([[field, "=", party]]) : JSON.stringify([["name", "IN", []]]);
                await frm.set_df_property(`references.${i}.reference_id`, "filters", filter);
            }
        }

        async function setAccountFields(frm: any) {
            const paymentType = String(frm.get_value("payment_type") ?? "").trim();
            if (paymentType === "Receive") {
                await frm.set_df_property("account_paid_to", "filters", FILTERS.bankCash);
                await frm.set_df_property("account_paid_to", "required", 1);
                await frm.set_df_property("account_paid_from", "filters", FILTERS.receivable);
                await frm.set_df_property("account_paid_from", "required", 0);
                const res = await zodula.doc.select_docs("Account" as any, {
                    filters: [["account_type", "=", "Receivable"], ["is_group", "!=", 1]],
                    limit: 1,
                    sort: "account_code",
                    order: "asc",
                });
                if (res?.docs?.[0]?.id) await frm.set_value("account_paid_from", res.docs[0].id);
                frm.set_value("account_paid_to", "");
            } else if (paymentType === "Pay") {
                await frm.set_df_property("account_paid_from", "filters", FILTERS.bankCash);
                await frm.set_df_property("account_paid_from", "required", 1);
                await frm.set_df_property("account_paid_to", "filters", FILTERS.payable);
                await frm.set_df_property("account_paid_to", "required", 0);
                const res = await zodula.doc.select_docs("Account" as any, {
                    filters: [["account_type", "=", "Payable"], ["is_group", "!=", 1]],
                    limit: 1,
                    sort: "account_code",
                    order: "asc",
                });
                if (res?.docs?.[0]?.id) await frm.set_value("account_paid_to", res.docs[0].id);
                frm.set_value("account_paid_from", "");
            } else {
                await frm.set_df_property("account_paid_to", "filters", FILTERS.notGroup);
                await frm.set_df_property("account_paid_to", "hidden", 0);
                await frm.set_df_property("account_paid_to", "required", 1);
                await frm.set_df_property("account_paid_from", "filters", FILTERS.notGroup);
                await frm.set_df_property("account_paid_from", "hidden", 0);
                await frm.set_df_property("account_paid_from", "required", 1);
                frm.set_value("account_paid_to", "");
                frm.set_value("account_paid_from", "");
            }
        }

        async function onLoadOrPaymentTypeChange(frm: any) {
            await setPartyFields(frm);
            await setAccountFields(frm);
            await setReferenceIdFiltersForParty(frm);
            recalcAllocationsAndTaxes(frm);
        }

        function onReferencesChange(frm: any) {
            recalcAllocationsAndTaxes(frm);
        }

        async function onReferenceIdChange(frm: any) {
            const idx = frm.idx ?? 0;
            const refType = frm.get_value(`references.${idx}.reference_type`);
            const refId = frm.get_value(`references.${idx}.reference_id`);
            if (!refId || !refType) {
                frm.set_value(`references.${idx}.grand_total`, 0);
                frm.set_value(`references.${idx}.outstanding_amount`, 0);
                frm.set_value(`references.${idx}.allocate_amount`, 0);
                recalcAllocationsAndTaxes(frm);
                return;
            }

            const totalField = REFERENCE_TYPE_TOTAL_AMOUNT_FIELD[refType];
            if (!totalField) {
                recalcAllocationsAndTaxes(frm);
                return;
            }

            const baseDoc = (await zodula.doc.get_doc(refType as any, refId)) as any;
            if (!baseDoc) {
                recalcAllocationsAndTaxes(frm);
                return;
            }
            const totalAmount = num(baseDoc[totalField]);
            frm.set_value(`references.${idx}.grand_total`, totalAmount);

            // Sum allocated amounts from other submitted Payment Entries that reference this doc
            const refsRes = await zodula.doc.select_docs("Payment Entry Reference" as any, {
                filters: [
                    ["reference_id", "=", refId],
                    ["reference_type", "=", refType],
                ],
                limit: 500,
                sort: "id",
                order: "asc",
            });

            let totalAllocated = 0;
            for (const r of refsRes?.docs ?? []) {
                const paymentEntryId = (r as any).parentid;
                if (!paymentEntryId) continue;
                const pe = (await zodula.doc.get_doc("Payment Entry" as any, paymentEntryId)) as any;
                if (pe?.doc_status === "Submitted") {
                    totalAllocated += num((r as any).allocate_amount);
                }
            }

            const remaining = Math.max(0, totalAmount - totalAllocated);
            frm.set_value(`references.${idx}.outstanding_amount`, remaining);
            frm.set_value(`references.${idx}.allocate_amount`, remaining);
            const refs = (frm.get_value("references") ?? []) as any[];
            const newTotalAllocated = refs.reduce((sum, r, i) => sum + (i === idx ? remaining : num(r?.allocate_amount)), 0);
            frm.set_value("total_allocated", newTotalAllocated);
            const paidAmount = num(frm.get_value("paid_amount"));
            frm.set_value("unallocated_amount", paidAmount - newTotalAllocated);
            recalcTaxesWithBase(frm, newTotalAllocated);
        }

        const taxFieldHandlers = ["rate", "tax_amount", "charge_type", "tax_type", "idx"].reduce(
            (acc, f) => ({ ...acc, [`tax_and_charges.${f}`]: recalcTaxes }),
            {} as Record<string, (frm: any) => void>
        );

        zui.form.on("Payment Entry", {
            on_render: onLoadOrPaymentTypeChange,
            payment_type: onPaymentTypeChange,
            party_type: async (frm: any) => {
                frm.clear_table?.("references");
                frm.clear_table?.("tax_and_charges");
                await setReferenceTypeFilter(frm);
            },
            party: onPartyChange,
            references: onReferencesChange,
            "references.reference_type": setReferenceIdFiltersForParty,
            "references.reference_id": onReferenceIdChange,
            "references.allocate_amount": recalcAllocationsAndTaxes,
            "references.idx": recalcAllocationsAndTaxes,
            ...taxFieldHandlers,
        });
    }, []);
    return <></>;
}
