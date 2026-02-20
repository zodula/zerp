import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";
import type { FormContext } from "@/zodula/ui/zui";
import { zodula } from "@/zodula/client";
import { CreditCard } from "lucide-react";

type InvoiceDoctype = "Sales Invoice" | "Purchase Invoice";

// ============================================================================
// Helper Functions
// ============================================================================

const calculateNetTotal = <DN extends InvoiceDoctype>(
    frm: FormType<DN>,
    itemsField: string
) => {
    const items = frm.get_value(itemsField as any) || [];
    if (Array.isArray(items)) {
        const netTotal = items.reduce((total: number, item: any) => {
            const quantity = parseFloat(String(item.quantity || 0)) || 0;
            const unitPrice = parseFloat(String(item.unit_price || 0)) || 0;
            return total + (quantity * unitPrice);
        }, 0);
        frm.set_value("net_total" as any, netTotal);
        // Trigger tax calculation
        calculateTaxes(frm);
    }
};

const calculateTaxes = <DN extends InvoiceDoctype>(frm: FormType<DN>) => {
    const netTotal = parseFloat(String(frm.get_value("net_total" as any) || 0)) || 0;
    // Get fresh tax rows data
    const taxRows = frm.get_value("tax_and_charges" as any) || [];
    
    if (!Array.isArray(taxRows) || taxRows.length === 0) {
        frm.set_value("total_taxes_and_charges" as any, 0);
        frm.set_value("total_amount" as any, netTotal);
        return;
    }
    
    // Create a map of original array index to row for updating
    const rowsWithOriginalIndex = taxRows.map((row: any, originalIndex: number) => ({
        ...row,
        _originalIndex: originalIndex
    }));
    
    // Sort by idx to ensure proper order for calculation
    const sortedTaxRows = [...rowsWithOriginalIndex].sort((a: any, b: any) => {
        const idxA = parseFloat(String(a.idx || 0)) || 0;
        const idxB = parseFloat(String(b.idx || 0)) || 0;
        return idxA - idxB;
    });
    
    let runningTotal = netTotal;
    let totalTaxesAndCharges = 0;
    // Create a completely new array with new object references
    const updatedRows = taxRows.map((row: any) => ({ ...row }));
    
    // Store calculated amounts by original index
    const calculatedAmounts: Record<number, { tax_amount: number }> = {};
    
    for (let i = 0; i < sortedTaxRows.length; i++) {
        const taxRow = sortedTaxRows[i];
        const chargeType = taxRow.charge_type || "Actual";
        const rate = parseFloat(String(taxRow.rate || 0)) || 0;
        let taxAmount = 0;
        
        if (chargeType === "Actual") {
            taxAmount = parseFloat(String(taxRow.tax_amount || 0)) || 0;
        } else if (chargeType === "On Net Total") {
            taxAmount = (netTotal * rate) / 100;
        } else if (chargeType === "On Previous Row Amount") {
            if (i > 0) {
                const prevRow = sortedTaxRows[i - 1];
                const prevOriginalIndex = prevRow._originalIndex;
                const prevTaxAmount = calculatedAmounts[prevOriginalIndex]?.tax_amount || parseFloat(String(prevRow.tax_amount || 0)) || 0;
                taxAmount = (prevTaxAmount * rate) / 100;
            }
        } else if (chargeType === "On Previous Row Total") {
            if (i > 0) {
                const prevRow = sortedTaxRows[i - 1];
                const prevOriginalIndex = prevRow._originalIndex;
                // Use tax_amount instead of total for "On Previous Row Total"
                const prevTaxAmount = calculatedAmounts[prevOriginalIndex]?.tax_amount || parseFloat(String(prevRow.tax_amount || 0)) || 0;
                taxAmount = (prevTaxAmount * rate) / 100;
            }
        }
        
        // Store calculated amounts
        const originalIndex = taxRow._originalIndex;
        if (originalIndex !== undefined && originalIndex >= 0) {
            calculatedAmounts[originalIndex] = {
                tax_amount: taxAmount
            };
        }
        
        // For excluded taxes, add to running total; for included, it's already in the base
        if (taxRow.tax_type === "Excluded") {
            runningTotal += taxAmount;
            totalTaxesAndCharges += taxAmount;
        } else {
            // For included taxes, they're already in the base amount
            totalTaxesAndCharges += taxAmount;
        }
    }
    
    // Update all rows with calculated amounts - create completely new objects
    for (let i = 0; i < updatedRows.length; i++) {
        const calculated = calculatedAmounts[i];
        if (calculated) {
            updatedRows[i] = {
                ...updatedRows[i],
                tax_amount: calculated.tax_amount
            };
        }
    }
    
    // Update the entire table at once with a new array reference to force re-render
    // Use setTimeout to ensure React processes the update in the next tick
    setTimeout(() => {
        frm.set_value("tax_and_charges" as any, updatedRows.map(row => ({ ...row })));
        
        // Update totals
        frm.set_value("total_taxes_and_charges" as any, totalTaxesAndCharges);
        frm.set_value("total_amount" as any, runningTotal);
    }, 0);
};

const applyTaxTemplate = async <DN extends InvoiceDoctype>(
    frm: FormType<DN>,
    taxTemplateId: string | null,
    taxAndChargesField: string
) => {
    if (!taxTemplateId) {
        // Clear tax and charges if template is removed
        frm.set_value(taxAndChargesField as any, []);
        calculateTaxes(frm);
        return;
    }

    try {
        // Fetch tax template
        const template = await zodula.doc.get_doc("Tax Template", taxTemplateId);
        if (!template || !template.tax_template_items) {
            return;
        }

        // Fetch tax template items
        const templateItems = await zodula.doc.select_docs("Tax Template Item", {
            filters: [["tax_template", "=", taxTemplateId]],
            sort: "idx",
            order: "asc",
            limit: 1000
        });

        // Map template items to tax and charges
        const taxAndCharges = templateItems.docs.map((item: any, index: number) => ({
            charge_type: item.charge_type || "Actual",
            account_head: item.account_head,
            description: item.description || "",
            tax_type: item.tax_type || "Excluded",
            rate: item.rate || 0,
            row_id: item.row_id || "",
            included_in_print_rate: item.included_in_print_rate || false,
            idx: item.idx !== undefined ? item.idx : index
        }));

        frm.set_value(taxAndChargesField as any, taxAndCharges);
        // Calculate taxes after applying template
        calculateTaxes(frm);
    } catch (error) {
        console.error("Error applying tax template:", error);
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
        referenceType: "Sales Invoice" | "Purchase Invoice";
        paymentType: "Receive" | "Pay";
        partyType: "Customer" | "Supplier";
    }
) => {
    const doc = context.doc;
    if (!doc.id) return;
    
    const org = context.org || "System Panel";
    const totalAmount = parseFloat(String((doc as any).total_amount || 0)) || 0;
    const party = (doc as any)[config.partyType === "Customer" ? "customer" : "supplier"];

    // Try to find party account
    let partyAccount = null;
    if (party) {
        try {
            const accounts = await zodula.doc.select_docs("Account", {
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

    // Fetch tax and charges from invoice
    let taxAndCharges: any[] = [];
    try {
        const invoiceTaxRows = (doc as any).tax_and_charges;
        if (Array.isArray(invoiceTaxRows) && invoiceTaxRows.length > 0) {
            // Copy tax rows, removing invoice-specific fields
            taxAndCharges = invoiceTaxRows.map((taxRow: any) => ({
                charge_type: taxRow.charge_type || "Actual",
                account_head: taxRow.account_head,
                description: taxRow.description || "",
                tax_type: taxRow.tax_type || "Excluded",
                rate: taxRow.rate || 0,
                tax_amount: taxRow.tax_amount || 0,
                row_id: taxRow.row_id || "",
                included_in_print_rate: taxRow.included_in_print_rate || false,
                idx: taxRow.idx !== undefined ? taxRow.idx : 0
            }));
        }
    } catch (error) {
        console.error("Error fetching tax and charges from invoice:", error);
    }

    // Prefill payment entry - reference_type on parent; child rows only have reference_id
    const prefill: any = {
        posting_date: zodula.utils.format(new Date(), "date"),
        payment_type: config.paymentType,
        party_type: config.partyType,
        party: party,
        reference_type: config.referenceType,
        payment_method: "Bank",
        party_account: partyAccount,
        base_amount: parseFloat(String((doc as any).net_total || 0)) || 0,
        references: [{
            reference_id: doc.id
        }],
        tax_and_charges: taxAndCharges
    };

    context.navigate(`/desk/${org}/doctypes/Payment Entry/form`, {
        state: { prefill }
    });
};

// ============================================================================
// Component
// ============================================================================

export default function PurchaseInvoiceScripts() {
    useEffect(() => {
        const doctype = "Purchase Invoice" as const;
        const itemsField = "purchase_invoice_items" as const;

        // Update address filters based on supplier
        const updateAddressFilters = (frm: FormType<typeof doctype>) => {
            const supplier = frm.get_value("supplier" as any);
            if (supplier) {
                const billingFilters = JSON.stringify([
                    ["links.link_doctype", "=", "Supplier"],
                    ["links.link_id", "=", supplier],
                    ["address_type", "=", "Billing"]
                ]);
                const shippingFilters = JSON.stringify([
                    ["links.link_doctype", "=", "Supplier"],
                    ["links.link_id", "=", supplier],
                    ["address_type", "=", "Shipping"]
                ]);
                frm.set_df_property("billing_address", "filters", billingFilters);
                frm.set_df_property("shipping_address", "filters", shippingFilters);
            } else {
                // Clear filters if supplier is not set
                frm.set_df_property("billing_address", "filters", JSON.stringify([]));
                frm.set_df_property("shipping_address", "filters", JSON.stringify([]));
            }
        };

        // Update contact filters for billing and shipping contacts
        const updateContactFilters = (frm: FormType<typeof doctype>) => {
            const supplier = frm.get_value("supplier" as any);
            
            if (supplier) {
                // Show all contacts linked to the supplier for all contact fields
                const filters = JSON.stringify([
                    ["links.link_doctype", "=", "Supplier"],
                    ["links.link_id", "=", supplier]
                ]);
                frm.set_df_property("billing_contact", "filters", filters);
                frm.set_df_property("shipping_contact", "filters", filters);
            } else {
                // Clear filters if supplier is not set
                frm.set_df_property("billing_contact", "filters", JSON.stringify([]));
                frm.set_df_property("shipping_contact", "filters", JSON.stringify([]));
            }
        };

        // Set price_list filters per row (parent price_project, supplier, row product, until_date)
        const updatePriceListFiltersForItems = (frm: FormType<typeof doctype>) => {
            const items = (frm.get_value(itemsField as any) || []) as any[];
            const priceProject = frm.get_value("price_project" as any);
            const supplier = frm.get_value("supplier" as any);
            const postingDate = frm.get_value("posting_date" as any);
            items.forEach((row: any, idx: number) => {
                const product = row?.product;
                if (!priceProject || !supplier || !product) {
                    frm.set_df_child_table_property(itemsField, idx, "price_list", "filters", []);
                    return;
                }
                const filters: [string, string, any][] = [
                    ["price_project", "=", priceProject],
                    ["party_type", "=", "Supplier"],
                    ["supplier", "=", supplier],
                    ["product", "=", product],
                ];
                if (postingDate) {
                    filters.push(["until_date", ">=", postingDate]);
                }
                frm.set_df_child_table_property(itemsField, idx, "price_list", "filters", filters);
            });
        };

        // Update due date based on supplier credit_days
        const updateDueDate = async (frm: FormType<typeof doctype>) => {
            const supplier = frm.get_value("supplier" as any);
            const postingDate = frm.get_value("posting_date" as any);
            
            if (supplier && postingDate) {
                try {
                    const supplierDoc = await zodula.doc.get_doc("Supplier", supplier);
                    if (supplierDoc && supplierDoc.credit_days) {
                        const creditDays = parseFloat(String(supplierDoc.credit_days || 0)) || 0;
                        if (creditDays > 0) {
                            const postingDateObj = new Date(postingDate);
                            const dueDateObj = new Date(postingDateObj);
                            dueDateObj.setDate(dueDateObj.getDate() + creditDays);
                            const dueDate = zodula.utils.format(dueDateObj, "date");
                            frm.set_value("due_date" as any, dueDate);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching supplier for due date calculation:", error);
                }
            }
        };

        // Form handlers
        zui.form.on(doctype, {
            [itemsField]: (frm: FormType<typeof doctype>) => {
                calculateNetTotal(frm, itemsField);
                updatePriceListFiltersForItems(frm);
            },
            net_total: (frm: FormType<typeof doctype>) => {
                calculateNetTotal(frm, itemsField);
            },
            supplier: async (frm: FormType<typeof doctype>) => {
                updateAddressFilters(frm);
                updateContactFilters(frm);
                updatePriceListFiltersForItems(frm);
                await updateDueDate(frm);
            },
            price_project: (frm: FormType<typeof doctype>) => {
                updatePriceListFiltersForItems(frm);
            },
            posting_date: async (frm: FormType<typeof doctype>) => {
                updatePriceListFiltersForItems(frm);
                await updateDueDate(frm);
            },
            apply_tax_template: async (frm: FormType<typeof doctype>) => {
                const templateId = frm.get_value("apply_tax_template" as any);
                await applyTaxTemplate(frm, templateId, "tax_and_charges");
                calculateTaxes(frm);
            },
            // Watch nested fields for tax calculations
            "tax_and_charges.rate": (frm: FormType<typeof doctype>) => {
                calculateTaxes(frm);
            },
            "tax_and_charges.charge_type": (frm: FormType<typeof doctype>) => {
                calculateTaxes(frm);
            },
            "tax_and_charges.tax_type": (frm: FormType<typeof doctype>) => {
                calculateTaxes(frm);
            },
            refresh: (frm: FormType<typeof doctype>) => {
                if (frm.is_new()) {
                    setDefaultValues(frm);
                }
                updateAddressFilters(frm);
                updateContactFilters(frm);
                updatePriceListFiltersForItems(frm);
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
                    context.addSecondaryButton(zui.t("Action"), () => {}, {
                        variant: "outline",
                        items: [{
                            label: zui.t("Create Payment"),
                            icon: CreditCard,
                            onClick: () => createPaymentHandler(context, {
                                referenceType: "Purchase Invoice",
                                paymentType: "Pay",
                                partyType: "Supplier"
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

