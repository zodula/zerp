import { useEffect } from "react";
import { useUIScriptRegistry } from "@/zodula/ui/hooks/use-ui-script";

export default function CurrencyScripts() {
    const { registerScript } = useUIScriptRegistry();

    // Currency Defaults
    useEffect(() => {
        registerScript("zerp__Currency", {
            id: "currency_defaults",
            doctype: "zerp__Currency",
            name: "Currency Defaults",
            description: "Set default values for currencies",
            events: [
                {
                    type: "form_load",
                    action: async (context) => {
                        if (context.isCreate) {
                            if (!context.getValue?.("symbol")) {
                                context.setValue?.("symbol", "$");
                            }
                            if (!context.getValue?.("fraction_units")) {
                                context.setValue?.("fraction_units", 2);
                            }
                        }
                    }
                }
            ]
        });
    }, [])

    return null; // This is a script component, not a visual component
}
