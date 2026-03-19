import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

function applyCustomerLinkFilters(frm: any) {
    const customer = frm.get_value("customer");
    const f = customer ? JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", customer]]) : JSON.stringify([["link_type", "=", "Customer"]]);
    frm.set_df_property?.("billing_address", "filters", f);
    frm.set_df_property?.("shipping_address", "filters", f);
    frm.set_df_property?.("billing_contact", "filters", f);
    frm.set_df_property?.("shipping_contact", "filters", f);
}

function docStatusBadge(doc: any, t: (k: string) => string) {
    const s = doc?.doc_status ?? "";
    if (s === "Submitted") {
        const today = zodula.date.today();
        const dueDate = doc?.due_date ? String(doc.due_date).slice(0, 10) : "";
        if (dueDate && dueDate < today) return { status: t("Due"), variant: "destructive" as const };
        const p = doc?.payment_status ?? "—";
        const v = p === "Paid" ? "success" : p === "To Bill" || p === "Unpaid" ? "destructive" : p === "Partially Paid" ? "warning" : "default";
        return { status: t(p), variant: v };
    }
    const v = s === "Cancelled" ? "destructive" : s === "Draft" ? "draft" : "default";
    return { status: t(s) || s, variant: v };
}

export default function SalesInvoiceScripts() {
    useZui(async (zui) => {
        const applyDocTotals = (frm: any) => {
            const items = (frm.get_value("sales_invoice_items") ?? []) as any[];
            const net = items.reduce((sum, r) => sum + num(r?.total_price), 0);
            frm.set_value("net_total", net);
            const taxes = (frm.get_value("tax_and_charges") ?? []) as any[];
            const sorted = [...taxes].sort((a, b) => (a?.idx ?? 0) - (b?.idx ?? 0));
            let run = net;
            const amt = new Map<any, number>();
            const tot = new Map<any, number>();
            let totalTaxes = 0;
            sorted.forEach((r, i) => {
                const rate = num(r?.rate);
                const ct = r?.charge_type ?? "Actual";
                const a =
                    ct === "Actual"
                        ? rate
                        : ct === "On Net Total"
                            ? (net * rate) / 100
                            : ct === "On Previous Row Amount" && i > 0
                                ? ((amt.get(sorted[i - 1]) ?? 0) * rate) / 100
                                : ct === "On Previous Row Total" && i > 0
                                    ? ((tot.get(sorted[i - 1]) ?? run) * rate) / 100
                                    : 0;
                amt.set(r, a);

                if (r?.tax_type === "Excluded") {
                    run += a;
                } else if (r?.tax_type === "Excluded Subtract") {
                    run -= a;
                }

                const effect = r?.tax_type === "Excluded Subtract" ? -a : a;
                totalTaxes += effect;
                tot.set(r, run);
            });
            taxes.forEach((r, i) => {
                frm.set_value(`tax_and_charges.${i}.tax_amount`, amt.get(r) ?? 0);
                frm.set_value(`tax_and_charges.${i}.total`, tot.get(r) ?? 0);
            });
            frm.set_value("total_taxes_and_charges", totalTaxes);
            frm.set_value("grand_total", run);
        };

        const syncTaxTableReadOnly = (frm: any) => {
            const hasTemplate = !!frm.get_value("apply_tax_template");
            frm.set_df_property?.("tax_and_charges", "readonly", hasTemplate ? 1 : 0);
        };

        zui.list.on("Sales Invoice", {
            on_format(ctx) { ctx.set_badge_config?.("doc_status", { getValue: (doc, t) => docStatusBadge(doc, t ?? zui.t) }); },
        });

        zui.form.on("Sales Invoice", {
            on_render(frm) {
                frm.set_badge_config?.("doc_status", { getValue: (doc, t) => docStatusBadge(doc, t ?? zui.t) });
                applyCustomerLinkFilters(frm);
                zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any).then((erp: any) => {
                    if (!erp) return;
                    if (!frm.get_value("price_project") && (erp.default_sales_invoice_price_project ?? erp.default_delivery_note_price_project)) frm.set_value("price_project", erp.default_sales_invoice_price_project ?? erp.default_delivery_note_price_project);
                    if (!frm.get_value("apply_tax_template") && (erp.default_sales_invoice_tax_template ?? erp.default_delivery_note_tax_template)) frm.set_value("apply_tax_template", erp.default_sales_invoice_tax_template ?? erp.default_delivery_note_tax_template);
                });
                syncTaxTableReadOnly(frm);
            },
            apply_tax_template: async (frm) => {
                const tplId = frm.get_value("apply_tax_template");
                if (!tplId) {
                    syncTaxTableReadOnly(frm);
                    return;
                }
                const tpl = await zodula.doc.get_doc("Tax Template" as any, tplId) as any;
                const items = (tpl?.tax_template_items ?? []) as any[];
                const currentItems = (frm.get_value("tax_and_charges") ?? []) as any[];
                currentItems.forEach((it: any, i: number) => {
                    frm.set_value(`tax_and_charges.${i}.idx`, i);
                });
                items.forEach(async (it: any, i: number) => {
                    frm.set_value(`tax_and_charges.${i}.charge_type`, it.charge_type ?? "Actual");
                    frm.set_value(`tax_and_charges.${i}.account_head`, it.account_head ?? "");
                    frm.set_value(`tax_and_charges.${i}.description`, it.description ?? "");
                    frm.set_value(`tax_and_charges.${i}.tax_type`, it.tax_type ?? "Excluded");
                    await new Promise(resolve => setTimeout(resolve, 50));
                    frm.set_value(`tax_and_charges.${i}.rate`, num(it.rate));
                });
                syncTaxTableReadOnly(frm);
            },
            customer: async (frm) => {
                applyCustomerLinkFilters(frm);
                const c = frm.get_value("customer") ? await zodula.doc.get_doc("Customer", frm.get_value("customer")) : null;
                const vals = c ? [c.name ?? "", c.tax_id ?? "", c.phone ?? "", c.address ?? ""] : ["", "", "", ""];
                ["customer_name", "customer_tax_id", "customer_phone", "customer_address"].forEach((k, i) => frm.set_value(k as any, vals[i]));
                const base = frm.get_value("posting_date") || zodula.date.today();
                const days = c?.credit_days != null ? num(c.credit_days) : 1;
                frm.set_value("due_date", zodula.date.format(zodula.date.add(base, days, "days"), "date"));
            },
            "sales_invoice_items.product": async (frm) => {
                const idx = frm.idx ?? 0;
                const pid = frm.doc?.sales_invoice_items?.[idx]?.product;
                if (!pid) {
                    frm.set_value(`sales_invoice_items.${idx}.uom`, "");
                    frm.set_value(`sales_invoice_items.${idx}.product_name`, "");
                    frm.set_value(`sales_invoice_items.${idx}.product_description`, "");
                    frm.set_value(`sales_invoice_items.${idx}.product_image`, "");
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
                const p = await zodula.doc.get_doc("Product", pid) as any;
                if (!p) return;
                const length = num(p.length);
                const width = num(p.width);
                const height = num(p.height);
                const weight = num(p.weight);
                const volume = num(p.volume);
                const q = num(frm.get_value(`sales_invoice_items.${idx}.quantity`));
                const productUom = p.uom ?? "";
                frm.set_value(`sales_invoice_items.${idx}.uom`, productUom);
                frm.set_value(`sales_invoice_items.${idx}.product_name`, p.product_name ?? "");
                frm.set_value(`sales_invoice_items.${idx}.product_description`, p.product_description ?? "");
                frm.set_value(`sales_invoice_items.${idx}.product_image`, p.product_image ?? "");
                frm.set_value(`sales_invoice_items.${idx}.length`, length);
                frm.set_value(`sales_invoice_items.${idx}.width`, width);
                frm.set_value(`sales_invoice_items.${idx}.height`, height);
                frm.set_value(`sales_invoice_items.${idx}.weight`, weight);
                frm.set_value(`sales_invoice_items.${idx}.volume`, volume);
                frm.set_value(`sales_invoice_items.${idx}.volume_total`, volume * q);
                frm.set_value(`sales_invoice_items.${idx}.weight_total`, weight * q);
                const priceProject = frm.get_value("price_project");
                const customer = frm.get_value("customer");
                if (productUom) {
                    if (priceProject && customer) {
                        const today = frm.get_value("posting_date") || zodula.date.today();
                        const res = await zodula.doc.select_docs("Price" as any, {
                            limit: 1, sort: "until_date", order: "asc",
                            filters: [["product", "=", pid], ["price_project", "=", priceProject], ["customer", "=", customer], ["uom", "=", productUom], ["from_date", "<=", today], ["until_date", ">=", today]],
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
            "sales_invoice_items.idx": async (frm) => {
                applyDocTotals(frm);
            },
            "sales_invoice_items.quantity": async (frm) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`sales_invoice_items.${idx}.quantity`));
                const up = num(frm.get_value(`sales_invoice_items.${idx}.unit_price`));
                frm.set_value(`sales_invoice_items.${idx}.volume_total`, num(frm.get_value(`sales_invoice_items.${idx}.volume`)) * q);
                frm.set_value(`sales_invoice_items.${idx}.weight_total`, num(frm.get_value(`sales_invoice_items.${idx}.weight`)) * q);
                frm.set_value(`sales_invoice_items.${idx}.total_price`, q * up);
            },
            "sales_invoice_items.unit_price": async (frm) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`sales_invoice_items.${idx}.quantity`));
                frm.set_value(`sales_invoice_items.${idx}.total_price`, q * num(frm.get_value(`sales_invoice_items.${idx}.unit_price`)));
            },
            "sales_invoice_items.total_price": (frm) => applyDocTotals(frm),
            "tax_and_charges.idx": (frm) => applyDocTotals(frm),
            "tax_and_charges.rate": (frm) => applyDocTotals(frm),
            "tax_and_charges.charge_type": (frm) => applyDocTotals(frm),
            "tax_and_charges.tax_type": (frm) => applyDocTotals(frm),
        });

        zui.form.set_secondary_button("Sales Invoice", "Create Payment Entry", async (frm) => {
            const invoiceId = frm.get_value("id") ?? frm?.doc?.id;
            const totalAmount = num(frm.get_value("grand_total"));
            const prefill: Record<string, any> = {
                payment_type: "Receive",
                posting_date: frm.get_value("posting_date") || zodula.date.today(),
                party_type: "Customer",
                party: frm.get_value("customer"),
                paid_amount: totalAmount,
                "references.0.reference_type": "Sales Invoice",
                "references.0.reference_id": invoiceId,
                "references.0.allocated_amount": totalAmount,
            };
            zui.router?.push(`/desk/doctypes/Payment Entry/form`, { state: { prefill } });
        }, { icon: "DollarSign", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" });
    }, []);
    return <></>;
}
