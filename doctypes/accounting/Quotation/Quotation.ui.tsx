import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;
const round2 = (v: number) => Math.round(v * 100) / 100;

function applyCustomerLinkFilters(frm: any) {
    const customer = frm.get_value("customer");
    const f = customer ? JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", customer]]) : JSON.stringify([["link_type", "=", "Customer"]]);
    frm.set_df_property?.("billing_address", "filters", f);
    frm.set_df_property?.("shipping_address", "filters", f);
}

async function applyVatTemplateToForm(frm: any, templateId: string | null | undefined) {
    if (!templateId) return;
    const tpl = await zodula.doc.get_doc("VAT Template" as any, templateId) as any;
    if (!tpl) return;
    if (tpl.vat_type != null && tpl.vat_type !== "") (frm as any).set_value("vat_type", tpl.vat_type);
    if (tpl.vat_rate != null) (frm as any).set_value("vat_rate", tpl.vat_rate);
}

function mapQuotationLinesToSalesInvoicePrefill(items: any[]) {
    const prefill: Record<string, any> = {};
    items.forEach((item, i) => {
        const base = `sales_invoice_items.${i}.`;
        prefill[`${base}item`] = item.item ?? "";
        prefill[`${base}item_name`] = item.item_name ?? "";
        prefill[`${base}item_description`] = item.item_description ?? "";
        prefill[`${base}item_image`] = item.item_image ?? "";
        prefill[`${base}quantity`] = item.quantity ?? 0;
        prefill[`${base}uom`] = item.uom ?? "";
        prefill[`${base}unit_price`] = item.unit_price ?? 0;
        prefill[`${base}total_price`] = item.total_price ?? 0;
        prefill[`${base}length`] = item.length ?? 0;
        prefill[`${base}width`] = item.width ?? 0;
        prefill[`${base}height`] = item.height ?? 0;
        prefill[`${base}weight`] = item.weight ?? 0;
        prefill[`${base}volume`] = item.volume ?? 0;
        prefill[`${base}volume_total`] = item.volume_total ?? 0;
        prefill[`${base}weight_total`] = item.weight_total ?? 0;
    });
    return prefill;
}

function mapQuotationLinesToDeliveryNotePrefill(items: any[]) {
    const prefill: Record<string, any> = {};
    items.forEach((item, i) => {
        const base = `delivery_note_items.${i}.`;
        prefill[`${base}item`] = item.item ?? "";
        prefill[`${base}item_name`] = item.item_name ?? "";
        prefill[`${base}item_description`] = item.item_description ?? "";
        prefill[`${base}item_image`] = item.item_image ?? "";
        prefill[`${base}quantity`] = item.quantity ?? 0;
        prefill[`${base}uom`] = item.uom ?? "";
        prefill[`${base}unit_price`] = item.unit_price ?? 0;
        prefill[`${base}total_price`] = item.total_price ?? 0;
        prefill[`${base}length`] = item.length ?? 0;
        prefill[`${base}width`] = item.width ?? 0;
        prefill[`${base}height`] = item.height ?? 0;
        prefill[`${base}weight`] = item.weight ?? 0;
        prefill[`${base}volume`] = item.volume ?? 0;
        prefill[`${base}volume_total`] = item.volume_total ?? 0;
        prefill[`${base}weight_total`] = item.weight_total ?? 0;
    });
    return prefill;
}

export default function QuotationScripts() {
    useZui(async (zui) => {
        const applyDocTotals = (frm: any) => {
            const items = (frm.get_value("quotation_items") ?? []) as any[];
            const rawNet = items.reduce((sum, r) => sum + num(r?.total_price), 0);
            const net = Math.abs(rawNet);
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

        zui.list.on("Quotation", {
            on_format(ctx) {
                ctx.set_badge_config?.("doc_status", {
                    getValue: (doc, t) => {
                        const s = doc?.doc_status ?? "";
                        const v = s === "Cancelled" ? "destructive" : s === "Draft" ? "draft" : "default";
                        return { status: (t ?? zui.t)(s) || s, variant: v };
                    },
                });
            },
        });

        zui.form.on("Quotation" as any, {
            on_render(frm: any) {
                frm.set_badge_config?.("doc_status", {
                    getValue: (doc: any, t: any) => {
                        const s = doc?.doc_status ?? "";
                        const v = s === "Cancelled" ? "destructive" : s === "Draft" ? "draft" : "default";
                        return { status: (t ?? zui.t)(s) || s, variant: v };
                    },
                });
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
            vat_type: (frm: any) => applyDocTotals(frm),
            vat_rate: (frm: any) => applyDocTotals(frm),
            customer: async (frm: any) => {
                applyCustomerLinkFilters(frm);
                const c = frm.get_value("customer") ? await zodula.doc.get_doc("Customer", frm.get_value("customer")) : null;
                const vals = c ? [c.tax_id ?? "", c.phone ?? "", c.address ?? ""] : ["", "", ""];
                ["customer_tax_id", "customer_phone", "customer_address"].forEach((k, i) => frm.set_value(k as any, vals[i]));
                const base = frm.get_value("posting_date") || zodula.date.today();
                const days = c?.credit_days != null ? num(c.credit_days) : 1;
                frm.set_value("due_date", zodula.date.format(zodula.date.add(base, days, "days"), "date"));
            },
            "quotation_items.item": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const pid = frm.doc?.quotation_items?.[idx]?.item;
                if (!pid) {
                    frm.set_value(`quotation_items.${idx}.uom`, "");
                    frm.set_value(`quotation_items.${idx}.item_name`, "");
                    frm.set_value(`quotation_items.${idx}.item_description`, "");
                    frm.set_value(`quotation_items.${idx}.item_image`, "");
                    frm.set_value(`quotation_items.${idx}.length`, 0);
                    frm.set_value(`quotation_items.${idx}.width`, 0);
                    frm.set_value(`quotation_items.${idx}.height`, 0);
                    frm.set_value(`quotation_items.${idx}.weight`, 0);
                    frm.set_value(`quotation_items.${idx}.volume`, 0);
                    frm.set_value(`quotation_items.${idx}.volume_total`, 0);
                    frm.set_value(`quotation_items.${idx}.weight_total`, 0);
                    frm.set_value(`quotation_items.${idx}.unit_price`, 0);
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
                const q = num(frm.get_value(`quotation_items.${idx}.quantity`));
                const itemUom = p.uom ?? "";
                frm.set_value(`quotation_items.${idx}.uom`, itemUom);
                frm.set_value(`quotation_items.${idx}.item_name`, p.item_name ?? "");
                frm.set_value(`quotation_items.${idx}.item_description`, p.item_description ?? "");
                frm.set_value(`quotation_items.${idx}.item_image`, p.item_image ?? "");
                frm.set_value(`quotation_items.${idx}.length`, length);
                frm.set_value(`quotation_items.${idx}.width`, width);
                frm.set_value(`quotation_items.${idx}.height`, height);
                frm.set_value(`quotation_items.${idx}.weight`, weight);
                frm.set_value(`quotation_items.${idx}.volume`, volume);
                frm.set_value(`quotation_items.${idx}.volume_total`, volume * q);
                frm.set_value(`quotation_items.${idx}.weight_total`, weight * q);
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
                            frm.set_value(`quotation_items.${idx}.unit_price`, num(pl.price));
                        }
                    }
                }
                const unitPrice = num(frm.get_value(`quotation_items.${idx}.unit_price`));
                frm.set_value(`quotation_items.${idx}.total_price`, q * unitPrice);
                applyDocTotals(frm);
            },
            "quotation_items.idx": async (frm: any) => {
                applyDocTotals(frm);
            },
            "quotation_items.quantity": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`quotation_items.${idx}.quantity`));
                const up = num(frm.get_value(`quotation_items.${idx}.unit_price`));
                frm.set_value(`quotation_items.${idx}.volume_total`, num(frm.get_value(`quotation_items.${idx}.volume`)) * q);
                frm.set_value(`quotation_items.${idx}.weight_total`, num(frm.get_value(`quotation_items.${idx}.weight`)) * q);
                frm.set_value(`quotation_items.${idx}.total_price`, q * up);
            },
            "quotation_items.unit_price": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`quotation_items.${idx}.quantity`));
                frm.set_value(`quotation_items.${idx}.total_price`, q * num(frm.get_value(`quotation_items.${idx}.unit_price`)));
            },
            "quotation_items.total_price": (frm: any) => applyDocTotals(frm),
        } as any);

        zui.form.set_secondary_button("Quotation", "Create Sales Invoice", async (frm) => {
            const quoteId = frm.get_value("id") ?? frm?.doc?.id;
            const items = (frm.get_value("quotation_items") ?? []) as any[];
            const prefill: Record<string, any> = {
                quotation: quoteId,
                customer: frm.get_value("customer"),
                posting_date: zodula.date.today(),
                ignore_price_project: frm.get_value("ignore_price_project") ?? 0,
                price_project: frm.get_value("price_project") ?? "",
                apply_vat_template: frm.get_value("apply_vat_template") ?? "",
                vat_type: frm.get_value("vat_type") ?? "Excluded",
                vat_rate: frm.get_value("vat_rate") ?? 0,
                billing_address: frm.get_value("billing_address"),
                shipping_address: frm.get_value("shipping_address"),
                ...mapQuotationLinesToSalesInvoicePrefill(items),
            };
            const c = frm.get_value("customer") ? await zodula.doc.get_doc("Customer", frm.get_value("customer")) as any : null;
            const base = prefill.posting_date || zodula.date.today();
            const days = c?.credit_days != null ? num(c.credit_days) : 1;
            prefill.due_date = zodula.date.format(zodula.date.add(base, days, "days"), "date");
            zui.router?.push(`/desk/doctypes/Sales Invoice/form`, { state: { prefill } });
        }, {
            icon: "FileText",
            condition: (ctx) =>
                ctx?.doc?.doc_status === "Submitted"
                && Number((ctx?.doc as any)?.is_delivery_order) !== 1,
        });

        zui.form.set_secondary_button("Quotation", "Create Delivery Note", async (frm) => {
            const quoteId = frm.get_value("id") ?? frm?.doc?.id;
            const items = (frm.get_value("quotation_items") ?? []) as any[];
            const prefill: Record<string, any> = {
                quotation: quoteId,
                customer: frm.get_value("customer"),
                posting_date: frm.get_value("posting_date") || zodula.date.today(),
                ignore_price_project: frm.get_value("ignore_price_project") ?? 0,
                price_project: frm.get_value("price_project") ?? "",
                apply_vat_template: frm.get_value("apply_vat_template") ?? "",
                vat_type: frm.get_value("vat_type") ?? "Excluded",
                vat_rate: frm.get_value("vat_rate") ?? 0,
                billing_address: frm.get_value("billing_address"),
                shipping_address: frm.get_value("shipping_address"),
                ...mapQuotationLinesToDeliveryNotePrefill(items),
            };
            zui.router?.push(`/desk/doctypes/Delivery Note/form`, { state: { prefill } });
        }, {
            icon: "Package",
            condition: (ctx) =>
                ctx?.doc?.doc_status === "Submitted"
                && Number((ctx?.doc as any)?.is_delivery_order) === 1,
        });
    }, []);
    return <></>;
}
