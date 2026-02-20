import { useEffect } from "react";
import { zui } from "@/zodula/ui";

const doctype = "Delivery Manifest Expense Item" as const;

function updateAmount(frm: any) {
  const quantity = parseFloat(String(frm.get_value?.("quantity") ?? 0)) || 0;
  const rate = parseFloat(String(frm.get_value?.("rate") ?? 0)) || 0;
  frm.set_value?.("amount", quantity * rate);
}

export default function DeliveryOrderTransferExpenseItemUIScript() {
  useEffect(() => {
    zui.form.on(doctype, {
      quantity: (frm: any) => updateAmount(frm),
      rate: (frm: any) => updateAmount(frm),
    });
  }, []);

  return null;
}
