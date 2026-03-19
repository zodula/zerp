import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";
import { useEffect } from "react";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

function applyCustomerLinkFilters(frm: any) {
    const customer = frm.get_value("customer");
    const f = customer ? JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", customer]]) : JSON.stringify([["link_type", "=", "Customer"]]);
    frm.set_df_property?.("billing_address", "filters", f);
    frm.set_df_property?.("shipping_address", "filters", f);
    frm.set_df_property?.("sender_address", "filters", f);
    frm.set_df_property?.("billing_contact", "filters", f);
    frm.set_df_property?.("shipping_contact", "filters", f);
    frm.set_df_property?.("sender_contact", "filters", f);
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

export default function DeliveryOrderScripts() {
    useZui(async (zui) => {
        const erpSetting = await zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any) as any;
        const enableWeightCalc = erpSetting?.enable_delivery_order_weight_calculation === 1;
        // Start here
        const applyDocTotals = (frm: any) => {
            const items = (frm.get_value("delivery_note_items") ?? []) as any[];
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

                // Apply effect on running total based on tax_type
                if (r?.tax_type === "Excluded") {
                    run += a;
                } else if (r?.tax_type === "Excluded Subtract") {
                    run -= a;
                }

                // Total taxes should reflect withholding (subtract) as negative
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

        zui.list.on("Delivery Note", {
            on_format(ctx) { ctx.set_badge_config?.("doc_status", { getValue: (doc, t) => docStatusBadge(doc, t ?? zui.t) }); },
        });

        zui.form.on("Delivery Note", {
            on_render(frm) {
                frm.set_badge_config?.("doc_status", { getValue: (doc, t) => docStatusBadge(doc, t ?? zui.t) });
                applyCustomerLinkFilters(frm);
                zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any).then((erp: any) => {
                    if (!erp) return;
                    if (!frm.get_value("price_project") && erp.default_delivery_note_price_project) frm.set_value("price_project", erp.default_delivery_note_price_project);
                    if (!frm.get_value("apply_tax_template") && erp.default_delivery_note_tax_template) frm.set_value("apply_tax_template", erp.default_delivery_note_tax_template);
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
                // clear table
                // set items from tax template
                const currentItems = (frm.get_value("tax_and_charges") ?? []) as any[];
                currentItems.forEach((it: any, i: number) => {
                    frm.set_value(`tax_and_charges.${i}.idx`, i);
                });
                items.forEach(async (it: any, i: number) => {
                    frm.set_value(`tax_and_charges.${i}.charge_type`, it.charge_type ?? "Actual");
                    frm.set_value(`tax_and_charges.${i}.account_head`, it.account_head ?? "");
                    frm.set_value(`tax_and_charges.${i}.description`, it.description ?? "");
                    frm.set_value(`tax_and_charges.${i}.tax_type`, it.tax_type ?? "Excluded");
                    // wait 50ms
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
            "delivery_note_items.idx": async (frm) => {
                applyDocTotals(frm);
            },
            "delivery_note_items.product": async (frm) => {
                const idx = frm.idx ?? 0;
                const pid = frm.doc?.delivery_note_items?.[idx]?.product;
                if (!pid) {
                    frm.set_value(`delivery_note_items.${idx}.uom`, "");
                    frm.set_value(`delivery_note_items.${idx}.product_name`, "");
                    frm.set_value(`delivery_note_items.${idx}.product_description`, "");
                    frm.set_value(`delivery_note_items.${idx}.product_image`, "");
                    frm.set_value(`delivery_note_items.${idx}.length`, 0);
                    frm.set_value(`delivery_note_items.${idx}.width`, 0);
                    frm.set_value(`delivery_note_items.${idx}.height`, 0);
                    frm.set_value(`delivery_note_items.${idx}.weight`, 0);
                    frm.set_value(`delivery_note_items.${idx}.volume`, 0);
                    frm.set_value(`delivery_note_items.${idx}.volume_total`, 0);
                    frm.set_value(`delivery_note_items.${idx}.weight_total`, 0);
                    frm.set_value(`delivery_note_items.${idx}.unit_price`, 0);
                    return;
                }
                const p = await zodula.doc.get_doc("Product", pid) as any;
                if (!p) return;
                const length = num(p.length);
                const width = num(p.width);
                const height = num(p.height);
                const weight = num(p.weight);
                const volume = num(p.volume);
                const q = num(frm.get_value(`delivery_note_items.${idx}.quantity`));
                const productUom = p.uom ?? "";
                frm.set_value(`delivery_note_items.${idx}.uom`, productUom);
                frm.set_value(`delivery_note_items.${idx}.product_name`, p.product_name ?? "");
                frm.set_value(`delivery_note_items.${idx}.product_description`, p.product_description ?? "");
                frm.set_value(`delivery_note_items.${idx}.product_image`, p.product_image ?? "");
                frm.set_value(`delivery_note_items.${idx}.length`, length);
                frm.set_value(`delivery_note_items.${idx}.width`, width);
                frm.set_value(`delivery_note_items.${idx}.height`, height);
                frm.set_value(`delivery_note_items.${idx}.weight`, weight);
                frm.set_value(`delivery_note_items.${idx}.volume`, volume);
                frm.set_value(`delivery_note_items.${idx}.volume_total`, volume * q);
                frm.set_value(`delivery_note_items.${idx}.weight_total`, weight * q);
                if (productUom) {
                    const priceProject = frm.get_value("price_project");
                    const customer = frm.get_value("customer");
                    if (priceProject && customer) {
                        const today = frm.get_value("posting_date")
                        const res = await zodula.doc.select_docs("Price" as any, {
                            limit: 1, sort: "until_date", order: "asc",
                            filters: [["product", "=", pid], ["price_project", "=", priceProject], ["customer", "=", customer], ["uom", "=", productUom], ["from_date", "<=", today], ["until_date", ">=", today]],
                        });
                        const pl = (res?.docs ?? [])[0] as any;
                        if (pl) {
                            zui.toast.success(`Price: ${num(pl.price)}`);
                            frm.set_value(`delivery_note_items.${idx}.unit_price`, num(pl.price));
                        }
                    }
                }
            },
            "delivery_note_items.quantity": async (frm) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`delivery_note_items.${idx}.quantity`));
                frm.set_value(`delivery_note_items.${idx}.total_price`, q * num(frm.get_value(`delivery_note_items.${idx}.unit_price`)));
            },
            "delivery_note_items.unit_price": async (frm) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`delivery_note_items.${idx}.quantity`));
                frm.set_value(`delivery_note_items.${idx}.total_price`, q * num(frm.get_value(`delivery_note_items.${idx}.unit_price`)));
            },
            "delivery_note_items.total_price": (frm) => applyDocTotals(frm),
            "tax_and_charges.idx": (frm) => applyDocTotals(frm),
            "tax_and_charges.rate": (frm) => applyDocTotals(frm),
            "tax_and_charges.charge_type": (frm) => applyDocTotals(frm),
            "tax_and_charges.tax_type": (frm) => applyDocTotals(frm),
        });

        zui.form.set_field_button("Delivery Note", "delivery_note_items", "Select Price", async (frm) => {
            const customer = frm.get_value("customer");
            const price_project = frm.get_value("price_project");
            const posting_date = frm.get_value("posting_date") || zodula.date.today();
            const defaultFilters: [string, string, any][] = [];
            if (customer) defaultFilters.push(["customer", "=", customer]);
            if (price_project) defaultFilters.push(["price_project", "=", price_project]);
            defaultFilters.push(["product_name", "LIKE", "%%"]);
            defaultFilters.push(["from_date", "<=", posting_date]);
            defaultFilters.push(["until_date", ">=", posting_date]);
            const plId = await zui.open_singleselect_dialog({
                doctype: "Price" as any,
                defaultFilters: defaultFilters as any,
                standard_filter_fields: ["customer", "price_project", "uom", "from_date", "until_date"],
                columns: ["product_name", "customer_name", "price", "uom", "from_date", "until_date"],
            }, { title: "Select Price", maxWidth: 1024 });
            if (plId) {
                const pl = await zodula.doc.get_doc("Price" as any, plId) as any;
                if (pl?.product) {
                    const items = (frm.get_value("delivery_note_items") ?? []) as any[];
                    const idx = items.length;
                    const p = await zodula.doc.get_doc("Product", pl.product) as any;
                    const dims = p ? { length: num(p.length), width: num(p.width), height: num(p.height), weight: num(p.weight) } : { length: 0, width: 0, height: 0, weight: 0 };
                    const price = num(pl.price);
                    const uom = pl.uom ?? "";
                    await frm.set_value(`delivery_note_items.${idx}.product`, pl.product);
                    await frm.set_value(`delivery_note_items.${idx}.quantity`, 1);
                    await frm.set_value(`delivery_note_items.${idx}.uom`, uom);
                }
            }
        }, { condition: (ctx) => !!(ctx.get_value("customer") && ctx.get_value("price_project")) && ctx.doc?.doc_status === "Draft" });

        !!enableWeightCalc && zui.form.set_field_button("Delivery Note", "delivery_note_items", "Calculate Price By Weight", async (frm) => {
            if (frm.get_value("doc_status") === "Submitted") { zui.alert("Cannot calculate price for submitted document."); return; }
            const pp = frm.get_value("price_project");
            if (!pp) { zui.alert("Please set Price Project first."); return; }
            const res = await zodula.doc.select_docs("Delivery Price Calculation Table" as any, { limit: 1, sort: "id", order: "asc", filters: [["pricing_project", "=", pp]] });
            const table = (res?.docs ?? [])[0] as any;
            if (!table) { zui.alert("No Delivery Price Calculation Table for this Price Project."); return; }
            const items = [...(table.delivery_price_calculation_table_items ?? [])].sort((a, b) => num(a?.weight) - num(b?.weight));
            if (!items.length) { zui.alert("Price table has no items."); return; }
            const div = num(table.volume_divider);
            const rows = (frm.get_value("delivery_note_items") ?? []) as any[];
            const noWeightNoVolume: { idx: number; label: string }[] = [];
            rows.forEach((row, i) => {
                if (num(row?.total_price) > 0) return;
                const q = num(row?.quantity), wt = num(row?.weight), vol = num(row?.volume) || num(row?.length) * num(row?.width) * num(row?.height);
                if (!wt && !vol) {
                    noWeightNoVolume.push({ idx: i + 1, label: String(row?.product_name || row?.product || "Item").trim() || `Row ${i + 1}` });
                    return;
                }
                let eff = wt;
                if (div > 0 && vol > 0 && vol / div > eff) eff = vol / div;
                const rule = items.find((it: any) => eff <= num(it?.weight)) ?? items[items.length - 1];
                const price = num(rule?.price);
                if (price > 0) { frm.set_value(`delivery_note_items.${i}.unit_price`, price); frm.set_value(`delivery_note_items.${i}.total_price`, q * price); }
            });
            if (noWeightNoVolume.length > 0) {
                const list = noWeightNoVolume.map((x) => `${x.label} (${x.idx})`).join(", ");
                zui.toast.warning(`Items with no weight and volume (skipped): ${list}`);
            }
        }, { condition: (ctx) => (ctx.doc?.doc_status ?? "Draft") === "Draft" });

        zui.form.set_secondary_button("Delivery Note", "Create Sales Invoice", async (frm) => {
            const prefill: Record<string, any> = {
                delivery_note: frm.get_value("id") ?? frm?.doc?.id,
                customer: frm.get_value("customer"),
                customer_name: frm.get_value("customer_name"),
                customer_tax_id: frm.get_value("customer_tax_id"),
                customer_phone: frm.get_value("customer_phone"),
                customer_address: frm.get_value("customer_address"),
                posting_date: frm.get_value("posting_date"),
                due_date: frm.get_value("due_date"),
                price_project: frm.get_value("price_project"),
                billing_address: frm.get_value("billing_address"),
                billing_inline_address: frm.get_value("billing_inline_address"),
                billing_contact: frm.get_value("billing_contact"),
                billing_contact_inline: frm.get_value("billing_contact_inline"),
                shipping_address: frm.get_value("shipping_address"),
                shipping_inline_address: frm.get_value("shipping_inline_address"),
                shipping_contact: frm.get_value("shipping_contact"),
                shipping_contact_inline: frm.get_value("shipping_contact_inline"),
            };

            let useDefaultProduct = false;
            try {
                const erp = await zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any) as any;
                if (erp?.default_delivery_sales_product) {
                    const sales_product = await zodula.doc.get_doc("Product", erp.default_delivery_sales_product) as any;
                    prefill["sales_invoice_items.0.product"] = sales_product?.id ?? "";
                    prefill["sales_invoice_items.0.product_name"] = sales_product?.product_name ?? "";
                    prefill["sales_invoice_items.0.uom"] = "";
                    prefill["sales_invoice_items.0.product_description"] = sales_product?.product_description ?? "";
                    prefill["sales_invoice_items.0.product_image"] = sales_product?.product_image ?? "";
                    prefill["sales_invoice_items.0.uom"] = sales_product?.uom ?? "";
                    prefill["sales_invoice_items.0.length"] = sales_product?.length ?? 0;
                    prefill["sales_invoice_items.0.width"] = sales_product?.width ?? 0;
                    prefill["sales_invoice_items.0.height"] = sales_product?.height ?? 0;
                    prefill["sales_invoice_items.0.weight"] = sales_product?.weight ?? 0;
                    const volume = (sales_product?.length ?? 0) * (sales_product?.width ?? 0) * (sales_product?.height ?? 0);
                    prefill["sales_invoice_items.0.volume"] = volume;
                    prefill["sales_invoice_items.0.volume_total"] = volume;
                    prefill["sales_invoice_items.0.weight_total"] = (sales_product?.weight ?? 0) * 1;
                    prefill["sales_invoice_items.0.quantity"] = 1;
                    prefill["sales_invoice_items.0.unit_price"] = frm.get_value("net_total") ?? 0;
                    prefill["sales_invoice_items.0.total_price"] = frm.get_value("net_total") ?? 0;

                    // taxes and charges
                    const taxes = (frm.get_value("tax_and_charges") ?? []) as any[];
                    taxes.forEach((tax, i) => {
                        prefill[`tax_and_charges.${i}.account_head`] = tax.account_head ?? "";
                        prefill[`tax_and_charges.${i}.description`] = tax.description ?? "";
                        prefill[`tax_and_charges.${i}.charge_type`] = tax.charge_type ?? "Actual";
                        prefill[`tax_and_charges.${i}.tax_type`] = tax.tax_type ?? "Excluded";
                        prefill[`tax_and_charges.${i}.rate`] = tax.rate ?? 0;
                    });
                    prefill[`total_taxes_and_charges`] = frm.get_value("total_taxes_and_charges") ?? 0;

                    // parent fields
                    prefill["net_total"] = frm.get_value("net_total") ?? 0;
                    prefill["grand_total"] = frm.get_value("grand_total") ?? 0;
                    useDefaultProduct = true;
                }
            } catch {

            }

            if (!useDefaultProduct) {
                const items = (frm.get_value("delivery_note_items") ?? []) as any[];
                items.forEach((item, i) => {
                    const base = `sales_invoice_items.${i}.`;
                    prefill[`${base}product`] = item.product ?? "";
                    prefill[`${base}product_name`] = item.product_name ?? "";
                    prefill[`${base}product_description`] = item.product_description ?? "";
                    prefill[`${base}product_image`] = item.product_image ?? "";
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
            }

            zui.router?.push(`/desk/doctypes/Sales Invoice/form`, { state: { prefill } });
        }, { icon: "FileText", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" });

        zui.form.set_secondary_button("Delivery Note", "Create Installation Note", async (frm) => {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, "0");
            const mm = String(now.getMinutes()).padStart(2, "0");
            const prefill: Record<string, any> = {
                delivery_note: frm.get_value("id") ?? frm?.doc?.id,
                installation_date: zodula.date.today(),
                installation_time: `${hh}:${mm}:00`,
            };
            const items = (frm.get_value("delivery_note_items") ?? []) as any[];
            items.forEach((item, i) => {
                const base = `installation_note_items.${i}.`;
                prefill[`${base}product`] = item.product ?? "";
                prefill[`${base}product_name`] = item.product_name ?? "";
                prefill[`${base}quantity`] = item.quantity ?? 0;
                prefill[`${base}uom`] = item.uom ?? "";
            });
            zui.router?.push(`/desk/doctypes/Installation Note/form`, { state: { prefill } });
        }, { icon: "Wrench", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" && ctx?.doc?.installation_percentage < 100 });
    }, []);
    return <></>;
}
