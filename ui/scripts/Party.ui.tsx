import { useUIScriptRegistry } from "@/zodula/ui/hooks/use-ui-script";
import { useEffect } from "react";

export default function PartyScripts() {
    const { registerScript } = useUIScriptRegistry();

    useEffect(() => {
        // Party Defaults
        registerScript("zerp__Party", {
            id: "party_defaults",
            doctype: "zerp__Party",
            name: "Party Defaults",
            description: "Set default values for parties",
            events: [
                {
                    type: "form_load",
                    action: async (context) => {
                        if (context.isCreate) {
                            if (!context.getValue?.("is_customer")) {
                                context.setValue?.("is_customer", 1);
                            }
                        }
                    }
                }
            ]
        });
    }, [])

    return null; // This is a script component, not a visual component
}
