import { z } from "bxo";

export default $action(
  async (ctx) => {
    return ctx.json({
      default_price_lists: {
        selling: "Standard Selling",
        buying: "Standard Buying",
      },
    });
  },
  {
    method: "GET",
    response: {
      200: z
        .object({
          default_price_lists: z.object({
            selling: z.string(),
            buying: z.string(),
          }),
        })
        .passthrough(),
    },
  }
);
