import { ZodulaDoctypeHelper } from "@/zodula/server/zodula/doc/helper";
import { loader } from "@/zodula/server/loader";

export default $doctype<"zerp__Payment Entry">({
    party_type: {
        type: "Reference",
        label: "Party Type",
        reference: "zodula__Doctype",
        filters: JSON.stringify([["name", "IN", ["zerp__Customer", "zerp__Supplier"]]]),
        required: 1,
        in_list_view: 1
    },
    party: {
        type: "Reference",
        label: "Party",
        reference: "{{party_type}}",
        required: 1,
        in_list_view: 1
    },
    payment_type: {
        type: "Select",
        label: "Payment Type",
        options: "Receive\nPay",
        required: 1,
        in_list_view: 1
    },
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        in_list_view: 1,
        default: "TODAY()"
    },
    base_amount: {
        type: "Currency",
        label: "Base Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    total_taxes_and_charges: {
        type: "Currency",
        label: "Total Taxes and Charges",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    amount: {
        type: "Currency",
        label: "Amount",
        required: 1,
        in_list_view: 1
    },
    total_allocated: {
        type: "Currency",
        label: "Total Allocated",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    payment_method: {
        type: "Select",
        label: "Payment Method",
        options: "Cash\nBank\nCard\nTransfer",
        required: 1,
        in_list_view: 1
    },
    organization_account: {
        type: "Reference",
        label: "Organization Account",
        reference: "zerp__Account",
        required: 1,
        in_list_view: 1
    },
    party_account: {
        type: "Reference",
        label: "Party Account",
        reference: "zerp__Account",
        required: 1,
        in_list_view: 1
    },
    reference_no: {
        type: "Text",
        label: "Reference No"
    },
    references: {
        type: "Reference Table",
        label: "References",
        reference: "zerp__Payment Entry Reference",
        required: 0
    },
    tax_and_charges: {
        type: "Reference Table",
        label: "Tax and Charges",
        reference: "zerp__Tax and Charges",
        required: 0
    }
}, {
    label: "Payment Entry",
    naming_series: "PE-{{organization_abbr}}-{YYYY}{MM}{DD}{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "party\npayment_type\nreference_no",
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "payment_type", align: "left" },
                    { type: "field", value: "party_type", align: "left" },
                    { type: "field", value: "party", align: "left" },
                ],
                { type: "section", value: "Amount", align: "left" },
                [
                    { type: "field", value: "base_amount", align: "left" },
                    { type: "field", value: "total_taxes_and_charges", align: "left" },
                    { type: "field", value: "amount", align: "left" },
                    { type: "field", value: "total_allocated", align: "left" }
                ],
                { type: "section", value: "Taxes", align: "left" },
                [
                    { type: "field", value: "tax_and_charges", align: "left" }
                ],
                { type: "section", value: "Payment Details", align: "left" },
                [
                    { type: "field", value: "payment_method", align: "left" },
                    { type: "field", value: "organization_account", align: "left" },
                    { type: "field", value: "party_account", align: "left" },
                    { type: "field", value: "reference_no", align: "left" }
                ],
                { type: "section", value: "Invoice References", align: "left" },
                [
                    { type: "field", value: "references", align: "left" }
                ]
            ]
        }
    ])
})
.on("before_change", async ({ doc }) => {
    // Validate document using validateDoc function
    const doctypeSchema = loader.from("doctype").get("zerp__Payment Entry").schema;
    ZodulaDoctypeHelper.validateDoc(doc, doctypeSchema, false);
    
    // Calculate base_amount from references (sum of allocated amounts)
    let baseAmount = 0;
    if (doc.references && Array.isArray(doc.references)) {
        for (const ref of doc.references) {
            const allocatedAmount = parseFloat(String((ref as any).allocated_amount || 0)) || 0;
            baseAmount += allocatedAmount;
        }
    }
    doc.base_amount = baseAmount;

    // Calculate taxes and charges
    const taxRows = doc.tax_and_charges && Array.isArray(doc.tax_and_charges) ? doc.tax_and_charges : [];
    
    // Sort by idx to ensure proper order
    const sortedTaxRows = [...taxRows].sort((a: any, b: any) => {
        const idxA = (a as any).idx || 0;
        const idxB = (b as any).idx || 0;
        return idxA - idxB;
    });

    let runningTotal = baseAmount;
    let totalTaxesAndCharges = 0;

    for (let i = 0; i < sortedTaxRows.length; i++) {
        const taxRow = sortedTaxRows[i] as any;
        const chargeType = taxRow.charge_type || "Actual";
        const rate = parseFloat(String(taxRow.rate || 0)) || 0;
        let taxAmount = 0;

        if (chargeType === "Actual") {
            taxAmount = parseFloat(String(taxRow.tax_amount || 0)) || 0;
        } else if (chargeType === "On Net Total") {
            taxAmount = (baseAmount * rate) / 100;
        } else if (chargeType === "On Previous Row Amount") {
            if (i > 0) {
                const prevRow = sortedTaxRows[i - 1] as any;
                const prevTaxAmount = parseFloat(String(prevRow.tax_amount || 0)) || 0;
                taxAmount = (prevTaxAmount * rate) / 100;
            }
        } else if (chargeType === "On Previous Row Total") {
            if (i > 0) {
                const prevRow = sortedTaxRows[i - 1] as any;
                // Use tax_amount instead of total for "On Previous Row Total"
                const prevTaxAmount = parseFloat(String(prevRow.tax_amount || 0)) || 0;
                taxAmount = (prevTaxAmount * rate) / 100;
            }
        }

        taxRow.tax_amount = taxAmount;
        
        // For excluded taxes, add to running total; for included, it's already in the base
        if (taxRow.tax_type === "Excluded") {
            runningTotal += taxAmount;
            totalTaxesAndCharges += taxAmount;
        } else {
            // For included taxes, they're already in the base amount
            totalTaxesAndCharges += taxAmount;
        }
    }

    doc.total_taxes_and_charges = totalTaxesAndCharges;
    doc.amount = runningTotal;
    
    // Calculate total_allocated from references
    let totalAllocated = 0;
    if (doc.references && Array.isArray(doc.references)) {
        for (const ref of doc.references) {
            const allocatedAmount = parseFloat(String((ref as any).allocated_amount || 0)) || 0;
            totalAllocated += allocatedAmount;
        }
    }
    
    // Update total_allocated field
    doc.total_allocated = totalAllocated;
    
    // Validate that total_allocated equals base_amount (not amount, since amount includes taxes)
    if (Math.abs(totalAllocated - baseAmount) > 0.01) { // Allow small floating point differences
        throw new Error(`Total Allocated (${totalAllocated}) must equal Base Amount (${baseAmount})`);
    }
})
.on("after_submit", async ({ doc }) => {
    // Create General Ledger entries for Payment Entry
    const amount = parseFloat(String(doc.amount || 0)) || 0;
    const organizationAccount = doc.organization_account as string;
    const partyAccount = doc.party_account as string;
    const paymentType = doc.payment_type as string;
    const description = `Payment Entry ${doc.id}${doc.reference_no ? ` - Ref: ${doc.reference_no}` : ''}`;
    
    if (paymentType === "Receive") {
        // Receive payment: Debit organization account (cash/bank), Credit party account (customer)
        if (organizationAccount) {
            await $zodula.doctype("zerp__General Ledger").insert({
                posting_date: doc.posting_date,
                account: organizationAccount,
                debit_amount: amount,
                credit_amount: 0,
                reference_doctype: "zerp__Payment Entry",
                reference_id: doc.id,
                description: description,
                party_type: doc.party_type,
                party: doc.party
            } as any);
        }
        if (partyAccount) {
            await $zodula.doctype("zerp__General Ledger").insert({
                posting_date: doc.posting_date,
                account: partyAccount,
                debit_amount: 0,
                credit_amount: amount,
                reference_doctype: "zerp__Payment Entry",
                reference_id: doc.id,
                description: description,
                party_type: doc.party_type,
                party: doc.party
            } as any);
        }
    } else if (paymentType === "Pay") {
        // Pay payment: Debit party account (supplier), Credit organization account (cash/bank)
        if (partyAccount) {
            await $zodula.doctype("zerp__General Ledger").insert({
                posting_date: doc.posting_date,
                account: partyAccount,
                debit_amount: amount,
                credit_amount: 0,
                reference_doctype: "zerp__Payment Entry",
                reference_id: doc.id,
                description: description,
                party_type: doc.party_type,
                party: doc.party
            } as any);
        }
        if (organizationAccount) {
            await $zodula.doctype("zerp__General Ledger").insert({
                posting_date: doc.posting_date,
                account: organizationAccount,
                debit_amount: 0,
                credit_amount: amount,
                reference_doctype: "zerp__Payment Entry",
                reference_id: doc.id,
                description: description,
                party_type: doc.party_type,
                party: doc.party
            } as any);
        }
    }
    
    // Manage payment status for each referenced invoice document
    if (doc.references && Array.isArray(doc.references)) {
        const invoiceMap = new Map<string, Set<string>>(); // doctype -> Set of invoice IDs
        for (const ref of doc.references) {
            if (ref.reference_type && ref.reference_id) {
                const doctype = ref.reference_type;
                const invoiceId = ref.reference_id;
                // Only process valid invoice types
                if (doctype === "zerp__Sales Invoice" || doctype === "zerp__Purchase Invoice") {
                    if (!invoiceMap.has(doctype)) {
                        invoiceMap.set(doctype, new Set([invoiceId]));
                    } else {
                        invoiceMap.get(doctype)!.add(invoiceId);
                    }
                }
            }
        }
        // Update payment status for each referenced invoice
        for (const [doctype, invoiceIds] of invoiceMap.entries()) {
            for (const invoiceId of invoiceIds) {
                await updateInvoicePaymentAmount(doctype as "zerp__Sales Invoice" | "zerp__Purchase Invoice", invoiceId);
            }
        }
    }
})
.on("after_cancel", async ({ doc }) => {
    // Delete General Ledger entries for Payment Entry instead of creating reversed entries
    // Find all GL entries that reference this Payment Entry
    const glEntries = await $zodula.doctype("zerp__General Ledger")
        .select()
        .where("reference_doctype", "=", "zerp__Payment Entry")
        .where("reference_id", "=", doc.id);
    
    // Delete each GL entry (after_delete hook will automatically update account balances)
    for (const glEntry of glEntries.docs) {
        await $zodula.doctype("zerp__General Ledger").delete(glEntry.id);
    }
    
    // Manage payment status for each referenced invoice document (recalculate after cancellation)
    if (doc.references && Array.isArray(doc.references)) {
        const invoiceMap = new Map<string, Set<string>>(); // doctype -> Set of invoice IDs
        for (const ref of doc.references) {
            if (ref.reference_type && ref.reference_id) {
                const doctype = ref.reference_type;
                const invoiceId = ref.reference_id;
                // Only process valid invoice types
                if (doctype === "zerp__Sales Invoice" || doctype === "zerp__Purchase Invoice") {
                    if (!invoiceMap.has(doctype)) {
                        invoiceMap.set(doctype, new Set([invoiceId]));
                    } else {
                        invoiceMap.get(doctype)!.add(invoiceId);
                    }
                }
            }
        }
        // Update payment status for each referenced invoice
        for (const [doctype, invoiceIds] of invoiceMap.entries()) {
            for (const invoiceId of invoiceIds) {
                await updateInvoicePaymentAmount(doctype as "zerp__Sales Invoice" | "zerp__Purchase Invoice", invoiceId);
            }
        }
    }
});

/**
 * Updates the payment status of an invoice based on all submitted payment entries
 * that reference it. This function calculates the total allocated amount from all
 * submitted payment entries and updates the invoice's payment_status accordingly.
 */
async function updateInvoicePaymentAmount(
    doctype: "zerp__Sales Invoice" | "zerp__Purchase Invoice", 
    invoiceId: string
) {
    // Get the invoice
    const invoice = await $zodula.doctype(doctype).get(invoiceId);
    if (!invoice) {
        throw new Error(`Invoice ${doctype} ${invoiceId} not found`);
    }
    
    const totalAmount = parseFloat(String(invoice.total_amount || 0)) || 0;
    if (totalAmount === 0) {
        // If invoice has no amount, set status to Paid
        await $zodula.doctype(doctype).update(invoiceId, {
            payment_status: "Paid"
        } as any);
        return;
    }
    
    // Get all payment entry references that reference this invoice
    const references = await $zodula.doctype("zerp__Payment Entry Reference")
        .select()
        .where("reference_type", "=", doctype)
        .where("reference_id", "=", invoiceId);
    
    // Get all payment entries and sum their allocated amounts
    // Only count allocated amounts from submitted payment entries
    let totalAllocated = 0;
    for (const ref of references.docs) {
        const paymentEntryId = ref.payment_entry;
        if (paymentEntryId) {
            const paymentEntry = await $zodula.doctype("zerp__Payment Entry").get(paymentEntryId);
            if (paymentEntry && paymentEntry.doc_status === 1) { // Only count submitted payment entries
                const allocatedAmount = parseFloat(String(ref.allocated_amount || 0)) || 0;
                totalAllocated += allocatedAmount;
            }
        }
    }
    
    const remainingAmount = totalAmount - totalAllocated;
    
    // Update payment_status based on remaining amount
    let paymentStatus: "Unpaid" | "Partially Paid" | "Paid" = "Unpaid";
    if (remainingAmount <= 0.01) { // Allow small floating point differences
        paymentStatus = "Paid";
    } else if (remainingAmount < totalAmount) {
        paymentStatus = "Partially Paid";
    }
    
    // Update the invoice with the new payment_status
    await $zodula.doctype(doctype).update(invoiceId, {
        payment_status: paymentStatus
    } as any);
}