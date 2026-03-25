import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

const PARTY_BY_PAYMENT: Record<string, string[]> = {
    Receive: ["Customer", "Employee"],
    Pay: ["Supplier"],
    Transfer: [],
};
const REFERENCE_TYPES_BY_PARTY: Record<string, string[]> = {
    Customer: ["Sales Invoice", "Delivery Note"],
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

        async function setAccountFieldProperties(frm: any) {
            const paymentType = String(frm.get_value("payment_type") ?? "").trim();
            if (paymentType === "Receive") {
                await frm.set_df_property("account_paid_to", "filters", FILTERS.bankCash);
                await frm.set_df_property("account_paid_to", "required", 1);
                await frm.set_df_property("account_paid_from", "filters", FILTERS.receivable);
            } else if (paymentType === "Pay") {
                await frm.set_df_property("account_paid_from", "filters", FILTERS.bankCash);
                await frm.set_df_property("account_paid_from", "required", 1);
                await frm.set_df_property("account_paid_to", "filters", FILTERS.payable);
            } else {
                await frm.set_df_property("account_paid_to", "filters", FILTERS.notGroup);
            }
            await frm.set_df_property("account_paid_from", "required", 1);
            await frm.set_df_property("account_paid_to", "required", 1);
        }

        async function setAccountFieldDefaultValues(frm: any) {
            const paymentType = String(frm.get_value("payment_type") ?? "").trim();
            const res = await zodula.doc.select_docs("Account" as any, {
                filters: [["account_type", "=", paymentType === "Receive" ? "Receivable" : "Payable"], ["is_group", "!=", 1]],
                limit: 1,
                sort: "account_code",
                order: "asc",
            });
            if (res?.docs?.[0]?.id) {
                if (paymentType === "Receive") {
                    if (!frm.get_value("account_paid_from")) {
                        await frm.set_value("account_paid_from", res.docs[0].id);
                    }
                } else if (paymentType === "Pay") {
                    if (!frm.get_value("account_paid_to")) {
                        await frm.set_value("account_paid_to", res.docs[0].id);
                    }
                }
            }
        }

        zui.form.on("Payment Entry" as any, {
            on_render: async (frm: any) => {
                await setReferenceTypeFilter(frm);
                await setReferenceIdFiltersForParty(frm);
                await setAccountFieldProperties(frm);
                await setAccountFieldDefaultValues(frm);
            },
            payment_type: async (frm: any) => {
                await frm.set_value("party_type", "");
                await frm.set_value("party", "");
                frm.clear_table?.("references");
                await setPartyFields(frm);
                await setAccountFieldProperties(frm);
                await setAccountFieldDefaultValues(frm);
                await setReferenceTypeFilter(frm);
                await setReferenceIdFiltersForParty(frm);
                frm.set_value("total_allocated", 0);
            },
            party_type: async (frm: any) => {
                frm.clear_table?.("references");
                await setReferenceTypeFilter(frm);
                frm.set_value("total_allocated", 0);
            },
            party: async (frm: any) => {
                frm.clear_table?.("references");
                await setReferenceIdFiltersForParty(frm);
                frm.set_value("total_allocated", 0);
            },
            references: (frm: any) => {
                const refs = (frm.get_value("references") ?? []) as any[];
                const totalAllocated = refs.reduce((sum, r) => sum + num(r?.allocate_amount), 0);
                frm.set_value("total_allocated", totalAllocated);
            },
            "references.reference_type": async (frm: any) => {
                await setReferenceIdFiltersForParty(frm);
            },
            "references.reference_id": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const refType = frm.get_value(`references.${idx}.reference_type`);
                const refId = frm.get_value(`references.${idx}.reference_id`);
                if (!refId || !refType) {
                    frm.set_value(`references.${idx}.outstanding_amount`, 0);
                    frm.set_value(`references.${idx}.allocate_amount`, 0);
                    const refs = (frm.get_value("references") ?? []) as any[];
                    const totalAllocated = refs.reduce((sum, r) => sum + num(r?.allocate_amount), 0);
                    frm.set_value("total_allocated", totalAllocated);
                    return;
                }

                const totalField = REFERENCE_TYPE_TOTAL_AMOUNT_FIELD[refType];
                if (!totalField) return;

                const baseDoc = (await zodula.doc.get_doc(refType as any, refId)) as any;
                if (!baseDoc) return;
                const totalAmount = num(baseDoc[totalField]);

                const refsRes = await zodula.doc.select_docs("Payment Entry Reference" as any, {
                    filters: [
                        ["reference_id", "=", refId],
                        ["reference_type", "=", refType],
                    ],
                    limit: 500,
                    sort: "id",
                    order: "asc",
                });

                let totalAllocatedFromOtherEntries = 0;
                for (const r of refsRes?.docs ?? []) {
                    const paymentEntryId = (r as any).parentid;
                    if (!paymentEntryId) continue;
                    const pe = (await zodula.doc.get_doc("Payment Entry" as any, paymentEntryId)) as any;
                    if (pe?.doc_status === "Submitted") {
                        totalAllocatedFromOtherEntries += num((r as any).allocate_amount);
                    }
                }

                const remaining = Math.max(0, totalAmount - totalAllocatedFromOtherEntries);
                frm.set_value(`references.${idx}.outstanding_amount`, remaining);
                frm.set_value(`references.${idx}.allocate_amount`, remaining);

                const refs = (frm.get_value("references") ?? []) as any[];
                const totalAllocated = refs.reduce((sum, r) => sum + num(r?.allocate_amount), 0);
                frm.set_value("total_allocated", totalAllocated);
            },
            "references.allocate_amount": (frm: any) => {
                const refs = (frm.get_value("references") ?? []) as any[];
                const totalAllocated = refs.reduce((sum, r) => sum + num(r?.allocate_amount), 0);
                frm.set_value("total_allocated", totalAllocated);
            },
            "references.idx": (frm: any) => {
                const refs = (frm.get_value("references") ?? []) as any[];
                const totalAllocated = refs.reduce((sum, r) => sum + num(r?.allocate_amount), 0);
                frm.set_value("total_allocated", totalAllocated);
            },
            unallocated_amount: (frm: any) => {
                const totalAllocated = num(frm.get_value("total_allocated"));
                const unallocatedAmount = num(frm.get_value("unallocated_amount"));
                frm.set_value("total_amount", totalAllocated + unallocatedAmount);
            },
            total_allocated: (frm: any) => {
                const totalAllocated = num(frm.get_value("total_allocated"));
                const unallocatedAmount = num(frm.get_value("unallocated_amount"));
                frm.set_value("total_amount", totalAllocated + unallocatedAmount);
            },
            wht_rate: (frm: any) => {
                const totalAmount = num(frm.get_value("total_amount"));
                const whtRate = num(frm.get_value("wht_rate"));
                frm.set_value("wht_amount", (totalAmount * whtRate) / 100);
            },
            total_amount: (frm: any) => {
                console.log("total_amount");
                const totalAmount = num(frm.get_value("total_amount"));
                const whtRate = num(frm.get_value("wht_rate"));
                const whtAmount = (totalAmount * whtRate) / 100;
                frm.set_value("wht_amount", whtAmount);
                frm.set_value("total_taxes_and_charges", whtAmount);
                frm.set_value("to_paid_amount", totalAmount - whtAmount);
            },
            wht_amount: (frm: any) => {
                const totalAmount = num(frm.get_value("total_amount"));
                const whtAmount = num(frm.get_value("wht_amount"));
                frm.set_value("total_taxes_and_charges", whtAmount);
                frm.set_value("to_paid_amount", totalAmount - whtAmount);
            },
        } as any);
    }, []);
    return <></>;
}
