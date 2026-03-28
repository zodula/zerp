import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

function applyCustomerLinkFilters(frm: any) {
    const customer = frm.get_value("customer");
    const f = customer ? JSON.stringify([["link_type", "=", "Customer"], ["link_id", "=", customer]]) : JSON.stringify([["link_type", "=", "Customer"]]);
    frm.set_df_property?.("billing_address", "filters", f);
    frm.set_df_property?.("shipping_address", "filters", f);
    frm.set_df_property?.("billing_contact", "filters", f);
    frm.set_df_property?.("shipping_contact", "filters", f);
}

export default function SalesReceiptScripts() {
    useZui((zui) => {
        zui.form.on("Sales Receipt" as any, {
            on_render(frm: any) {
                applyCustomerLinkFilters(frm);
            },
            from_sales_invoice: (frm: any) => {
                applyCustomerLinkFilters(frm);
            },
            customer: (frm: any) => {
                applyCustomerLinkFilters(frm);
            },
        } as any);
    }, []);

    return null;
}
