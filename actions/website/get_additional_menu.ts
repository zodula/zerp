import { z } from "bxo";

export default $action(async (ctx) => {
  const org = (ctx.query as { org?: string }).org;
  if (!org) {
    return ctx.json({ additional_menu_delivery_note_tracking: false });
  }

  const orgDoc = await $zodula.doctype("Organization").get(org as any).bypass(true).fields(["id"]);
  if (!orgDoc?.id) {
    return ctx.json({ additional_menu_delivery_note_tracking: false });
  }

  const erp = await $zodula.doctype("ERP Setting").get(`ERP Setting - ${orgDoc.id}` as any).bypass(true).fields(["additional_menu_delivery_note_tracking"]);
  const tracking = erp?.additional_menu_delivery_note_tracking === 1 || erp?.additional_menu_delivery_note_tracking === "1";

  return ctx.json({ additional_menu_delivery_note_tracking: tracking });
}, {
  method: "GET",
  query: z.object({
    org: z.string().min(1),
  }),
  response: {
    200: z.object({
      additional_menu_delivery_note_tracking: z.boolean(),
    }),
  },
});
