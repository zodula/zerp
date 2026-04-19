import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";
import {
    PARTY_BY_PAYMENT,
    PAYMENT_ENTRY_ACCOUNT_FILTERS,
    REFERENCE_TYPES_BY_PARTY,
    REFERENCE_TYPE_PARTY_FIELD,
    REFERENCE_TYPE_TOTAL_AMOUNT_FIELD,
} from "@/zerp/src/shared/payment_entry";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

export default function PaymentEntryScripts() {
    useZui((zui) => {
        const lastReferenceByRow = new Map<number, { reference_type?: string; reference_id?: string }>();
        const salesInvoiceCache = new Map<string, any>();

        async function rememberAndRepairReferences(frm: any) {
            const rows = (frm.get_value("references") ?? []) as any[];
            for (let i = 0; i < rows.length; i++) {
                const typeVal = String(frm.get_value(`references.${i}.reference_type`) ?? "").trim();
                const idVal = String(frm.get_value(`references.${i}.reference_id`) ?? "").trim();
                const known = lastReferenceByRow.get(i) ?? {};
                if (typeVal || idVal) {
                    lastReferenceByRow.set(i, {
                        reference_type: typeVal || known.reference_type || "",
                        reference_id: idVal || known.reference_id || "",
                    });
                    continue;
                }
                if (known.reference_type) {
                    await frm.set_value(`references.${i}.reference_type`, known.reference_type);
                }
                if (known.reference_id) {
                    await frm.set_value(`references.${i}.reference_id`, known.reference_id);
                }
            }
        }

        function inferEmployeeReferenceType(referenceId: string) {
            if (!referenceId) return "";
            if (referenceId.startsWith("EXC-")) return "Expense Claim";
            if (referenceId.startsWith("EA-")) return "Employee Advance";
            return "";
        }

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
            const refsForTemplate = (frm.get_value("references") ?? []) as any[];
            let templateRefType = "";
            for (let i = refsForTemplate.length - 1; i >= 0; i--) {
                const t = String(refsForTemplate[i]?.reference_type ?? "").trim();
                if (t) {
                    templateRefType = t;
                    break;
                }
            }
            if (!templateRefType) templateRefType = refTypes[0] ?? "";
            const partyField = templateRefType ? REFERENCE_TYPE_PARTY_FIELD[templateRefType] : null;
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
            const partyType = String(frm.get_value("party_type") ?? "").trim();
            if (paymentType === "Receive") {
                await frm.set_df_property("account_paid_to", "filters", PAYMENT_ENTRY_ACCOUNT_FILTERS.bankCash);
                await frm.set_df_property("account_paid_to", "required", 1);
                await frm.set_df_property("account_paid_from", "filters", PAYMENT_ENTRY_ACCOUNT_FILTERS.receivable);
            } else if (paymentType === "Pay") {
                await frm.set_df_property("account_paid_from", "filters", PAYMENT_ENTRY_ACCOUNT_FILTERS.bankCash);
                await frm.set_df_property("account_paid_from", "required", 1);
                await frm.set_df_property("account_paid_to", "filters", partyType === "Customer" ? PAYMENT_ENTRY_ACCOUNT_FILTERS.receivable : PAYMENT_ENTRY_ACCOUNT_FILTERS.payable);
            } else {
                await frm.set_df_property("account_paid_to", "filters", PAYMENT_ENTRY_ACCOUNT_FILTERS.notGroupBankCash);
            }
            await frm.set_df_property("account_paid_from", "required", 1);
            await frm.set_df_property("account_paid_to", "required", 1);
        }

        async function setAccountFieldDefaultValues(frm: any) {
            const erp = (await zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any)) as any;
            const paymentType = String(frm.get_value("payment_type") ?? "").trim();
            const partyType = String(frm.get_value("party_type") ?? "").trim();
            const refs = (frm.get_value("references") ?? []) as any[];
            const firstRefType = String(refs[0]?.reference_type ?? "").trim();

            let receivable = erp?.default_receivable_account;
            let payable = erp?.default_payable_account;
            if (paymentType === "Pay" && partyType === "Employee") {
                if (firstRefType === "Employee Advance") payable = erp?.default_employee_advance_account || payable;
            }

            if (paymentType === "Receive") {
                if (!frm.get_value("account_paid_from") && receivable) {
                    await frm.set_value("account_paid_from", receivable);
                }
            } else if (paymentType === "Pay") {
                const partyAccount = partyType === "Customer" ? receivable : payable;
                if (!frm.get_value("account_paid_to") && partyAccount) {
                    await frm.set_value("account_paid_to", partyAccount);
                }
            }
        }

        async function getSalesInvoice(refId: string) {
            if (salesInvoiceCache.has(refId)) return salesInvoiceCache.get(refId);
            const doc = await zodula.doc.get_doc("Sales Invoice" as any, refId);
            salesInvoiceCache.set(refId, doc);
            return doc;
        }

        /** Positive remaining magnitude → UI value: CN on Receive shows negative; CN on Pay stays positive. */
        function displayOutstandingForSalesInvoice(
            baseDoc: any,
            remainingPositive: number,
            paymentType: string
        ): number {
            if (!remainingPositive) return 0;
            const isCn = Number(baseDoc?.is_credit_note ?? 0) === 1;
            if (!isCn) return remainingPositive;
            return paymentType === "Receive" ? -remainingPositive : remainingPositive;
        }

        async function getSignedAllocation(frm: any, row: any) {
            const paymentType = String(frm.get_value("payment_type") ?? "").trim();
            const refType = String(row?.reference_type ?? "").trim();
            const refId = String(row?.reference_id ?? "").trim();
            const allocateAmount = Math.abs(num(row?.allocate_amount));
            if (!allocateAmount) return 0;
            if (refType !== "Sales Invoice" || !refId) return allocateAmount;
            const salesInvoice = await getSalesInvoice(refId);
            const isCreditNote = Number((salesInvoice as any)?.is_credit_note ?? 0) === 1;
            if (!isCreditNote) return allocateAmount;
            return paymentType === "Receive" ? -allocateAmount : allocateAmount;
        }

        async function syncTotalAllocated(frm: any) {
            const refs = (frm.get_value("references") ?? []) as any[];
            let totalAllocated = 0;
            for (const row of refs) {
                totalAllocated += await getSignedAllocation(frm, row);
            }
            frm.set_value("total_allocated", totalAllocated);
        }

        /** Older PE rows stored positive allocate for CN; flip to negative on Receive (and Pay positive) for display. */
        async function normalizeCreditNoteReferenceSigns(frm: any) {
            const paymentType = String(frm.get_value("payment_type") ?? "").trim();
            const refs = (frm.get_value("references") ?? []) as any[];
            for (let i = 0; i < refs.length; i++) {
                const refType = String(frm.get_value(`references.${i}.reference_type`) ?? "").trim();
                const refId = String(frm.get_value(`references.${i}.reference_id`) ?? "").trim();
                if (refType !== "Sales Invoice" || !refId) continue;
                const si = (await getSalesInvoice(refId)) as any;
                if (!si || Number(si.is_credit_note ?? 0) !== 1) continue;
                const a = num(frm.get_value(`references.${i}.allocate_amount`));
                if (paymentType === "Receive" && a > 0) {
                    const n = -Math.abs(a);
                    await frm.set_value(`references.${i}.allocate_amount`, n);
                    await frm.set_value(`references.${i}.outstanding_amount`, n);
                } else if (paymentType === "Pay" && a < 0) {
                    const p = Math.abs(a);
                    await frm.set_value(`references.${i}.allocate_amount`, p);
                    await frm.set_value(`references.${i}.outstanding_amount`, p);
                }
            }
        }

        zui.form.on("Payment Entry" as any, {
            on_render: async (frm: any) => {
                await rememberAndRepairReferences(frm);
                await setReferenceTypeFilter(frm);
                await setReferenceIdFiltersForParty(frm);
                await setAccountFieldProperties(frm);
                await setAccountFieldDefaultValues(frm);
                await normalizeCreditNoteReferenceSigns(frm);
                await syncTotalAllocated(frm);
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
                await setAccountFieldProperties(frm);
                await setAccountFieldDefaultValues(frm);
                frm.set_value("total_allocated", 0);
            },
            party: async (frm: any) => {
                frm.clear_table?.("references");
                await setReferenceIdFiltersForParty(frm);
                frm.set_value("total_allocated", 0);
            },
            references: (frm: any) => {
                void syncTotalAllocated(frm);
            },
            "references.reference_type": async (frm: any) => {
                await rememberAndRepairReferences(frm);
                await setReferenceIdFiltersForParty(frm);
                await setAccountFieldDefaultValues(frm);
            },
            "references.reference_id": async (frm: any) => {
                await rememberAndRepairReferences(frm);
                const idx = frm.idx ?? 0;
                let refType = String(frm.get_value(`references.${idx}.reference_type`) ?? "").trim();
                const refId = String(frm.get_value(`references.${idx}.reference_id`) ?? "").trim();
                if (!refId) {
                    frm.set_value(`references.${idx}.outstanding_amount`, 0);
                    frm.set_value(`references.${idx}.allocate_amount`, 0);
                    await syncTotalAllocated(frm);
                    return;
                }
                if (!refType) {
                    const partyType = String(frm.get_value("party_type") ?? "").trim();
                    if (partyType === "Employee") {
                        const inferredType = inferEmployeeReferenceType(refId);
                        if (inferredType) {
                            await frm.set_value(`references.${idx}.reference_type`, inferredType);
                            refType = inferredType;
                            await setAccountFieldDefaultValues(frm);
                        }
                    }
                }
                if (!refType) {
                    return;
                }

                const totalField = REFERENCE_TYPE_TOTAL_AMOUNT_FIELD[refType];
                if (!totalField) return;

                const baseDoc = (await zodula.doc.get_doc(refType as any, refId)) as any;
                if (!baseDoc) return;
                const totalAmount = Math.abs(num(baseDoc[totalField]));

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
                        totalAllocatedFromOtherEntries += Math.abs(num((r as any).allocate_amount));
                    }
                }

                const remaining = Math.max(0, totalAmount - totalAllocatedFromOtherEntries);
                const paymentType = String(frm.get_value("payment_type") ?? "").trim();
                const display = displayOutstandingForSalesInvoice(baseDoc, remaining, paymentType);
                frm.set_value(`references.${idx}.outstanding_amount`, display);
                frm.set_value(`references.${idx}.allocate_amount`, display);

                await syncTotalAllocated(frm);
                await rememberAndRepairReferences(frm);
            },
            "references.allocate_amount": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const refType = String(frm.get_value(`references.${idx}.reference_type`) ?? "").trim();
                const refId = String(frm.get_value(`references.${idx}.reference_id`) ?? "").trim();
                if (refType === "Sales Invoice" && refId) {
                    const si = (await getSalesInvoice(refId)) as any;
                    if (si && Number(si.is_credit_note ?? 0) === 1) {
                        const paymentType = String(frm.get_value("payment_type") ?? "").trim();
                        const v = num(frm.get_value(`references.${idx}.allocate_amount`));
                        if (paymentType === "Receive" && v > 0) {
                            await frm.set_value(`references.${idx}.allocate_amount`, -Math.abs(v));
                            await syncTotalAllocated(frm);
                            return;
                        }
                        if (paymentType === "Pay" && v < 0) {
                            await frm.set_value(`references.${idx}.allocate_amount`, Math.abs(v));
                            await syncTotalAllocated(frm);
                            return;
                        }
                    }
                }
                await syncTotalAllocated(frm);
            },
            "references.idx": (frm: any) => {
                void syncTotalAllocated(frm);
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
