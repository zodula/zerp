import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

function docStatusBadge(doc: any, t: (k: string) => string) {
    const s = doc?.doc_status ?? "";
    if (s === "Submitted") {
        const p = doc?.payment_status ?? "—";
        if (p === "Paid") return { status: t("Paid"), variant: "success" as const };
        const v = p === "Unpaid" ? "destructive" : p === "Partially Paid" ? "warning" : "default";
        return { status: t(p), variant: v };
    }
    const v = s === "Cancelled" ? "destructive" : s === "Draft" ? "draft" : "default";
    return { status: t(s) || s, variant: v };
}

export default function EmployeeAdvanceScripts() {
    useZui(async (zui) => {
        zui.list.on("Employee Advance", {
            on_format(ctx) { ctx.set_badge_config?.("doc_status", { getValue: (doc, t) => docStatusBadge(doc, t ?? zui.t) }); },
        });
        zui.form.on("Employee Advance" as any, {
            on_render(frm: any) {
                frm.set_badge_config?.("doc_status", { getValue: (doc: any, t: any) => docStatusBadge(doc, t ?? zui.t) });
            },
        } as any);
        zui.form.set_secondary_button("Employee Advance", "Create Payment Entry", async (frm) => {
            const docId = frm.get_value("id") ?? frm?.doc?.id;
            const totalAmount = num(frm.get_value("amount"));
            const prefill: Record<string, any> = {
                payment_type: "Pay",
                posting_date: frm.get_value("posting_date") || zodula.date.today(),
                party_type: "Employee",
                party: frm.get_value("employee"),
                paid_amount: totalAmount,
                to_paid_amount: totalAmount,
                "references.0.reference_type": "Employee Advance",
                "references.0.reference_id": docId,
                "references.0.allocate_amount": totalAmount,
            };
            zui.router?.push("/desk/doctypes/Payment Entry/form", { state: { prefill } });
        }, { icon: "DollarSign", condition: (ctx) => ctx?.doc?.doc_status === "Submitted" });
    }, []);
    return <></>;
}
