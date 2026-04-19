import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

export default function AccountScripts() {
    useZui((zui) => {
        zui.list.set_secondary_button(
            "Account",
            "Apply Default Account Settings",
            async (list) => {
                const ok = await zui.confirm({
                    title: "Apply Default Account Settings",
                    message:
                        "This will apply default ERP and Payroll account settings using existing standard account fixtures. Continue?",
                });
                if (!ok) return;
                try {
                    const res = await zodula.action("zerp.setup.wizard" as any, {
                        data: {
                            create_standard_price_projects: false,
                            mark_setup: false,
                        },
                    }) as {
                        erp_setting_defaults_set?: number;
                        payroll_setting_defaults_set?: number;
                        error?: string;
                        message?: string;
                    };
                    if (res?.error) {
                        zui.toast.error(res.error);
                        return;
                    }
                    zui.toast.success(
                        res?.message ??
                            `Defaults updated - ERP: ${res?.erp_setting_defaults_set ?? 0}, Payroll: ${res?.payroll_setting_defaults_set ?? 0}`
                    );
                    await list.reload?.();
                } catch (e: any) {
                    zui.toast.error(e?.message ?? "Failed to apply account defaults.");
                }
            },
            { icon: "Settings" }
        );
    }, []);

    return null;
}
