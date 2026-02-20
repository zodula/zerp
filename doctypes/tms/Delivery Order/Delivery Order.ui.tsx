import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";
import type { FormContext } from "@/zodula/ui/zui";
import { zodula } from "@/zodula/client";
import { CreditCard } from "lucide-react";

type DeliveryOrderDoctype = "Delivery Order";

// ============================================================================
// Helper Functions (same logic as Sales Invoice)
// ============================================================================

const calculateNetTotal = (
    frm: FormType<DeliveryOrderDoctype>,
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
        calculateTaxes(frm);
    }
};

const calculateTaxes = (frm: FormType<DeliveryOrderDoctype>) => {
    const netTotal = parseFloat(String(frm.get_value("net_total" as any) || 0)) || 0;
    const taxRows = frm.get_value("tax_and_charges" as any) || [];

    if (!Array.isArray(taxRows) || taxRows.length === 0) {
        frm.set_value("total_taxes_and_charges" as any, 0);
        frm.set_value("total_amount" as any, netTotal);
        return;
    }

    const rowsWithOriginalIndex = taxRows.map((row: any, originalIndex: number) => ({
        ...row,
        _originalIndex: originalIndex
    }));

    const sortedTaxRows = [...rowsWithOriginalIndex].sort((a: any, b: any) => {
        const idxA = parseFloat(String(a.idx || 0)) || 0;
        const idxB = parseFloat(String(b.idx || 0)) || 0;
        return idxA - idxB;
    });

    let runningTotal = netTotal;
    let totalTaxesAndCharges = 0;
    const updatedRows = taxRows.map((row: any) => ({ ...row }));
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
                const prevTaxAmount = calculatedAmounts[prevOriginalIndex]?.tax_amount || parseFloat(String(prevRow.tax_amount || 0)) || 0;
                taxAmount = (prevTaxAmount * rate) / 100;
            }
        }

        const originalIndex = taxRow._originalIndex;
        if (originalIndex !== undefined && originalIndex >= 0) {
            calculatedAmounts[originalIndex] = { tax_amount: taxAmount };
        }

        if (taxRow.tax_type === "Excluded") {
            runningTotal += taxAmount;
            totalTaxesAndCharges += taxAmount;
        } else {
            totalTaxesAndCharges += taxAmount;
        }
    }

    for (let i = 0; i < updatedRows.length; i++) {
        const calculated = calculatedAmounts[i];
        if (calculated) {
            updatedRows[i] = { ...updatedRows[i], tax_amount: calculated.tax_amount };
        }
    }

    setTimeout(() => {
        frm.set_value("tax_and_charges" as any, updatedRows.map((row: any) => ({ ...row })));
        frm.set_value("total_taxes_and_charges" as any, totalTaxesAndCharges);
        frm.set_value("total_amount" as any, runningTotal);
    }, 0);
};

const applyTaxTemplate = async (
    frm: FormType<DeliveryOrderDoctype>,
    taxTemplateId: string | null,
    taxAndChargesField: string
) => {
    if (!taxTemplateId) {
        frm.set_value(taxAndChargesField as any, []);
        calculateTaxes(frm);
        return;
    }

    try {
        const template = await zodula.doc.get_doc("Tax Template", taxTemplateId);
        if (!template || !template.tax_template_items) return;

        const templateItems = await zodula.doc.select_docs("Tax Template Item", {
            filters: [["tax_template", "=", taxTemplateId]],
            sort: "idx",
            order: "asc",
            limit: 1000
        });

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
        calculateTaxes(frm);
    } catch (error) {
        console.error("Error applying tax template:", error);
    }
};

const setDefaultValues = (frm: FormType<DeliveryOrderDoctype>) => {
    if (!frm.get_value("posting_date" as any)) {
        frm.set_value("posting_date" as any, zodula.utils.format(new Date(), "date"));
    }
    if (!frm.get_value("due_date" as any)) {
        const today = new Date();
        today.setDate(today.getDate() + 30);
        frm.set_value("due_date" as any, zodula.utils.format(today, "date"));
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
};

const createPaymentHandler = async (context: FormContext) => {
    const doc = context.doc as any;
    if (!doc.id) return;

    const org = context.org || "System Panel";
    const totalAmount = parseFloat(String(doc.total_amount || 0)) || 0;
    const party = doc.customer;

    let partyAccount: string | null = null;
    if (party) {
        try {
            const accounts = await zodula.doc.select_docs("Account", {
                filters: [
                    ["party_type", "=", "Customer"],
                    ["party", "=", party]
                ],
                limit: 1,
                sort: "account_code",
                order: "asc"
            });
            if (accounts.docs?.length > 0 && accounts.docs[0]) {
                partyAccount = accounts.docs[0].id;
            }
        } catch (error) {
            console.error("Error finding party account:", error);
        }
    }

    let taxAndCharges: any[] = [];
    if (Array.isArray(doc.tax_and_charges) && doc.tax_and_charges.length > 0) {
        taxAndCharges = doc.tax_and_charges.map((taxRow: any) => ({
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

    const prefill: any = {
        posting_date: zodula.utils.format(new Date(), "date"),
        payment_type: "Receive",
        party_type: "Customer",
        party,
        reference_type: "Delivery Order",
        payment_method: "Bank",
        party_account: partyAccount,
        base_amount: parseFloat(String(doc.net_total || 0)) || 0,
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

export default function DeliveryOrderScripts() {
    useEffect(() => {
        const doctype = "Delivery Order" as const;
        const itemsField = "delivery_order_items" as const;

        const updateAddressFilters = (frm: FormType<typeof doctype>) => {
            const customer = frm.get_value("customer" as any);
            if (customer) {
                const billingFilters = JSON.stringify([
                    ["links.link_doctype", "=", "Customer"],
                    ["links.link_id", "=", customer],
                    ["address_type", "=", "Billing"]
                ]);
                const shippingFilters = JSON.stringify([
                    ["links.link_doctype", "=", "Customer"],
                    ["links.link_id", "=", customer],
                    ["address_type", "=", "Shipping"]
                ]);
                frm.set_df_property("billing_address", "filters", billingFilters);
                frm.set_df_property("shipping_address", "filters", shippingFilters);
            } else {
                frm.set_df_property("billing_address", "filters", JSON.stringify([]));
                frm.set_df_property("shipping_address", "filters", JSON.stringify([]));
            }
        };

        const updateContactFilters = (frm: FormType<typeof doctype>) => {
            const customer = frm.get_value("customer" as any);
            if (customer) {
                const filters = JSON.stringify([
                    ["links.link_doctype", "=", "Customer"],
                    ["links.link_id", "=", customer]
                ]);
                frm.set_df_property("billing_contact", "filters", filters);
                frm.set_df_property("shipping_contact", "filters", filters);
            } else {
                frm.set_df_property("billing_contact", "filters", JSON.stringify([]));
                frm.set_df_property("shipping_contact", "filters", JSON.stringify([]));
            }
        };

        // Only apply product filter when filter_product_by_customer is explicitly checked (1 or "1"); 0/null/undefined → clear filters
        const updateProductFilterByCustomer = (frm: FormType<typeof doctype>) => {
            const raw = frm.get_value("filter_product_by_customer" as any);
            const filterByCustomer = raw === 1 || raw === "1" || raw === true;
            const customer = frm.get_value("customer" as any);
            if (filterByCustomer && customer) {
                const filters = JSON.stringify([["product_customer.customer", "=", customer]]);
                frm.set_df_child_table_property("delivery_order_items", null, "product", "filters", filters);
            } else {
                frm.set_df_child_table_property("delivery_order_items", null, "product", "filters", JSON.stringify([]));
            }
        };

        // Set price_list filters and readonly per row (parent price_project, customer, row product, until_date)
        const updatePriceListFiltersForItems = (frm: FormType<typeof doctype>) => {
            const items = (frm.get_value(itemsField as any) || []) as any[];
            const priceProject = frm.get_value("price_project" as any);
            const customer = frm.get_value("customer" as any);
            const postingDate = frm.get_value("posting_date" as any);
            items.forEach((row: any, idx: number) => {
                const product = row?.product;
                const criteriaMet = !!(priceProject && customer && product);
                if (!criteriaMet) {
                    frm.set_df_child_table_property(itemsField, idx, "price_list", "filters", []);
                    frm.set_df_child_table_property(itemsField, idx, "price_list", "readonly", 1);
                    return;
                }
                frm.set_df_child_table_property(itemsField, idx, "price_list", "readonly", 0);
                const filters: [string, string, any][] = [
                    ["price_project", "=", priceProject],
                    ["party_type", "=", "Customer"],
                    ["customer", "=", customer],
                    ["product", "=", product],
                ];
                if (postingDate) {
                    filters.push(["until_date", ">=", postingDate]);
                }
                frm.set_df_child_table_property(itemsField, idx, "price_list", "filters", filters);
            });
        };

        const updateDueDate = async (frm: FormType<typeof doctype>) => {
            const customer = frm.get_value("customer" as any);
            const postingDate = frm.get_value("posting_date" as any);
            if (customer && postingDate) {
                try {
                    const customerDoc = await zodula.doc.get_doc("Customer", customer);
                    if (customerDoc?.credit_days) {
                        const creditDays = parseFloat(String(customerDoc.credit_days || 0)) || 0;
                        if (creditDays > 0) {
                            const postingDateObj = new Date(postingDate);
                            const dueDateObj = new Date(postingDateObj);
                            dueDateObj.setDate(dueDateObj.getDate() + creditDays);
                            frm.set_value("due_date" as any, zodula.utils.format(dueDateObj, "date"));
                        }
                    }
                } catch (error) {
                    console.error("Error fetching customer for due date:", error);
                }
            }
        };

        zui.form.on(doctype, {
            [itemsField]: (frm: FormType<typeof doctype>) => {
                calculateNetTotal(frm, itemsField);
                updateProductFilterByCustomer(frm);
                updatePriceListFiltersForItems(frm);
            },
            net_total: (frm: FormType<typeof doctype>) => {
                calculateNetTotal(frm, itemsField);
            },
            customer: async (frm: FormType<typeof doctype>) => {
                updateAddressFilters(frm);
                updateContactFilters(frm);
                updateProductFilterByCustomer(frm);
                updatePriceListFiltersForItems(frm);
                await updateDueDate(frm);
            },
            price_project: (frm: FormType<typeof doctype>) => {
                updatePriceListFiltersForItems(frm);
            },
            filter_product_by_customer: (frm: FormType<typeof doctype>) => {
                updateProductFilterByCustomer(frm);
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
            "tax_and_charges.rate": (frm: FormType<typeof doctype>) => calculateTaxes(frm),
            "tax_and_charges.charge_type": (frm: FormType<typeof doctype>) => calculateTaxes(frm),
            "tax_and_charges.tax_type": (frm: FormType<typeof doctype>) => calculateTaxes(frm),
            refresh: (frm: FormType<typeof doctype>) => {
                if (frm.is_new()) {
                    setDefaultValues(frm);
                }
                updateAddressFilters(frm);
                updateContactFilters(frm);
                updateProductFilterByCustomer(frm);
                updatePriceListFiltersForItems(frm);
            }
        });

        zui.list.on(doctype, {
            on_format: (context) => {
                context.addBadge("doc_status", {
                    variant: "muted",
                    size: "sm",
                    getValue: getPaymentStatusBadge
                });
            }
        });

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
                            onClick: () => createPaymentHandler(context),
                            disabled: (context.doc as any).payment_status === "Paid"
                        }]
                    });
                }
            }
        });
    }, []);

    return null;
}
