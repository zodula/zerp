import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";
import { zodula } from "@/zodula/client";

// Calculate taxes and charges for Payment Entry
function calculateTaxes(frm: FormType<"zerp__Payment Entry">) {
    const baseAmount = parseFloat(String(frm.get_value("base_amount") || 0)) || 0;
    const taxRows = frm.get_value("tax_and_charges") || [];
    
    if (!Array.isArray(taxRows) || taxRows.length === 0) {
        frm.set_value("total_taxes_and_charges", 0);
        frm.set_value("amount", baseAmount);
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
    
    let runningTotal = baseAmount;
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
            taxAmount = (baseAmount * rate) / 100;
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
        frm.set_value("tax_and_charges", updatedRows.map(row => ({ ...row })));
        
        // Update totals
        frm.set_value("total_taxes_and_charges", totalTaxesAndCharges);
        frm.set_value("amount", runningTotal);
    }, 0);
}

// Calculate base_amount from references
function calculateBaseAmount(frm: FormType<"zerp__Payment Entry">) {
    const references = frm.get_value("references") || [];
    if (!Array.isArray(references)) {
        frm.set_value("base_amount", 0);
        calculateTaxes(frm);
        return;
    }
    
    let baseAmount = 0;
    for (const ref of references) {
        const allocatedAmount = parseFloat(String((ref as any).allocated_amount || 0)) || 0;
        baseAmount += allocatedAmount;
    }
    
    frm.set_value("base_amount", baseAmount);
    // Recalculate taxes after base_amount changes
    calculateTaxes(frm);
}

async function calculateReferenceRows(frm: FormType<"zerp__Payment Entry">) {
    const referenceType = frm.get_value("reference_type");
    const rows = Array.isArray(frm.get_value("references"))
        ? [...(frm.get_value("references") as any[])]
        : [];

    let hasChanges = false;

    for (let idx = 0; idx < rows.length; idx++) {
        const row = { ...rows[idx] };
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
                    if (paymentEntry && (paymentEntry as any).reference_type === referenceType && (paymentEntry as any).doc_status === 1) {
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
    
    // Update base_amount from references and recalculate taxes
    calculateBaseAmount(frm);
}

export default function PaymentEntryScripts() {
    useEffect(() => {
        let updatingRefs = false;
        // Track last reference_id for each row to detect changes
        const lastReferenceIds = new Map<number, string>();

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

        // Helper function to set reference_id filters for all rows based on parent reference_type and party
        const setReferenceIdFilters = (frm: FormType<"zerp__Payment Entry">) => {
            const referenceType = frm.get_value("reference_type");
            const party = frm.get_value("party");
            if (!referenceType || !party) {
                return;
            }
            const partyField = referenceType === "zerp__Sales Invoice" || referenceType === "zerp__Delivery Order" ? "customer" : "supplier";
            const filters = JSON.stringify([[partyField, "=", party]]);
            const references = frm.get_value("references");
            if (Array.isArray(references)) {
                references.forEach((_, idx) => {
                    frm.set_df_child_table_property("references", idx, "reference_id", "filters", filters);
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
                    // Set reference_type to Sales Invoice for Receive payments (parent field)
                    frm.set_value("reference_type", "zerp__Sales Invoice");
                    setReferenceIdFilters(frm);
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
                    // Set reference_type to Purchase Invoice for Pay payments (parent field)
                    frm.set_value("reference_type", "zerp__Purchase Invoice");
                    setReferenceIdFilters(frm);
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
            reference_type: async function(frm) {
                setReferenceIdFilters(frm);
                if (!updatingRefs) {
                    updatingRefs = true;
                    try {
                        await calculateReferenceRows(frm);
                    } finally {
                        updatingRefs = false;
                    }
                }
            },
            party_type: async function(frm) {
                updatePartyReference(frm);
                const party = frm.get_value("party");
                updatePartyAccountFilter(frm);
                if (party) {
                    setReferenceIdFilters(frm);
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
                const party = frm.get_value("party");
                updatePartyAccountFilter(frm);
                if (party) {
                    setReferenceIdFilters(frm);
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
                            const referenceType = frm.get_value("reference_type");
                            if (referenceType && referenceId) {
                                try {
                                    const invoice = await zodula.doc.get_doc(referenceType as any, referenceId);
                                    if (invoice) {
                                        const totalAmount = parseFloat(String((invoice as any).total_amount || 0)) || 0;
                                        
                                        const referencesResponse = await zodula.doc.select_docs("zerp__Payment Entry Reference", {
                                            filters: [
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
                                                if (paymentEntry && (paymentEntry as any).reference_type === referenceType && (paymentEntry as any).doc_status === 1) {
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
                    
                    // Update base_amount from references and recalculate taxes
                    calculateBaseAmount(frm);
                } finally {
                    updatingRefs = false;
                }
            },
            base_amount: function(frm) {
                // Recalculate taxes when base_amount changes
                calculateTaxes(frm);
            },
            // Watch nested fields for tax calculations
            "tax_and_charges.rate": function(frm) {
                calculateTaxes(frm);
            },
            "tax_and_charges.charge_type": function(frm) {
                calculateTaxes(frm);
            },
            "tax_and_charges.tax_type": function(frm) {
                calculateTaxes(frm);
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
                
                // Calculate base_amount from references if they exist
                calculateBaseAmount(frm);
                
                if (paymentType === "Receive") {
                    if (frm.get_value("party_type") !== "zerp__Customer") {
                        frm.set_value("party_type", "zerp__Customer");
                    }
                    // Restore party value after party_type is set (if it was set from prefill)
                    if (existingParty && !frm.get_value("party")) {
                        frm.set_value("party", existingParty);
                    }
                    // Set reference_type only if not already set (e.g. preserve prefill from Delivery Order)
                    if (!frm.get_value("reference_type")) {
                        frm.set_value("reference_type", "zerp__Sales Invoice");
                    }
                    setReferenceIdFilters(frm);
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
                    if (!frm.get_value("reference_type")) {
                        frm.set_value("reference_type", "zerp__Purchase Invoice");
                    }
                    setReferenceIdFilters(frm);
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



