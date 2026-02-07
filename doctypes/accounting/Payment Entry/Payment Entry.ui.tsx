import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";
import { zodula } from "@/zodula/client";

async function calculateReferenceRows(frm: FormType<"zerp__Payment Entry">) {
    const rows = Array.isArray(frm.get_value("references"))
        ? [...(frm.get_value("references") as any[])]
        : [];

    let hasChanges = false;

    for (let idx = 0; idx < rows.length; idx++) {
        const row = { ...rows[idx] };
        const referenceType = (row as any).reference_type;
        const referenceId = (row as any).reference_id;

        if (!referenceType || !referenceId) {
            if ((row as any).remaining_amount !== 0) {
                row.remaining_amount = 0;
                hasChanges = true;
            }
            if ((row as any).allocated_amount !== 0) {
                row.allocated_amount = 0;
                hasChanges = true;
            }
            rows[idx] = row;
            continue;
        }

        try {
            const invoice = await zodula.doc.get_doc(referenceType as any, referenceId);
            if (!invoice) {
                if ((row as any).remaining_amount !== 0) {
                    row.remaining_amount = 0;
                    hasChanges = true;
                }
                rows[idx] = row;
                continue;
            }

            const totalAmount = parseFloat(String((invoice as any).total_amount || 0)) || 0;

            const referencesResponse = await zodula.doc.select_docs("zerp__Payment Entry Reference", {
                filters: [
                    ["reference_type", "=", referenceType],
                    ["reference_id", "=", referenceId]
                ],
                limit: 10000,
                sort: "idx",
                order: "asc"
            });

            let totalAllocated = 0;
            const currentRowId = (row as any).id;

            for (const ref of referencesResponse.docs) {
                const refId = (ref as any).id;
                if (currentRowId && refId === currentRowId) {
                    continue;
                }

                const paymentEntryId = (ref as any).payment_entry;
                if (paymentEntryId) {
                    const paymentEntry = await zodula.doc.get_doc("zerp__Payment Entry", paymentEntryId);
                    if (paymentEntry && (paymentEntry as any).doc_status === 1) {
                        const allocatedAmount = parseFloat(String((ref as any).allocated_amount || 0)) || 0;
                        totalAllocated += allocatedAmount;
                    }
                }
            }

            const remainingAmount = Math.max(0, totalAmount - totalAllocated);
            if ((row as any).remaining_amount !== remainingAmount) {
                row.remaining_amount = remainingAmount;
                hasChanges = true;
            }

            const currentAllocated = parseFloat(String((row as any).allocated_amount || 0)) || 0;
            if (currentAllocated === 0 || (row as any).allocated_amount === undefined || (row as any).allocated_amount === null) {
                const newAllocated = remainingAmount > 0 ? remainingAmount : totalAmount;
                if (newAllocated !== currentAllocated) {
                    row.allocated_amount = newAllocated;
                    hasChanges = true;
                }
            }

            rows[idx] = row;
        } catch (error) {
            console.error("Error calculating remaining amount for reference row:", error);
            if ((row as any).remaining_amount !== 0) {
                row.remaining_amount = 0;
                hasChanges = true;
            }
            rows[idx] = row;
        }
    }

    if (hasChanges) {
        frm.set_value("references", rows as any);
    }
    
    // Calculate and update total_allocated
    let totalAllocated = 0;
    for (const row of rows) {
        const allocatedAmount = parseFloat(String((row as any).allocated_amount || 0)) || 0;
        totalAllocated += allocatedAmount;
    }
    frm.set_value("total_allocated", totalAllocated);
}

export default function PaymentEntryScripts() {
    useEffect(() => {
        let updatingRefs = false;
        // Track last reference_id for each row to detect changes
        const lastReferenceIds = new Map<number, string>();

        const getPartyField = (partyType: string): string => {
            return partyType === "zerp__Customer" ? "customer" : "supplier";
        };

        const updatePartyReference = (frm: FormType<"zerp__Payment Entry">) => {
            const partyType = frm.get_value("party_type");
            const paymentType = frm.get_value("payment_type");
            
            // Only clear party if party_type is being changed and doesn't match payment_type
            // Don't clear if we're in refresh and party_type matches the expected type for payment_type
            if (partyType && (partyType === "zerp__Customer" || partyType === "zerp__Supplier")) {
                const expectedPartyType = paymentType === "Receive" ? "zerp__Customer" : 
                                         paymentType === "Pay" ? "zerp__Supplier" : null;
                
                // Only clear if party_type doesn't match what's expected for the payment_type
                // This prevents clearing party when it's being set correctly from prefill
                if (expectedPartyType && partyType !== expectedPartyType) {
                    const currentParty = frm.get_value("party");
                    if (currentParty) {
                        frm.set_value("party", "");
                    }
                }
            }
        };

        const updatePartyAccountFilter = (frm: FormType<"zerp__Payment Entry">) => {
            const partyType = frm.get_value("party_type");
            const party = frm.get_value("party");
            
            if (partyType && party) {
                // Filter party_account to show only accounts related to the selected party
                const filters = JSON.stringify([
                    ["party_type", "=", partyType],
                    ["party", "=", party]
                ]);
                frm.set_df_property("party_account", "filters", filters);
            } else {
                // Clear filters if party_type or party is not set
                frm.set_df_property("party_account", "filters", JSON.stringify([]));
            }
        };

        // Helper function to set properties for all rows in the references table
        const setReferencesTableProperty = (frm: FormType<"zerp__Payment Entry">, fieldName: string, property: string, value: any) => {
            const references = frm.get_value("references");
            if (Array.isArray(references)) {
                // Set property for each row individually
                references.forEach((_, idx) => {
                    frm.set_df_child_table_property("references", idx, fieldName, property, value);
                });
            }
        };

        zui.form.on("zerp__Payment Entry", {
            payment_type: async function(frm) {
                const paymentType = frm.get_value("payment_type");
                if (paymentType === "Receive") {
                    // Set party_type to Customer for Receive payments
                    if (frm.get_value("party_type") !== "zerp__Customer") {
                        frm.set_value("party_type", "zerp__Customer");
                    }
                    // Set reference_type to Sales Invoice for Receive payments
                    // Set property for each row individually
                    setReferencesTableProperty(frm, "reference_type", "default", "zerp__Sales Invoice");
                    const party = frm.get_value("party");
                    if (party) {
                        const filters = JSON.stringify([["customer", "=", party]]);
                        setReferencesTableProperty(frm, "reference_id", "filters", filters);
                    }
                    // Update party_account filter
                    updatePartyAccountFilter(frm);
                    if (!updatingRefs) {
                        updatingRefs = true;
                        try {
                            await calculateReferenceRows(frm);
                        } finally {
                            updatingRefs = false;
                        }
                    }
                } else if (paymentType === "Pay") {
                    // Set party_type to Supplier for Pay payments
                    if (frm.get_value("party_type") !== "zerp__Supplier") {
                        frm.set_value("party_type", "zerp__Supplier");
                    }
                    // Set reference_type to Purchase Invoice for Pay payments
                    // Set property for each row individually
                    setReferencesTableProperty(frm, "reference_type", "default", "zerp__Purchase Invoice");
                    const party = frm.get_value("party");
                    if (party) {
                        const filters = JSON.stringify([["supplier", "=", party]]);
                        setReferencesTableProperty(frm, "reference_id", "filters", filters);
                    }
                    // Update party_account filter
                    updatePartyAccountFilter(frm);
                    if (!updatingRefs) {
                        updatingRefs = true;
                        try {
                            await calculateReferenceRows(frm);
                        } finally {
                            updatingRefs = false;
                        }
                    }
                }
            },
            party_type: async function(frm) {
                updatePartyReference(frm);
                const paymentType = frm.get_value("payment_type");
                const partyType = frm.get_value("party_type");
                const party = frm.get_value("party");
                
                // Update party_account filter
                updatePartyAccountFilter(frm);
                
                if (party && paymentType && partyType) {
                    const partyField = getPartyField(partyType);
                    const filters = JSON.stringify([[partyField, "=", party]]);
                    setReferencesTableProperty(frm, "reference_id", "filters", filters);
                    if (!updatingRefs) {
                        updatingRefs = true;
                        try {
                            await calculateReferenceRows(frm);
                        } finally {
                            updatingRefs = false;
                        }
                    }
                }
            },
            party: async function(frm) {
                const partyType = frm.get_value("party_type");
                const party = frm.get_value("party");
                
                // Update party_account filter
                updatePartyAccountFilter(frm);
                
                if (party && partyType) {
                    const partyField = getPartyField(partyType);
                    const filters = JSON.stringify([[partyField, "=", party]]);
                    setReferencesTableProperty(frm, "reference_id", "filters", filters);
                    if (!updatingRefs) {
                        updatingRefs = true;
                        try {
                            await calculateReferenceRows(frm);
                        } finally {
                            updatingRefs = false;
                        }
                    }
                }
            },
            payment_method: async function(frm) {
                const paymentMethod = frm.get_value("payment_method");
                if (paymentMethod === "Bank") {
                    // Filter organization_account to show only bank accounts
                    const filters = JSON.stringify([["is_bank_account", "=", 1]]);
                    frm.set_df_property("organization_account", "filters", filters);
                } else {
                    // Clear filters for other payment methods (show all accounts)
                    frm.set_df_property("organization_account", "filters", JSON.stringify([]));
                }
            },
            references: async function(frm) {
                if (updatingRefs) return;
                updatingRefs = true;
                try {
                    const rows = Array.isArray(frm.get_value("references"))
                        ? [...(frm.get_value("references") as any[])]
                        : [];
                    
                    // Process only rows where reference_id changed
                    for (let idx = 0; idx < rows.length; idx++) {
                        const row = rows[idx];
                        const referenceId = (row as any).reference_id;
                        const lastRefId = lastReferenceIds.get(idx);
                        
                        // If reference_id changed or is new, process this row
                        if (referenceId && referenceId !== lastRefId) {
                            const referenceType = (row as any).reference_type;
                            if (referenceType && referenceId) {
                                try {
                                    const invoice = await zodula.doc.get_doc(referenceType as any, referenceId);
                                    if (invoice) {
                                        const totalAmount = parseFloat(String((invoice as any).total_amount || 0)) || 0;
                                        
                                        const referencesResponse = await zodula.doc.select_docs("zerp__Payment Entry Reference", {
                                            filters: [
                                                ["reference_type", "=", referenceType],
                                                ["reference_id", "=", referenceId]
                                            ],
                                            limit: 10000,
                                            sort: "idx",
                                            order: "asc"
                                        });
                                        
                                        let totalAllocated = 0;
                                        const currentRowId = (row as any).id;
                                        
                                        for (const ref of referencesResponse.docs) {
                                            const refId = (ref as any).id;
                                            if (currentRowId && refId === currentRowId) {
                                                continue;
                                            }
                                            
                                            const paymentEntryId = (ref as any).payment_entry;
                                            if (paymentEntryId) {
                                                const paymentEntry = await zodula.doc.get_doc("zerp__Payment Entry", paymentEntryId);
                                                if (paymentEntry && (paymentEntry as any).doc_status === 1) {
                                                    const allocatedAmount = parseFloat(String((ref as any).allocated_amount || 0)) || 0;
                                                    totalAllocated += allocatedAmount;
                                                }
                                            }
                                        }
                                        
                                        const remainingAmount = Math.max(0, totalAmount - totalAllocated);
                                        const currentAllocated = parseFloat(String((row as any).allocated_amount || 0)) || 0;
                                        
                                        // Update row
                                        row.remaining_amount = remainingAmount;
                                        if (currentAllocated === 0 || (row as any).allocated_amount === undefined || (row as any).allocated_amount === null) {
                                            row.allocated_amount = remainingAmount > 0 ? remainingAmount : totalAmount;
                                        }
                                        
                                        // Update tracking
                                        lastReferenceIds.set(idx, referenceId);
                                    }
                                } catch (error) {
                                    console.error("Error calculating remaining amount for reference row:", error);
                                }
                            }
                        } else if (!referenceId) {
                            // Clear tracking and set allocated_amount to 0 if reference_id is removed
                            lastReferenceIds.delete(idx);
                            if ((row as any).allocated_amount !== 0) {
                                row.allocated_amount = 0;
                            }
                            if ((row as any).remaining_amount !== 0) {
                                row.remaining_amount = 0;
                            }
                        }
                    }
                    
                    // Calculate and update total_allocated
                    let totalAllocated = 0;
                    for (const row of rows) {
                        const allocatedAmount = parseFloat(String((row as any).allocated_amount || 0)) || 0;
                        totalAllocated += allocatedAmount;
                    }
                    frm.set_value("total_allocated", totalAllocated);
                    
                    // Update form with any changes
                    frm.set_value("references", rows as any);
                } finally {
                    updatingRefs = false;
                }
            },
            refresh: async function(frm) {
                const paymentType = frm.get_value("payment_type");
                const paymentMethod = frm.get_value("payment_method");
                
                // Preserve party value before updating party_type (since party depends on party_type)
                const existingParty = frm.get_value("party");
                
                updatePartyReference(frm);
                
                // Update organization_account filters based on payment_method
                if (paymentMethod === "Bank") {
                    const filters = JSON.stringify([["is_bank_account", "=", 1]]);
                    frm.set_df_property("organization_account", "filters", filters);
                } else {
                    frm.set_df_property("organization_account", "filters", JSON.stringify([]));
                }
                
                if (paymentType === "Receive") {
                    if (frm.get_value("party_type") !== "zerp__Customer") {
                        frm.set_value("party_type", "zerp__Customer");
                    }
                    // Restore party value after party_type is set (if it was set from prefill)
                    if (existingParty && !frm.get_value("party")) {
                        frm.set_value("party", existingParty);
                    }
                    setReferencesTableProperty(frm, "reference_type", "default", "zerp__Sales Invoice");
                    const party = frm.get_value("party");
                    if (party) {
                        const filters = JSON.stringify([["customer", "=", party]]);
                        setReferencesTableProperty(frm, "reference_id", "filters", filters);
                    }
                    // Update party_account filter after party is set
                    updatePartyAccountFilter(frm);
                    if (!updatingRefs) {
                        updatingRefs = true;
                        try {
                            await calculateReferenceRows(frm);
                        } finally {
                            updatingRefs = false;
                        }
                    }
                } else if (paymentType === "Pay") {
                    if (frm.get_value("party_type") !== "zerp__Supplier") {
                        frm.set_value("party_type", "zerp__Supplier");
                    }
                    // Restore party value after party_type is set (if it was set from prefill)
                    if (existingParty && !frm.get_value("party")) {
                        frm.set_value("party", existingParty);
                    }
                    setReferencesTableProperty(frm, "reference_type", "default", "zerp__Purchase Invoice");
                    const party = frm.get_value("party");
                    if (party) {
                        const filters = JSON.stringify([["supplier", "=", party]]);
                        setReferencesTableProperty(frm, "reference_id", "filters", filters);
                    }
                    // Update party_account filter after party is set
                    updatePartyAccountFilter(frm);
                    if (!updatingRefs) {
                        updatingRefs = true;
                        try {
                            await calculateReferenceRows(frm);
                        } finally {
                            updatingRefs = false;
                        }
                    }
                } else {
                    // Update party_account filter even if payment_type is not set
                    updatePartyAccountFilter(frm);
                }
            }
        });
    }, []);

    return null;
}



