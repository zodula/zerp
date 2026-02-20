import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";
import type { FormContext } from "@/zodula/ui/zui";
import { zodula } from "@/zodula/client";
import { ListPlus, FileText } from "lucide-react";

const doctype = "zerp__Delivery Manifest" as const;

function calculateTotalExpenseAmount(frm: FormType<typeof doctype>) {
  const items = (frm.get_value?.("delivery_manifest_expense_items" as any) ?? []) as any[];
  let total = 0;
  for (const row of items) {
    const qty = parseFloat(String(row.quantity ?? 0)) || 0;
    const rate = parseFloat(String(row.rate ?? 0)) || 0;
    const amount = parseFloat(String(row.amount ?? 0)) || qty * rate;
    total += amount;
  }
  frm.set_value?.("total_expense_amount" as any, total);
}

const createPurchaseInvoiceHandler = async (context: FormContext<typeof doctype>) => {
  try {
    const doc = context.doc as any;
    const getValue = context.getValue as (field: string) => any;
    if (!doc?.id) return;

    // Use current form data (getValue) so we have latest expense items and transporter
    const transporter = getValue?.("transporter") ?? doc.transporter;
    const postingDate = getValue?.("posting_date") ?? doc.posting_date;
    const dueDate = getValue?.("due_date") ?? doc.due_date;
    const expenses = (getValue?.("delivery_manifest_expense_items") ?? doc.delivery_manifest_expense_items ?? []) as any[];

    let defaultProduct: string | null = null;
    let defaultUom: string | null = null;
    const needsDefault = expenses.some((e: any) => !e.product || !e.uom);
    if (needsDefault && zodula?.doc?.select_docs) {
      try {
        const [productRes, uomRes] = await Promise.all([
          zodula.doc.select_docs("zerp__Product" as Zodula.DoctypeName, { limit: 1, sort: "product_name", order: "asc" }),
          zodula.doc.select_docs("zerp__UOM" as Zodula.DoctypeName, { limit: 1, sort: "name", order: "asc" }),
        ]);
        defaultProduct = productRes?.docs?.[0]?.id ?? null;
        defaultUom = uomRes?.docs?.[0]?.id ?? null;
      } catch (_) {}
    }

    const purchaseInvoiceItems = expenses
      .map((row: any) => {
        const quantity = parseFloat(String(row.quantity ?? 0)) || 0;
        const rate = parseFloat(String(row.rate ?? 0)) || 0;
        const amount = parseFloat(String(row.amount ?? 0)) || quantity * rate;
        const product = row.product || defaultProduct;
        const uom = row.uom || defaultUom;
        const expenseTypeLabel = row.expense_type ? (typeof row.expense_type === "object" ? row.expense_type.expense_type_name : row.expense_type) : "";
        const desc = [expenseTypeLabel, row.description].filter(Boolean).join(" - ") || undefined;
        return { product, uom, quantity, unit_price: rate, total_price: amount, item_description: desc };
      })
      .filter((r: any) => r.product && r.uom);

    const org = context.org || "System Panel";
    const prefill: any = {
      delivery_manifest: doc.id,
      supplier: transporter ?? undefined,
      posting_date: postingDate || zodula.utils.format(new Date(), "date"),
      due_date: dueDate || zodula.utils.format(new Date(), "date"),
      purchase_invoice_items: purchaseInvoiceItems,
    };

    context.navigate(`/desk/${org}/doctypes/zerp__Purchase Invoice/form`, {
      state: { prefill },
    });
  } catch (err) {
    console.error("Create Purchase Invoice:", err);
    (context as any).showToast?.(zui.t("Could not open Purchase Invoice"), "error");
  }
};

export default function DeliveryOrderTransferUIScript() {
  useEffect(() => {
    zui.form.on(doctype, {
      delivery_manifest_expense_items: (frm: FormType<typeof doctype>) => calculateTotalExpenseAmount(frm),
      "delivery_manifest_expense_items.quantity": (frm: FormType<typeof doctype>) => calculateTotalExpenseAmount(frm),
      "delivery_manifest_expense_items.rate": (frm: FormType<typeof doctype>) => calculateTotalExpenseAmount(frm),
      "delivery_manifest_expense_items.amount": (frm: FormType<typeof doctype>) => calculateTotalExpenseAmount(frm),
      refresh: (frm: FormType<typeof doctype>) => calculateTotalExpenseAmount(frm),
      on_render: (context: FormContext<typeof doctype>) => {
        if (context.doc.doc_status === 1 && context.doc.id) {
          context.addSecondaryButton(zui.t("Action"), () => {}, {
            variant: "outline",
            items: [{
              label: zui.t("Create Purchase Invoice"),
              icon: FileText,
              onClick: () => {
                // Run after dropdown closes so navigation is not blocked
                setTimeout(() => void createPurchaseInvoiceHandler(context), 0);
              },
            }],
          });
        }
        context.addSecondaryButton(
          zui.t("Add Delivery Orders"),
          async () => {
            const open_multi_select_dialog = (context as any).open_multi_select_dialog;
            const getValue = context.getValue;
            const setValue = context.setValue;
            if (!open_multi_select_dialog || !getValue || !setValue) return;

            const sourceWarehouse = getValue("source_warehouse" as any);
            const defaultFilters: any[] = [["doc_status", "=", 1]]; // Draft only by default
            if (sourceWarehouse) {
              defaultFilters.push(["source_warehouse", "=", sourceWarehouse]);
            }

            const selected = await open_multi_select_dialog("zerp__Delivery Order" as Zodula.DoctypeName, {
              title: zui.t("Select Delivery Orders"),
              defaultFilters,
              limit: 500,
              list_view_fields: [
                "customer_name",
                "posting_date",
                "due_date",
                "source_warehouse",
                "physical_bill_no",
                "net_total",
              ],
            });

            if (selected && selected.length > 0) {
              const items = (getValue("delivery_manifest_items" as any) ?? []) as any[];
              const existingIds = new Set((items || []).map((r: any) => r.delivery_order).filter(Boolean));
              const toAdd = selected.filter((id: string) => !existingIds.has(id));
              const newRows = toAdd.map((id: string) => ({ delivery_order: id }));
              await (setValue as (k: string, v: any) => Promise<void>)("delivery_manifest_items", [...(items || []), ...newRows]);
              (context as any).showToast?.(`${zui.t("Added")} ${toAdd.length} ${zui.t("delivery order(s)")}`, "success");
            }
          },
          { variant: "outline", icon: ListPlus }
        );
      },
    });
  }, []);

  return null;
}
