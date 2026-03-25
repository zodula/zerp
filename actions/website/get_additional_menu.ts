import { z } from "bxo";
import { normalizeOrgAdditionalMenu } from "../../../zodula/actions/org/additionalMenuPublic";

export default $action(async (ctx) => {
  const doc = await $zodula.doctype("Organization").get("Organization").bypass(true);
  const items = normalizeOrgAdditionalMenu((doc as any)?.additional_menu);

  return ctx.json({ items });
}, {
  method: "GET",
  response: {
    200: z.object({
      items: z.array(z.object({ label: z.string(), url: z.string() })),
    }),
  },
});
