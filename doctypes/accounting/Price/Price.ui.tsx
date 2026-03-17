import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

async function syncPartyFieldsFromProject(frm: any) {
    const projectId = frm.get_value("price_project");
    let isSelling = 0;
    let isBuying = 0;

    if (projectId) {
        const project = await zodula.doc.get_doc("Price Project" as any, projectId as any);
        isSelling = project?.is_selling ?? 0;
        isBuying = project?.is_buying ?? 0;
        await frm.set_value("is_selling", isSelling);
        await frm.set_value("is_buying", isBuying);
    }

    if (isSelling && !isBuying) {
        await frm.set_df_property("customer", "hidden", 0);
        await frm.set_df_property("customer_name", "hidden", 0);
        await frm.set_df_property("supplier", "hidden", 1);
        await frm.set_df_property("supplier_name", "hidden", 1);
    } else if (isBuying && !isSelling) {
        await frm.set_df_property("customer", "hidden", 1);
        await frm.set_df_property("customer_name", "hidden", 1);
        await frm.set_df_property("supplier", "hidden", 0);
        await frm.set_df_property("supplier_name", "hidden", 0);
    } else {
        await frm.set_df_property("customer", "hidden", 0);
        await frm.set_df_property("customer_name", "hidden", 0);
        await frm.set_df_property("supplier", "hidden", 0);
        await frm.set_df_property("supplier_name", "hidden", 0);
    }
}

export default function PriceListScripts() {
    useZui((zui) => {
        zui.form.on("Price", {
            async on_render(frm) {
                await syncPartyFieldsFromProject(frm);
            },
            async price_project(frm) {
                await syncPartyFieldsFromProject(frm);
            },
        });
    }, []);
    return <></>;
}
