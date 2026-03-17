import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

export default function AccountScripts() {
    useZui((zui) => {
        console.log("AccountScripts", zui.org);
        zui.list.set_secondary_button(
            "Account",
            "Setup Standard Accounts",
            async (list) => {
                const ok = await zui.confirm({
                    title: "Setup Standard Accounts",
                    message:
                        "This will create default chart of accounts for the current organization. Existing accounts will not be duplicated. Continue?",
                });
                if (!ok) return;
                const org = zui.org;
                if (!org) {
                    zui.toast.error("No organization in context.");
                    return;
                }
                try {
                    const res = await zodula.action("zerp.accounting.create_standard_accounts", {
                        data: { organization: org },
                    }) as { created?: number; message?: string; error?: string };
                    if (res?.error) {
                        zui.toast.error(res.error);
                        return;
                    }
                    zui.toast.success(res?.message ?? `${res?.created ?? 0} account(s) created.`);
                    await list.reload?.();
                } catch (e: any) {
                    zui.toast.error(e?.message ?? "Failed to create standard accounts.");
                }
            },
            { icon: "Settings" }
        );
    }, []);

    return null;
}
