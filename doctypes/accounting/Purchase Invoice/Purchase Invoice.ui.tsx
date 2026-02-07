import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";
import type { FormContext } from "@/zodula/ui/zui";
import { zodula } from "@/zodula/client";

type InvoiceDoctype = "zerp__Sales Invoice" | "zerp__Purchase Invoice";

// ============================================================================
// Helper Functions
// ============================================================================

const calculateTotal = <DN extends InvoiceDoctype>(
    frm: FormType<DN>,
    itemsField: string
) => {
    const items = frm.get_value(itemsField as any) || [];
    if (Array.isArray(items)) {
        const totalAmount = items.reduce((total: number, item: any) => {
            const quantity = parseFloat(String(item.quantity || 0)) || 0;
            const unitPrice = parseFloat(String(item.unit_price || 0)) || 0;
            return total + (quantity * unitPrice);
        }, 0);
        frm.set_value("total_amount" as any, totalAmount);
    }
};

const setDefaultValues = <DN extends InvoiceDoctype>(frm: FormType<DN>) => {
    if (!frm.get_value("posting_date" as any)) {
        const today = zodula.utils.format(new Date(), "date");
        frm.set_value("posting_date" as any, today);
    }
    if (!frm.get_value("due_date" as any)) {
        const today = new Date();
        today.setDate(today.getDate() + 30);
        const dueDate = zodula.utils.format(today, "date");
        frm.set_value("due_date" as any, dueDate);
    }
    if (!frm.get_value("payment_status" as any)) {
        frm.set_value("payment_status" as any, "Unpaid");
    }
};

const getPaymentStatusBadge = (doc: any) => {
    switch (doc.doc_status) {
        case 0:
            return { status: "Draft", variant: "draft" };
        case 1:
            switch (doc.payment_status) {
                case "Paid":
                    return { status: "Paid", variant: "success" };
                case "Partially Paid":
                    return { status: "Partially Paid", variant: "warning" };
                default:
                    return { status: "Unpaid", variant: "pending" };
            }
        case 2:
            return { status: "Cancelled", variant: "cancelled" };
        default:
            return null;
    }
    return null;
};

const createPaymentHandler = async (
    context: FormContext,
    config: {
        referenceType: "zerp__Sales Invoice" | "zerp__Purchase Invoice";
        paymentType: "Receive" | "Pay";
        partyType: "zerp__Customer" | "zerp__Supplier";
    }
) => {
    const doc = context.doc;
    if (!doc.id) return;
    
    const org = context.org || "SYS";
    const totalAmount = parseFloat(String((doc as any).total_amount || 0)) || 0;
    const party = (doc as any)[config.partyType === "zerp__Customer" ? "customer" : "supplier"];

    // Try to find party account
    let partyAccount = null;
    if (party) {
        try {
            const accounts = await zodula.doc.select_docs("zerp__Account", {
                filters: [
                    ["party_type", "=", config.partyType],
                    ["party", "=", party]
                ],
                limit: 1,
                sort: "account_code",
                order: "asc"
            });
            if (accounts.docs && accounts.docs.length > 0 && accounts.docs[0]) {
                partyAccount = accounts.docs[0].id;
            }
        } catch (error) {
            console.error("Error finding party account:", error);
        }
    }

    // Prefill payment entry - child doctype scripts will calculate remaining_amount and allocated_amount
    const prefill: any = {
        posting_date: zodula.utils.format(new Date(), "date"),
        payment_type: config.paymentType,
        party_type: config.partyType,
        party: party,
        payment_method: "Bank", // Default to Bank, user can change
        party_account: partyAccount, // Set if found, otherwise user will need to select
        references: [{
            reference_type: config.referenceType,
            reference_id: doc.id
            // remaining_amount and allocated_amount will be calculated by child doctype scripts
        }]
    };

    context.navigate(`/desk/${org}/doctypes/zerp__Payment Entry/form`, {
        state: { prefill }
    });
};

// ============================================================================
// Component
// ============================================================================

export default function PurchaseInvoiceScripts() {
    useEffect(() => {
        const doctype = "zerp__Purchase Invoice" as const;
        const itemsField = "purchase_invoice_items" as const;

        // Form handlers
        zui.form.on(doctype, {
            [itemsField]: (frm: FormType<typeof doctype>) => calculateTotal(frm, itemsField),
            total_amount: (frm: FormType<typeof doctype>) => calculateTotal(frm, itemsField),
            refresh: (frm: FormType<typeof doctype>) => {
                if (frm.is_new()) {
                    setDefaultValues(frm);
                }
            }
        });

        // List badge
        zui.list.on(doctype, {
            on_format: (context) => {
                context.addBadge("doc_status", {
                    variant: "muted",
                    size: "sm",
                    getValue: getPaymentStatusBadge
                });
            }
        });

        // Form badge and actions
        zui.form.on(doctype, {
            on_render: (context: FormContext) => {
                context.addBadge("doc_status", {
                    variant: "muted",
                    size: "sm",
                    getValue: getPaymentStatusBadge
                });

                if (context.doc.doc_status === 1 && context.doc.id) {
                    context.addSecondaryButton("Actions", () => {}, {
                        variant: "outline",
                        items: [{
                            label: "Create Payment",
                            onClick: () => createPaymentHandler(context, {
                                referenceType: "zerp__Purchase Invoice",
                                paymentType: "Pay",
                                partyType: "zerp__Supplier"
                            }),
                            disabled: (context.doc as any).payment_status === "Paid"
                        }]
                    });
                }
            }
        });
    }, []);

    return null;
}

