import { useEffect } from "react";
import { zui } from "@/zodula/ui";

export default function PaymentEntryScripts() {
    useEffect(() => {
        zui.form.on("zerp__Payment Entry", {
            payment_type: function(frm) {
                const paymentType = frm.get_value("payment_type");
                if (paymentType === "Receive") {
                    // Show customer, hide supplier
                    frm.set_df_property("customer", "hidden", 0);
                    frm.set_df_property("supplier", "hidden", 1);
                    frm.set_df_property("customer", "reqd", 1);
                    frm.set_df_property("supplier", "reqd", 0);
                    // Clear supplier if set
                    if (frm.get_value("supplier")) {
                        frm.set_value("supplier", "");
                    }
                } else if (paymentType === "Pay") {
                    // Show supplier, hide customer
                    frm.set_df_property("supplier", "hidden", 0);
                    frm.set_df_property("customer", "hidden", 1);
                    frm.set_df_property("supplier", "reqd", 1);
                    frm.set_df_property("customer", "reqd", 0);
                    // Clear customer if set
                    if (frm.get_value("customer")) {
                        frm.set_value("customer", "");
                    }
                }
            },
            refresh: function(frm) {
                // Set initial visibility based on payment_type
                const paymentType = frm.get_value("payment_type");
                if (paymentType === "Receive") {
                    frm.set_df_property("customer", "hidden", 0);
                    frm.set_df_property("supplier", "hidden", 1);
                    frm.set_df_property("customer", "reqd", 1);
                    frm.set_df_property("supplier", "reqd", 0);
                } else if (paymentType === "Pay") {
                    frm.set_df_property("supplier", "hidden", 0);
                    frm.set_df_property("customer", "hidden", 1);
                    frm.set_df_property("supplier", "reqd", 1);
                    frm.set_df_property("customer", "reqd", 0);
                }
            }
        });
    }, []);

    return null; // This is a script component, not a visual component
}

