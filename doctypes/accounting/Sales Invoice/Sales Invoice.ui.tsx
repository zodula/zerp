import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;
const round2 = (v: number) => Math.round(v * 100) / 100;

function applyCustomerLinkFilters(frm: any) {
    const customer = frm.get_value("customer");
    const f = customer ? JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", customer]]) : JSON.stringify([["link_type", "=", "Customer"]]);
    frm.set_df_property?.("billing_address", "filters", f);
    frm.set_df_property?.("shipping_address", "filters", f);
    frm.set_df_property?.("billing_contact", "filters", f);
    frm.set_df_property?.("shipping_contact", "filters", f);
}

async function applyVatTemplateToForm(frm: any, templateId: string | null | undefined) {
    if (!templateId) return;
    const tpl = await zodula.doc.get_doc("VAT Template" as any, templateId) as any;
    if (!tpl) return;
    if (tpl.vat_type != null && tpl.vat_type !== "") (frm as any).set_value("vat_type", tpl.vat_type);
    if (tpl.vat_rate != null) (frm as any).set_value("vat_rate", tpl.vat_rate);
}

function docStatusBadge(doc: any, t: (k: string) => string) {
    const s = doc?.doc_status ?? "";
    if (s === "Submitted") {
        const p = doc?.payment_status ?? "—";
        if (p === "Paid") {
            return { status: t("Paid"), variant: "success" as const };
        }
        const today = zodula.date.today();
        const dueDate = doc?.due_date ? String(doc.due_date).slice(0, 10) : "";
        if (dueDate && dueDate < today) return { status: t("Due"), variant: "destructive" as const };
        const v = p === "To Bill" || p === "Unpaid" ? "destructive" : p === "Partially Paid" ? "warning" : "default";
        return { status: t(p), variant: v };
    }
    const v = s === "Cancelled" ? "destructive" : s === "Draft" ? "draft" : "default";
    return { status: t(s) || s, variant: v };
}

export default function SalesInvoiceScripts() {
    useZui(async (zui) => {
        const applyDocTotals = (frm: any) => {
            const items = (frm.get_value("sales_invoice_items") ?? []) as any[];
            const rawNet = items.reduce((sum, r) => sum + num(r?.total_price), 0);
            const isCreditNote = Number(frm.get_value("is_credit_note") ?? 0) === 1;
            const net = isCreditNote ? -Math.abs(rawNet) : Math.abs(rawNet);
            const currentNet = num(frm.get_value("net_total"));
            if (Math.abs(currentNet - net) > 0.0001) (frm as any).set_value("net_total", net);

            const vatType = ((frm as any).get_value("vat_type") ?? "Excluded") as string;
            const vatRate = num((frm as any).get_value("vat_rate"));

            let vatAmount = 0;
            let grandTotal = net;

            if (vatRate > 0) {
                if (vatType === "Excluded") {
                    vatAmount = round2((net * vatRate) / 100);
                    grandTotal = round2(net + vatAmount);
                } else {
                    // VAT is included in net_total, extract VAT portion.
                    const denom = 100 + vatRate;
                    vatAmount = round2(denom !== 0 ? (net * vatRate) / denom : 0);
                    grandTotal = net;
                }
            }

            const currentVatAmount = num(frm.get_value("total_taxes_and_charges"));
            if (Math.abs(currentVatAmount - vatAmount) > 0.0001) (frm as any).set_value("total_taxes_and_charges", vatAmount);

            const currentGrandTotal = num(frm.get_value("grand_total"));
            if (Math.abs(currentGrandTotal - grandTotal) > 0.0001) (frm as any).set_value("grand_total", grandTotal);
        };

        zui.list.on("Sales Invoice", {
            on_format(ctx) { ctx.set_badge_config?.("doc_status", { getValue: (doc, t) => docStatusBadge(doc, t ?? zui.t) }); },
        });

        zui.form.on("Sales Invoice" as any, {
            on_render(frm: any) {
                frm.set_badge_config?.("doc_status", { getValue: (doc: any, t: any) => docStatusBadge(doc, t ?? zui.t) });
                applyCustomerLinkFilters(frm);
                zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any).then(async (erp: any) => {
                    if (!erp) return;
                    if (Number((frm as any).get_value("ignore_price_project")) !== 1
                        && !frm.get_value("price_project")
                        && erp.default_sales_invoice_price_project) {
                        frm.set_value("price_project", erp.default_sales_invoice_price_project);
                    }

                    const id = frm.get_value("id");
                    const isNew = !id || String(id).startsWith("temp-");
                    let tplId = frm.get_value("apply_vat_template") || (isNew ? erp.default_vat_template : null);
                    const rateUnset = (frm as any).get_value("vat_rate") == null || (frm as any).get_value("vat_rate") === "";
                    if (tplId && rateUnset) {
                        await applyVatTemplateToForm(frm, tplId);
                        if (!(frm as any).get_value("apply_vat_template")) (frm as any).set_value("apply_vat_template", tplId);
                    }
                    applyDocTotals(frm);
                });
            },
            apply_vat_template: async (frm: any) => {
                await applyVatTemplateToForm(frm, frm.get_value("apply_vat_template"));
                applyDocTotals(frm);
            },
            is_credit_note: (frm: any) => applyDocTotals(frm),
            vat_type: (frm: any) => applyDocTotals(frm),
            vat_rate: (frm: any) => applyDocTotals(frm),
            customer: async (frm: any) => {
                console.log("customer", frm.get_value("customer"));
                applyCustomerLinkFilters(frm);
                const c = frm.get_value("customer") ? await zodula.doc.get_doc("Customer", frm.get_value("customer")) : null;
                const vals = c ? [c.tax_id ?? "", c.phone ?? "", c.address ?? ""] : ["", "", ""];
                ["customer_tax_id", "customer_phone", "customer_address"].forEach((k, i) => frm.set_value(k as any, vals[i]));
                const base = frm.get_value("posting_date") || zodula.date.today();
                const days = c?.credit_days != null ? num(c.credit_days) : 1;
                frm.set_value("due_date", zodula.date.format(zodula.date.add(base, days, "days"), "date"));
            },
            "sales_invoice_items.item": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const pid = frm.doc?.sales_invoice_items?.[idx]?.item;
                if (!pid) {
                    frm.set_value(`sales_invoice_items.${idx}.uom`, "");
                    frm.set_value(`sales_invoice_items.${idx}.item_name`, "");
                    frm.set_value(`sales_invoice_items.${idx}.item_description`, "");
                    frm.set_value(`sales_invoice_items.${idx}.item_image`, "");
                    frm.set_value(`sales_invoice_items.${idx}.length`, 0);
                    frm.set_value(`sales_invoice_items.${idx}.width`, 0);
                    frm.set_value(`sales_invoice_items.${idx}.height`, 0);
                    frm.set_value(`sales_invoice_items.${idx}.weight`, 0);
                    frm.set_value(`sales_invoice_items.${idx}.volume`, 0);
                    frm.set_value(`sales_invoice_items.${idx}.volume_total`, 0);
                    frm.set_value(`sales_invoice_items.${idx}.weight_total`, 0);
                    frm.set_value(`sales_invoice_items.${idx}.unit_price`, 0);
                    applyDocTotals(frm);
                    return;
                }
                const p = await zodula.doc.get_doc("Item", pid) as any;
                if (!p) return;
                const length = num(p.length);
                const width = num(p.width);
                const height = num(p.height);
                const weight = num(p.weight);
                const volume = num(p.volume);
                const q = num(frm.get_value(`sales_invoice_items.${idx}.quantity`));
                const itemUom = p.uom ?? "";
                frm.set_value(`sales_invoice_items.${idx}.uom`, itemUom);
                frm.set_value(`sales_invoice_items.${idx}.item_name`, p.item_name ?? "");
                frm.set_value(`sales_invoice_items.${idx}.item_description`, p.item_description ?? "");
                frm.set_value(`sales_invoice_items.${idx}.item_image`, p.item_image ?? "");
                frm.set_value(`sales_invoice_items.${idx}.length`, length);
                frm.set_value(`sales_invoice_items.${idx}.width`, width);
                frm.set_value(`sales_invoice_items.${idx}.height`, height);
                frm.set_value(`sales_invoice_items.${idx}.weight`, weight);
                frm.set_value(`sales_invoice_items.${idx}.volume`, volume);
                frm.set_value(`sales_invoice_items.${idx}.volume_total`, volume * q);
                frm.set_value(`sales_invoice_items.${idx}.weight_total`, weight * q);
                const priceProject = frm.get_value("price_project");
                const customer = frm.get_value("customer");
                const skipPrice = Number((frm as any).get_value("ignore_price_project")) === 1;
                if (itemUom && !skipPrice) {
                    if (priceProject && customer) {
                        const today = frm.get_value("posting_date") || zodula.date.today();
                        const res = await zodula.doc.select_docs("Price" as any, {
                            limit: 1, sort: "until_date", order: "asc",
                            filters: [["item", "=", pid], ["price_project", "=", priceProject], ["customer", "=", customer], ["uom", "=", itemUom], ["from_date", "<=", today], ["until_date", ">=", today]],
                        });
                        const pl = (res?.docs ?? [])[0] as any;
                        if (pl) {
                            zui.toast.success(`Price: ${num(pl.price)}`);
                            frm.set_value(`sales_invoice_items.${idx}.unit_price`, num(pl.price));
                        }
                    }
                }
                const unitPrice = num(frm.get_value(`sales_invoice_items.${idx}.unit_price`));
                frm.set_value(`sales_invoice_items.${idx}.total_price`, q * unitPrice);
                applyDocTotals(frm);
            },
            "sales_invoice_items.idx": async (frm: any) => {
                applyDocTotals(frm);
            },
            "sales_invoice_items.quantity": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`sales_invoice_items.${idx}.quantity`));
                const up = num(frm.get_value(`sales_invoice_items.${idx}.unit_price`));
                frm.set_value(`sales_invoice_items.${idx}.volume_total`, num(frm.get_value(`sales_invoice_items.${idx}.volume`)) * q);
                frm.set_value(`sales_invoice_items.${idx}.weight_total`, num(frm.get_value(`sales_invoice_items.${idx}.weight`)) * q);
                frm.set_value(`sales_invoice_items.${idx}.total_price`, q * up);
            },
            "sales_invoice_items.unit_price": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`sales_invoice_items.${idx}.quantity`));
                frm.set_value(`sales_invoice_items.${idx}.total_price`, q * num(frm.get_value(`sales_invoice_items.${idx}.unit_price`)));
            },
            "sales_invoice_items.total_price": (frm: any) => applyDocTotals(frm),
        } as any);

        zui.form.set_secondary_button("Sales Invoice", "Create Sales Receipt", async (frm) => {
            const invoiceId = frm.get_value("id") ?? frm?.doc?.id;
            if (!invoiceId || String(invoiceId).startsWith("temp-")) {
                zui.toast.error("Save the Sales Invoice first.");
                return;
            }
            const ok = await zui.confirm({
                title: "Create Sales Receipt",
                message: "Create a Sales Receipt from this invoice and open it?",
            });
            if (!ok) return;
            try {
                const created = await zodula.doc.create_doc("Sales Receipt" as any, {
                    from_sales_invoice: invoiceId,
                    customer: frm.get_value("customer"),
                    posting_date: frm.get_value("posting_date") || zodula.date.today(),
                } as any);
                const id = (created as any)?.id;
                if (!id) {
                    zui.toast.error("Sales Receipt was created but has no id.");
                    return;
                }
                zui.toast.success("Sales Receipt created.");
                zui.router?.push(`/desk/doctypes/Sales Receipt/form/${encodeURIComponent(String(id))}`);
            } catch (e: any) {
                zui.toast.error(e?.message ?? "Failed to create Sales Receipt.");
            }
        }, { icon: "FileText", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" && Number((ctx?.doc as any)?.is_credit_note ?? 0) !== 1 && ctx?.doc?.payment_status === "Paid" });

        zui.form.set_secondary_button("Sales Invoice", "Create Payment Entry", async (frm) => {
            const invoiceId = frm.get_value("id") ?? frm?.doc?.id;
            const totalAmount = num(frm.get_value("grand_total"));
            const isCreditNote = Number((frm?.doc as any)?.is_credit_note ?? 0) === 1;
            const prefill: Record<string, any> = {
                payment_type: isCreditNote ? "Receive" : "Receive",
                posting_date: frm.get_value("posting_date") || zodula.date.today(),
                party_type: "Customer",
                party: frm.get_value("customer"),
                paid_amount: Math.abs(totalAmount),
                to_paid_amount: Math.abs(totalAmount),
                "references.0.reference_type": "Sales Invoice",
                "references.0.reference_id": invoiceId,
                "references.0.outstanding_amount": Math.abs(totalAmount),
                "references.0.allocate_amount": Math.abs(totalAmount),
            };
            zui.router?.push(`/desk/doctypes/Payment Entry/form`, { state: { prefill } });
        }, { icon: "DollarSign", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" && Number((ctx?.doc as any)?.is_credit_note ?? 0) !== 1 });

        zui.form.set_secondary_button("Sales Invoice", "Create Credit Note", async (frm) => {
            const invoiceId = frm.get_value("id") ?? frm?.doc?.id;
            const prefill: Record<string, any> = {
                customer: frm.get_value("customer"),
                posting_date: zodula.date.today(),
                due_date: zodula.date.today(),
                is_credit_note: 1,
                return_against_sales_invoice: invoiceId,
                ignore_price_project: frm.get_value("ignore_price_project") ?? 0,
                price_project: frm.get_value("price_project") ?? "",
                apply_vat_template: frm.get_value("apply_vat_template") ?? "",
                vat_type: frm.get_value("vat_type") ?? "Excluded",
                vat_rate: frm.get_value("vat_rate") ?? 0,
            };
            zui.router?.push(`/desk/doctypes/Sales Invoice/form`, { state: { prefill } });
        }, { icon: "DollarSign", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" && Number((ctx?.doc as any)?.is_credit_note ?? 0) !== 1 });

        zui.form.set_secondary_button("Sales Invoice", "Apply Credit Note", async (frm) => {
            const invoiceId = frm.get_value("id") ?? frm?.doc?.id;
            const totalAmount = Math.abs(num(frm.get_value("grand_total")));
            const prefill: Record<string, any> = {
                payment_type: "Receive",
                posting_date: frm.get_value("posting_date") || zodula.date.today(),
                party_type: "Customer",
                party: frm.get_value("customer"),
                paid_amount: totalAmount,
                to_paid_amount: totalAmount,
                "references.0.reference_type": "Sales Invoice",
                "references.0.reference_id": invoiceId,
                "references.0.outstanding_amount": totalAmount,
                "references.0.allocate_amount": totalAmount,
            };
            zui.router?.push(`/desk/doctypes/Payment Entry/form`, { state: { prefill } });
        }, { icon: "DollarSign", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" && Number((ctx?.doc as any)?.is_credit_note ?? 0) === 1 });

        zui.form.set_secondary_button("Sales Invoice", "Refund Credit Note", async (frm) => {
            const invoiceId = frm.get_value("id") ?? frm?.doc?.id;
            const totalAmount = Math.abs(num(frm.get_value("grand_total")));
            const prefill: Record<string, any> = {
                payment_type: "Pay",
                posting_date: frm.get_value("posting_date") || zodula.date.today(),
                party_type: "Customer",
                party: frm.get_value("customer"),
                paid_amount: totalAmount,
                to_paid_amount: totalAmount,
                "references.0.reference_type": "Sales Invoice",
                "references.0.reference_id": invoiceId,
                "references.0.outstanding_amount": totalAmount,
                "references.0.allocate_amount": totalAmount,
            };
            zui.router?.push(`/desk/doctypes/Payment Entry/form`, { state: { prefill } });
        }, { icon: "DollarSign", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" && Number((ctx?.doc as any)?.is_credit_note ?? 0) === 1 });
    }, []);
    return <></>;
}
