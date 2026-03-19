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

function syncRow(frm: any, idx: number) {
    const q = num(frm.get_value(`sales_invoice_items.${idx}.quantity`));
    const up = num(frm.get_value(`sales_invoice_items.${idx}.unit_price`));
    frm.set_value(`sales_invoice_items.${idx}.total_price`, q * up);
}

function createRecalcTotals() {
    let lock = false;
    return (frm: any) => {
        if (lock) return;
        lock = true;
        try {
            const items = (frm.get_value("sales_invoice_items") ?? []) as any[];
            const net = items.reduce((sum, r) => sum + num(r?.total_price), 0);
            frm.set_value("net_total", net);
            const taxes = (frm.get_value("tax_and_charges") ?? []) as any[];
            const sorted = [...taxes].sort((a, b) => (a?.idx ?? 0) - (b?.idx ?? 0));
            let run = net;
            const amt = new Map<any, number>();
            const tot = new Map<any, number>();
            sorted.forEach((r, i) => {
                const rate = num(r?.rate);
                const ct = r?.charge_type ?? "Actual";
                let a = ct === "Actual" ? rate : ct === "On Net Total" ? (net * rate) / 100
                    : ct === "On Previous Row Amount" && i > 0 ? ((amt.get(sorted[i - 1]) ?? 0) * rate) / 100
                        : ct === "On Previous Row Total" && i > 0 ? ((tot.get(sorted[i - 1]) ?? run) * rate) / 100 : 0;
                amt.set(r, a);
                if (r?.tax_type === "Excluded") run += a;
                tot.set(r, run);
            });
            taxes.forEach((r, i) => {
                frm.set_value(`tax_and_charges.${i}.tax_amount`, amt.get(r) ?? 0);
                frm.set_value(`tax_and_charges.${i}.total`, tot.get(r) ?? 0);
            });
            frm.set_value("total_taxes_and_charges", sorted.reduce((s, r) => s + (amt.get(r) ?? 0), 0));
            frm.set_value("grand_total", run);
        } finally {
            lock = false;
        }
    };
}

export default function SalesInvoiceScripts() {
    useZui((zui) => {
        const recalcTotals = createRecalcTotals();
        let itemTimer: ReturnType<typeof setTimeout> | null = null;
        const onItem = (frm: any) => {
            const idx = frm.idx ?? 0;
            if (itemTimer) clearTimeout(itemTimer);
            itemTimer = setTimeout(() => {
                itemTimer = null;
                syncRow(frm, idx);
            }, 120);
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
                const pid = frm.get_value(`sales_invoice_items.${idx}.product`);
                const keys = ["uom", "product_name", "product_description", "product_image"];
                if (!pid) {
                    keys.forEach(k => frm.set_value(`sales_invoice_items.${idx}.${k}` as any, k === "uom" ? "" : ""));
                    syncRow(frm, idx);
                    recalcTotals(frm);
                    return;
                }
                const p = await zodula.doc.get_doc("Product", pid) as any;
                if (!p) return;
                frm.set_value(`sales_invoice_items.${idx}.uom`, "");
                frm.set_value(`sales_invoice_items.${idx}.product_name`, p.product_name ?? "");
                frm.set_value(`sales_invoice_items.${idx}.product_description`, p.product_description ?? "");
                frm.set_value(`sales_invoice_items.${idx}.product_image`, p.product_image ?? "");
                const priceProject = frm.get_value("price_project");
                const customer = frm.get_value("customer");
                if (priceProject && customer) {
                    const today = zodula.date.today();
                    const res = await zodula.doc.select_docs("Price" as any, {
                        limit: 1, sort: "until_date", order: "asc",
                        filters: [["product", "=", pid], ["price_project", "=", priceProject], ["customer", "=", customer], ["from_date", "<=", today], ["until_date", ">=", today]],
                    });
                    const pl = (res?.docs ?? [])[0] as any;
                    if (pl) {
                        zui.toast.success(`Price: ${p.product_name}, ${pl.uom}, ${num(pl.price)}`);
                        frm.set_value(`sales_invoice_items.${idx}.uom`, pl.uom ?? "");
                        frm.set_value(`sales_invoice_items.${idx}.unit_price`, num(pl.price));
                        frm.set_value(`sales_invoice_items.${idx}.total_price`, num(frm.get_value(`sales_invoice_items.${idx}.quantity`)) * num(pl.price));
                    }
                }
                recalcTotals(frm);
            },
            ...["quantity", "unit_price"].reduce((acc, f) => ({ ...acc, [`sales_invoice_items.${f}`]: onItem }), {} as Record<string, (frm: any) => void>),
            "sales_invoice_items.total_price": recalcTotals,
            "sales_invoice_items.idx": recalcTotals,
            ...["rate", "tax_amount", "charge_type", "tax_type", "idx"].reduce((acc, f) => ({ ...acc, [`tax_and_charges.${f}`]: recalcTotals }), {} as Record<string, (frm: any) => void>),
            apply_tax_template: async (frm) => {
                const tid = frm.get_value("apply_tax_template");
                if (!tid) return;
                const res = await zodula.doc.select_docs("Tax Template Item" as any, { limit: 100, sort: "idx", order: "asc", filters: [["tax_template", "=", tid]] });
                const list = (res?.docs ?? []).map((item: any, i: number) => ({ idx: i, account_head: item.account_head ?? "", description: item.description ?? "", charge_type: item.charge_type ?? "Actual", tax_type: item.tax_type ?? "Excluded", rate: item.rate ?? 0, tax_amount: 0 }));
                frm.set_value("tax_and_charges" as any, list as any);
                recalcTotals(frm);
            },
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
