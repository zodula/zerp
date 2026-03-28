import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;
const round2 = (v: number) => Math.round(v * 100) / 100;

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
        const v = p === "To Bill" || p === "Unpaid" ? "destructive" : p === "Partially Paid" ? "warning" : "default";
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

            const vatType = ((frm as any).get_value("vat_type") ?? "Excluded") as string;
            const vatRate = num((frm as any).get_value("vat_rate"));

            let vatAmount = 0;
            let grandTotal = net;

            if (vatRate > 0) {
                if (vatType === "Excluded") {
                    vatAmount = round2((net * vatRate) / 100);
                    grandTotal = round2(net + vatAmount);
                } else {
                    // VAT is included in the net_total, so extract the VAT portion.
                    const denom = 100 + vatRate;
                    vatAmount = round2(denom !== 0 ? (net * vatRate) / denom : 0);
                    grandTotal = net;
                }
            }

            (frm as any).set_value("total_taxes_and_charges", vatAmount);
            (frm as any).set_value("grand_total", grandTotal);
        };

        zui.list.on("Delivery Note", {
            on_format(ctx) { ctx.set_badge_config?.("doc_status", { getValue: (doc, t) => docStatusBadge(doc, t ?? zui.t) }); },
        });

        zui.form.on("Delivery Note" as any, {
            on_render(frm: any) {
                frm.set_badge_config?.("doc_status", { getValue: (doc: any, t: any) => docStatusBadge(doc, t ?? zui.t) });
                zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any).then(async (erp: any) => {
                    if (!erp) return;
                    if (Number((frm as any).get_value("ignore_price_project")) !== 1
                        && !frm.get_value("price_project")
                        && erp.default_delivery_note_price_project) {
                        frm.set_value("price_project", erp.default_delivery_note_price_project);
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
            customer: async (frm: any) => {
                const c = frm.get_value("customer") ? await zodula.doc.get_doc("Customer", frm.get_value("customer")) : null;
                const vals = c ? [c.tax_id ?? "", c.phone ?? "", c.address ?? ""] : ["", "", ""];
                ["customer_tax_id", "customer_phone", "customer_address"].forEach((k, i) => frm.set_value(k as any, vals[i]));
            },
            apply_vat_template: async (frm: any) => {
                await applyVatTemplateToForm(frm, frm.get_value("apply_vat_template"));
                applyDocTotals(frm);
            },
            vat_type: (frm: any) => applyDocTotals(frm),
            vat_rate: (frm: any) => applyDocTotals(frm),
            "delivery_note_items.idx": async (frm: any) => {
                applyDocTotals(frm);
            },
            "delivery_note_items.item": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const pid = frm.doc?.delivery_note_items?.[idx]?.item;
                if (!pid) {
                    frm.set_value(`delivery_note_items.${idx}.uom`, "");
                    frm.set_value(`delivery_note_items.${idx}.item_name`, "");
                    frm.set_value(`delivery_note_items.${idx}.item_description`, "");
                    frm.set_value(`delivery_note_items.${idx}.item_image`, "");
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
                const p = await zodula.doc.get_doc("Item", pid) as any;
                if (!p) return;
                const length = num(p.length);
                const width = num(p.width);
                const height = num(p.height);
                const weight = num(p.weight);
                const volume = num(p.volume);
                const q = num(frm.get_value(`delivery_note_items.${idx}.quantity`));
                const itemUom = p.uom ?? "";
                frm.set_value(`delivery_note_items.${idx}.uom`, itemUom);
                frm.set_value(`delivery_note_items.${idx}.item_name`, p.item_name ?? "");
                frm.set_value(`delivery_note_items.${idx}.item_description`, p.item_description ?? "");
                frm.set_value(`delivery_note_items.${idx}.item_image`, p.item_image ?? "");
                frm.set_value(`delivery_note_items.${idx}.length`, length);
                frm.set_value(`delivery_note_items.${idx}.width`, width);
                frm.set_value(`delivery_note_items.${idx}.height`, height);
                frm.set_value(`delivery_note_items.${idx}.weight`, weight);
                frm.set_value(`delivery_note_items.${idx}.volume`, volume);
                frm.set_value(`delivery_note_items.${idx}.volume_total`, volume * q);
                frm.set_value(`delivery_note_items.${idx}.weight_total`, weight * q);
                const skipPrice = Number((frm as any).get_value("ignore_price_project")) === 1;
                if (itemUom && !skipPrice) {
                    const priceProject = frm.get_value("price_project");
                    const customer = frm.get_value("customer");
                    if (priceProject && customer) {
                        const today = frm.get_value("posting_date") || zodula.date.today();
                        const res = await zodula.doc.select_docs("Price" as any, {
                            limit: 1, sort: "until_date", order: "asc",
                            filters: [["item", "=", pid], ["price_project", "=", priceProject], ["customer", "=", customer], ["uom", "=", itemUom], ["from_date", "<=", today], ["until_date", ">=", today]],
                        });
                        const pl = (res?.docs ?? [])[0] as any;
                        if (pl) {
                            zui.toast.success(`Price: ${num(pl.price)}`);
                            frm.set_value(`delivery_note_items.${idx}.unit_price`, num(pl.price));
                        }
                    }
                }
            },
            "delivery_note_items.quantity": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`delivery_note_items.${idx}.quantity`));
                frm.set_value(`delivery_note_items.${idx}.total_price`, q * num(frm.get_value(`delivery_note_items.${idx}.unit_price`)));
            },
            "delivery_note_items.unit_price": async (frm: any) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`delivery_note_items.${idx}.quantity`));
                frm.set_value(`delivery_note_items.${idx}.total_price`, q * num(frm.get_value(`delivery_note_items.${idx}.unit_price`)));
            },
            "delivery_note_items.total_price": (frm: any) => applyDocTotals(frm),
        } as any);

        zui.form.set_field_button("Delivery Note", "delivery_note_items", "Select Price", async (frm) => {
            const customer = frm.get_value("customer");
            const price_project = frm.get_value("price_project");
            const posting_date = frm.get_value("posting_date") || zodula.date.today();
            const defaultFilters: [string, string, any][] = [];
            if (customer) defaultFilters.push(["customer", "=", customer]);
            if (price_project) defaultFilters.push(["price_project", "=", price_project]);
            defaultFilters.push(["item_name", "LIKE", "%%"]);
            defaultFilters.push(["from_date", "<=", posting_date]);
            defaultFilters.push(["until_date", ">=", posting_date]);
            const plId = await zui.open_singleselect_dialog({
                doctype: "Price" as any,
                defaultFilters: defaultFilters as any,
                standard_filter_fields: ["customer", "price_project", "uom", "from_date", "until_date"],
                columns: ["item_image", "item_name", "uom", "price", "from_date", "until_date", "customer_name"],
                sort: "item_name",
                order: "asc",
            }, { title: "Select Price", maxWidth: 1600 });
            if (plId) {
                const priceId = typeof plId === "string" ? plId : (plId as any)?.id;
                if (!priceId) return;
                const pl = await zodula.doc.get_doc("Price" as any, priceId) as any;
                if (pl?.item) {
                    const items = (frm.get_value("delivery_note_items") ?? []) as any[];
                    const idx = items.length;
                    const p = await zodula.doc.get_doc("Item", pl.item) as any;
                    const dims = p ? { length: num(p.length), width: num(p.width), height: num(p.height), weight: num(p.weight) } : { length: 0, width: 0, height: 0, weight: 0 };
                    const price = num(pl.price);
                    const uom = pl.uom ?? "";
                    await frm.set_value(`delivery_note_items.${idx}.item`, pl.item);
                    await frm.set_value(`delivery_note_items.${idx}.quantity`, 1);
                    await frm.set_value(`delivery_note_items.${idx}.uom`, uom);
                }
            }
        }, { condition: (ctx) => Number((ctx as any).get_value?.("ignore_price_project")) !== 1 && !!(ctx.get_value("customer") && ctx.get_value("price_project")) && ctx.doc?.doc_status === "Draft" || !ctx.doc?.doc_status });

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
                    noWeightNoVolume.push({ idx: i + 1, label: String(row?.item_name || row?.item || "Item").trim() || `Row ${i + 1}` });
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
        }, { condition: (ctx) => Number((ctx as any).get_value?.("ignore_price_project")) !== 1 && (ctx.doc?.doc_status ?? "Draft") === "Draft" });

        zui.form.set_secondary_button("Delivery Note", "Create Sales Invoice", async (frm) => {
            const prefill: Record<string, any> = {
                ignore_price_project: 1,
                delivery_note: frm.get_value("id") ?? frm?.doc?.id,
                customer: frm.get_value("customer"),
                price_project: frm.get_value("price_project"),
                billing_address: frm.get_value("billing_address"),
                billing_contact: frm.get_value("billing_contact"),
                shipping_address: frm.get_value("shipping_address"),
                shipping_contact: frm.get_value("shipping_contact"),
            };

            let useDefaultItem = false;
            try {
                const erp = await zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any) as any;
                if (erp?.default_delivery_sales_item) {
                    const sales_item = await zodula.doc.get_doc("Item", erp.default_delivery_sales_item) as any;
                    prefill["sales_invoice_items.0.item"] = sales_item?.id ?? "";
                    prefill["sales_invoice_items.0.quantity"] = 1;
                    prefill["sales_invoice_items.0.unit_price"] = frm.get_value("net_total") ?? 0;
                    useDefaultItem = true;
                }
            } catch {

            }

            if (!useDefaultItem) {
                const items = (frm.get_value("delivery_note_items") ?? []) as any[];
                items.forEach((item, i) => {
                    const base = `sales_invoice_items.${i}.`;
                    prefill[`${base}item`] = item.item ?? "";
                    prefill[`${base}quantity`] = item.quantity ?? 0;
                    prefill[`${base}unit_price`] = item.unit_price ?? 0;
                });
            }

            zui.router?.push(`/desk/doctypes/Sales Invoice/form`, { state: { prefill } });
        }, { icon: "FileText", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" || ctx.doc?.payment_status === "To Bill" });

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
                prefill[`${base}item`] = item.item ?? "";
                prefill[`${base}quantity`] = item.quantity ?? 0;
            });
            zui.router?.push(`/desk/doctypes/Installation Note/form`, { state: { prefill } });
        }, { icon: "Wrench", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" && ctx?.doc?.installation_percentage < 100 });
    }, []);
    return <></>;
}
