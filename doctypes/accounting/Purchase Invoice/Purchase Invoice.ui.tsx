import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

function applySupplierLinkFilters(frm: any) {
    const supplier = frm.get_value("supplier");
    const f = supplier
        ? JSON.stringify([["link_type", "=", "Supplier"], ["link_id", "=", supplier]])
        : JSON.stringify([["link_type", "=", "Supplier"]]);
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

export default function PurchaseInvoiceScripts() {
    useZui(async (zui) => {
        const applyDocTotals = (frm: any) => {
            const items = (frm.get_value("purchase_invoice_items") ?? []) as any[];
            const net = items.reduce((sum, r) => sum + num(r?.total_price), 0);
            frm.set_value("net_total", net);
            frm.set_value("total_taxes_and_charges", 0);
            frm.set_value("grand_total", net);
        };

        zui.list.on("Purchase Invoice", {
            on_format(ctx) { ctx.set_badge_config?.("doc_status", { getValue: (doc, t) => docStatusBadge(doc, t ?? zui.t) }); },
        });

        zui.form.on("Purchase Invoice", {
            on_render(frm) {
                frm.set_badge_config?.("doc_status", { getValue: (doc, t) => docStatusBadge(doc, t ?? zui.t) });
                applySupplierLinkFilters(frm);
            },
            supplier: async (frm) => {
                applySupplierLinkFilters(frm);
                const s = frm.get_value("supplier") ? await zodula.doc.get_doc("Supplier" as any, frm.get_value("supplier")) : null;
                const vals = s ? [s.tax_id ?? "", s.phone ?? "", s.address ?? ""] : ["", "", ""];
                ["supplier_tax_id", "supplier_phone", "supplier_address"].forEach((k, i) => frm.set_value(k as any, vals[i]));
                const base = frm.get_value("posting_date") || zodula.date.today();
                const days = s?.credit_days != null ? num(s.credit_days) : 1;
                frm.set_value("due_date", zodula.date.format(zodula.date.add(base, days, "days"), "date"));
            },
            "purchase_invoice_items.product": async (frm) => {
                const idx = frm.idx ?? 0;
                const pid = frm.doc?.purchase_invoice_items?.[idx]?.product;
                if (!pid) {
                    frm.set_value(`purchase_invoice_items.${idx}.uom`, "");
                    frm.set_value(`purchase_invoice_items.${idx}.product_name`, "");
                    frm.set_value(`purchase_invoice_items.${idx}.product_description`, "");
                    frm.set_value(`purchase_invoice_items.${idx}.product_image`, "");
                    frm.set_value(`purchase_invoice_items.${idx}.length`, 0);
                    frm.set_value(`purchase_invoice_items.${idx}.width`, 0);
                    frm.set_value(`purchase_invoice_items.${idx}.height`, 0);
                    frm.set_value(`purchase_invoice_items.${idx}.weight`, 0);
                    frm.set_value(`purchase_invoice_items.${idx}.unit_price`, 0);
                    applyDocTotals(frm);
                    return;
                }
                const p = await zodula.doc.get_doc("Product", pid) as any;
                if (!p) return;
                const q = num(frm.get_value(`purchase_invoice_items.${idx}.quantity`));
                const productUom = p.uom ?? "";
                frm.set_value(`purchase_invoice_items.${idx}.uom`, productUom);
                frm.set_value(`purchase_invoice_items.${idx}.product_name`, p.product_name ?? "");
                frm.set_value(`purchase_invoice_items.${idx}.product_description`, p.product_description ?? "");
                frm.set_value(`purchase_invoice_items.${idx}.product_image`, p.product_image ?? "");
                frm.set_value(`purchase_invoice_items.${idx}.length`, num(p.length));
                frm.set_value(`purchase_invoice_items.${idx}.width`, num(p.width));
                frm.set_value(`purchase_invoice_items.${idx}.height`, num(p.height));
                frm.set_value(`purchase_invoice_items.${idx}.weight`, num(p.weight));

                const priceProject = frm.get_value("price_project");
                const supplier = frm.get_value("supplier");
                if (productUom && priceProject && supplier) {
                    const today = frm.get_value("posting_date") || zodula.date.today();
                    const res = await zodula.doc.select_docs("Price" as any, {
                        limit: 1,
                        sort: "until_date",
                        order: "asc",
                        filters: [
                            ["product", "=", pid],
                            ["price_project", "=", priceProject],
                            ["supplier", "=", supplier],
                            ["uom", "=", productUom],
                            ["from_date", "<=", today],
                            ["until_date", ">=", today],
                        ],
                    });
                    const pl = (res?.docs ?? [])[0] as any;
                    if (pl) {
                        zui.toast.success(`Price: ${num(pl.price)}`);
                        frm.set_value(`purchase_invoice_items.${idx}.unit_price`, num(pl.price));
                    }
                }
                const unitPrice = num(frm.get_value(`purchase_invoice_items.${idx}.unit_price`));
                frm.set_value(`purchase_invoice_items.${idx}.total_price`, q * unitPrice);
                applyDocTotals(frm);
            },
            "purchase_invoice_items.idx": async (frm) => {
                applyDocTotals(frm);
            },
            "purchase_invoice_items.quantity": async (frm) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`purchase_invoice_items.${idx}.quantity`));
                const up = num(frm.get_value(`purchase_invoice_items.${idx}.unit_price`));
                frm.set_value(`purchase_invoice_items.${idx}.total_price`, q * up);
            },
            "purchase_invoice_items.unit_price": async (frm) => {
                const idx = frm.idx ?? 0;
                const q = num(frm.get_value(`purchase_invoice_items.${idx}.quantity`));
                frm.set_value(`purchase_invoice_items.${idx}.total_price`, q * num(frm.get_value(`purchase_invoice_items.${idx}.unit_price`)));
            },
            "purchase_invoice_items.total_price": (frm) => applyDocTotals(frm),
        });

        zui.form.set_secondary_button("Purchase Invoice", "Create Payment Entry", async (frm) => {
            const invoiceId = frm.get_value("id") ?? frm?.doc?.id;
            const totalAmount = num(frm.get_value("grand_total"));
            const prefill: Record<string, any> = {
                payment_type: "Pay",
                posting_date: frm.get_value("posting_date") || zodula.date.today(),
                party_type: "Supplier",
                party: frm.get_value("supplier"),
                paid_amount: totalAmount,
                to_paid_amount: totalAmount,
                "references.0.reference_type": "Purchase Invoice",
                "references.0.reference_id": invoiceId,
                "references.0.outstanding_amount": totalAmount,
                "references.0.allocate_amount": totalAmount,
            };
            zui.router?.push(`/desk/doctypes/Payment Entry/form`, { state: { prefill } });
        }, { icon: "DollarSign", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" });
    }, []);
    return <></>;
}
