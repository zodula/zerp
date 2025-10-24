import { useEffect } from "react";
import { useUIScriptRegistry } from "@/zodula/ui/hooks/use-ui-script";

export default function AccountScripts() {
    const { registerScript } = useUIScriptRegistry();

    useEffect(() => {
        // Account Defaults
        registerScript("zerp__Account", {
            id: "account_defaults",
            doctype: "zerp__Account",
            name: "Account Defaults",
            description: "Set default values for accounts",
            events: [
                {
                    type: "form_load",
                    action: async (context) => {
                        if (context.isCreate) {
                            if (!context.getValue?.("is_group")) {
                                context.setValue?.("is_group", 0);
                            }
                        }
                    }
                }
            ]
        });
    }, [])

    return null; // This is a script component, not a visual component
}
