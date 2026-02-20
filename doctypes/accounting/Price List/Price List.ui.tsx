import { useEffect } from "react";
import { zui } from "@/zodula/ui";
import { zodula } from "@/zodula/client";

export default function PriceListScripts() {
    useEffect(() => {
        zui.form.on("Price List", {
            party_type: function(frm) {
                const partyType = frm.get_value("party_type");
                if (partyType === "Customer") {
                    // Show customer, hide supplier
                    frm.set_df_property("customer", "hidden", 0);
                    frm.set_df_property("supplier", "hidden", 1);
                    frm.set_df_property("customer", "reqd", 1);
                    frm.set_df_property("supplier", "reqd", 0);
                    // Clear supplier if set
                    if (frm.get_value("supplier")) {
                        frm.set_value("supplier", "");
                    }
                } else if (partyType === "Supplier") {
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
                // Set initial visibility based on party_type
                const partyType = frm.get_value("party_type");
                if (partyType === "Customer") {
                    frm.set_df_property("customer", "hidden", 0);
                    frm.set_df_property("supplier", "hidden", 1);
                    frm.set_df_property("customer", "reqd", 1);
                    frm.set_df_property("supplier", "reqd", 0);
                } else if (partyType === "Supplier") {
                    frm.set_df_property("supplier", "hidden", 0);
                    frm.set_df_property("customer", "hidden", 1);
                    frm.set_df_property("supplier", "reqd", 1);
                    frm.set_df_property("customer", "reqd", 0);
                }
            }
        });
    }, []);

    return null;
}

