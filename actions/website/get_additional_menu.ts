import { z } from "bxo";

export default $action(async (ctx) => {
  const erp = await $zodula.doctype("ERP Setting").get("ERP Setting").bypass(true).fields(["additional_menu_delivery_note_tracking"]);
  const tracking = Number((erp as any)?.additional_menu_delivery_note_tracking ?? 0) === 1;

  return ctx.json({ additional_menu_delivery_note_tracking: tracking });
}, {
  method: "GET",
  response: {
    200: z.object({
      additional_menu_delivery_note_tracking: z.boolean(),
    }),
  },
});
