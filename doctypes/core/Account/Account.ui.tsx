import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

export default function AccountScripts() {
    useZui((zui) => {
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
                try {
                    const res = await zodula.action("zerp.setup.wizard" as any, {
                        data: {
                            generate_standard_accounts: true,
                            create_standard_price_projects: false,
                            mark_setup: false,
                        },
                    }) as { accounts_created?: number; error?: string; message?: string };
                    if (res?.error) {
                        zui.toast.error(res.error);
                        return;
                    }
                    zui.toast.success(res?.message ?? `${res?.accounts_created ?? 0} account(s) created.`);
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
