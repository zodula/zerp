import { ZodulaDoctypeHelper } from "@/zodula/server/zodula/doc/helper";
import { loader } from "@/zodula/server/loader";

export default $doctype<"Payment Entry">({
    naming_series: {
        type: "Select",
        label: "Naming Series",
        options: "\nRV-{YYYY}-{MM}-{DD}-{#####}\nPV-{YYYY}-{MM}-{DD}-{#####}\nTV-{YYYY}-{MM}-{DD}-{#####}",
        required: 0,
        readonly: 1,
        hidden: 1,
        in_list_view: 0
    },
    payment_type: {
        type: "Select",
        label: "Payment Type",
        options: "Receive\nPay\nTransfer",
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
    party_type: {
        type: "Reference",
        label: "Party Type",
        reference: "Doctype",
        filters: JSON.stringify([["name", "IN", ["Customer", "Supplier", "Employee"]]]),
        in_list_view: 1
    },
    party: {
        type: "Reference",
        label: "Party",
        reference: "{{party_type}}",
        in_list_view: 1
    },
    party_name: {
        type: "Text",
        label: "Party Name",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    total_allocated: {
        type: "Currency",
        label: "Total Allocated",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    unallocated_amount: {
        type: "Currency",
        label: "Unallocated Amount",
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
    total_grand_total: {
        type: "Currency",
        label: "Total Grand Total",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    paid_amount: {
        type: "Currency",
        label: "Paid Amount",
        required: 1,
        in_list_view: 1
    },
    payment_method: {
        type: "Select",
        label: "Payment Method",
        options: "Cash\nBank\nCard\nCheque",
        required: 1,
        in_list_view: 1
    },
    account_paid_to: {
        type: "Reference",
        label: "Account Paid To",
        reference: "Account",
        required: 0,
        in_list_view: 1
    },
    account_paid_from: {
        type: "Reference",
        label: "Account Paid From",
        reference: "Account",
        required: 0,
        in_list_view: 1
    },
    reference_no: {
        type: "Text",
        label: "Reference No"
    },
    reference_date: {
        type: "Date",
        label: "Reference Date",
        required: 0,
        in_list_view: 0
    },
    references: {
        type: "Reference Table",
        label: "References",
        reference: "Payment Entry Reference",
        required: 0,
        depends_on: "doc.payment_type == \"Receive\" || doc.payment_type == \"Pay\""
    },
    tax_and_charges: {
        type: "Reference Table",
        label: "Tax and Charges",
        reference: "Tax and Charges",
        required: 0,
        depends_on: "doc.payment_type == \"Receive\" || doc.payment_type == \"Pay\""
    },
    payer_signature: {
        type: "Signature",
        label: "Payer Signature",
        allow_on_submit: 1,
        required: 0,
        in_list_view: 0
    },
    receiver_signature: {
        type: "Signature",
        label: "Receiver Signature",
        allow_on_submit: 1,
        required: 0,
        in_list_view: 0
    },
    approver_signature: {
        type: "Signature",
        label: "Approver Signature",
        allow_on_submit: 1,
        required: 0,
        in_list_view: 0
    }
}, {
    label: "Payment Entry",
    naming_series: "field:naming_series",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "party\npayment_type\nreference_no",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Header", align: "left" },
                [
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "payment_type", align: "left" }
                ],
                { type: "section", value: "Party", align: "left" },
                [
                    { type: "field", value: "party_type", align: "left" },
                    { type: "field", value: "party", align: "left" },
                    { type: "field", value: "party_name", align: "left" }
                ],
                { type: "section", value: "Amounts", align: "left" },
                [
                    { type: "field", value: "total_allocated", align: "left" },
                    { type: "field", value: "unallocated_amount", align: "left" },
                    { type: "field", value: "total_taxes_and_charges", align: "left" },
                    { type: "field", value: "total_grand_total", align: "left" },
                    { type: "field", value: "paid_amount", align: "left" }
                ],
                { type: "section", value: "Payment", align: "left" },
                [
                    { type: "field", value: "payment_method", align: "left" },
                    { type: "field", value: "account_paid_from", align: "left" },
                    { type: "field", value: "account_paid_to", align: "left" },
                ],
                [
                    { type: "field", value: "reference_no", align: "left" },
                    { type: "field", value: "reference_date", align: "left" }
                ],
                { type: "section", value: "Allocations", align: "left" },
                [{ type: "field", value: "references", align: "left" }],
                { type: "section", value: "Tax and Charges", align: "left" },
                [{ type: "field", value: "tax_and_charges", align: "left" }],
                { type: "section", value: "Signatures", align: "left" },
                [
                    { type: "field", value: "payer_signature", align: "left" },
                    { type: "field", value: "receiver_signature", align: "left" },
                    { type: "field", value: "approver_signature", align: "left" }
                ]
            ]
        }
    ])
})
.on("before_change", async ({ doc }) => {
    // Sync naming_series from payment_type (Receive=RV, Pay=PV, Transfer=TV)
    const seriesByType: Record<string, string> = {
        Receive: "RV-{YYYY}-{MM}-{DD}-{#####}",
        Pay: "PV-{YYYY}-{MM}-{DD}-{#####}",
        Transfer: "TV-{YYYY}-{MM}-{DD}-{#####}"
    };
    const series = doc.payment_type ? seriesByType[doc.payment_type as string] : undefined;
    if (series) {
        (doc as { naming_series?: string }).naming_series = series;
    }

    // Validate document using validateDoc function
    const doctypeSchema = loader.from("doctype").get("Payment Entry").schema;
    ZodulaDoctypeHelper.validateDoc(doc, doctypeSchema, false);
    
    // Calculate total_allocated from references (sum of allocate_amount)
    let totalAllocated = 0;
    if (doc.references && Array.isArray(doc.references)) {
        for (const ref of doc.references) {
            const allocateAmount = parseFloat(String((ref as any).allocate_amount || 0)) || 0;
            totalAllocated += allocateAmount;
        }
    }
    doc.total_allocated = totalAllocated;

    // Calculate taxes and charges
    const taxRows = doc.tax_and_charges && Array.isArray(doc.tax_and_charges) ? doc.tax_and_charges : [];
    
    // Sort by idx to ensure proper order
    const sortedTaxRows = [...taxRows].sort((a: any, b: any) => {
        const idxA = (a as any).idx || 0;
        const idxB = (b as any).idx || 0;
        return idxA - idxB;
    });

    let runningTotal = totalAllocated;
    let totalTaxesAndCharges = 0;

    for (let i = 0; i < sortedTaxRows.length; i++) {
        const taxRow = sortedTaxRows[i] as any;
        const chargeType = taxRow.charge_type || "Actual";
        const rate = parseFloat(String(taxRow.rate || 0)) || 0;
        let taxAmount = 0;

        if (chargeType === "Actual") {
            taxAmount = parseFloat(String(taxRow.tax_amount || 0)) || 0;
        } else if (chargeType === "On Net Total") {
            taxAmount = (totalAllocated * rate) / 100;
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
    doc.total_grand_total = runningTotal;

    const paidAmount = parseFloat(String(doc.paid_amount || 0)) || 0;
    doc.unallocated_amount = paidAmount - totalAllocated;
})
.on("after_submit", async ({ doc }) => {
    // General Ledger: credit account_paid_from, debit account_paid_to
    const amount = parseFloat(String(doc.paid_amount || 0)) || 0;
    const accountPaidTo = doc.account_paid_to as string;
    const accountPaidFrom = doc.account_paid_from as string;
    const description = `Payment Entry ${doc.id}${doc.reference_no ? ` - Ref: ${doc.reference_no}` : ''}`;

    if (accountPaidFrom) {
        await $zodula.doctype("General Ledger").insert({
            posting_date: doc.posting_date,
            account: accountPaidFrom,
            debit_amount: 0,
            credit_amount: amount,
            reference_doctype: "Payment Entry",
            reference_id: doc.id,
            description: description,
            party_type: doc.party_type,
            party: doc.party
        } as any);
    }
    if (accountPaidTo) {
        await $zodula.doctype("General Ledger").insert({
            posting_date: doc.posting_date,
            account: accountPaidTo,
            debit_amount: amount,
            credit_amount: 0,
            reference_doctype: "Payment Entry",
            reference_id: doc.id,
            description: description,
            party_type: doc.party_type,
            party: doc.party
        } as any);
    }

    // Manage payment status for each referenced invoice document
    if (doc.references && Array.isArray(doc.references)) {
        const invoiceMap = new Map<string, Set<string>>();
        for (const ref of doc.references) {
            const refType = (ref as any).reference_type;
            const invoiceId = (ref as any).reference_id;
            if (refType && invoiceId && (refType === "Sales Invoice" || refType === "Purchase Invoice")) {
                if (!invoiceMap.has(refType)) {
                    invoiceMap.set(refType, new Set());
                }
                invoiceMap.get(refType)!.add(invoiceId);
            }
        }
        // Update payment status for each referenced document
        for (const [dt, docIds] of invoiceMap.entries()) {
            for (const docId of docIds) {
                await updatePaymentStatusForReference(dt as "Sales Invoice" | "Purchase Invoice", docId);
            }
        }
    }
})
.on("after_cancel", async ({ doc }) => {
    // Delete General Ledger entries for Payment Entry instead of creating reversed entries
    // Find all GL entries that reference this Payment Entry
    const glEntries = await $zodula.doctype("General Ledger")
        .select()
        .where("reference_doctype", "=", "Payment Entry")
        .where("reference_id", "=", doc.id);
    
    // Delete each GL entry (after_delete hook will automatically update account balances)
    for (const glEntry of glEntries.docs) {
        await $zodula.doctype("General Ledger").delete(glEntry.id);
    }
    
    // Recalculate payment_status for each referenced invoice (cancelled PE no longer counts as submitted)
    if (doc.references && Array.isArray(doc.references)) {
        for (const ref of doc.references) {
            const refType = (ref as any).reference_type;
            const referenceId = (ref as any).reference_id;
            if (referenceId && refType && (refType === "Sales Invoice" || refType === "Purchase Invoice")) {
                await updatePaymentStatusForReference(refType as "Sales Invoice" | "Purchase Invoice", referenceId);
            }
        }
    }
});

/**
 * Updates the payment status of a reference document (Sales Invoice or Purchase Invoice)
 * based on all submitted payment entries that reference it.
 */
async function updatePaymentStatusForReference(
    doctype: "Sales Invoice" | "Purchase Invoice",
    docId: string
) {
    const doc = await $zodula.doctype(doctype).get(docId);
    if (!doc) {
        throw new Error(`${doctype} ${docId} not found`);
    }

    const totalAmount = parseFloat(String((doc as any).grand_total || 0)) || 0;
    if (totalAmount === 0) {
        await $zodula.doctype(doctype).update(docId, {
            payment_status: "Paid"
        } as any);
        return;
    }

    const references = await $zodula.doctype("Payment Entry Reference")
        .select()
        .where("reference_id", "=", docId);

    let totalAllocated = 0;
    for (const ref of references.docs) {
        const paymentEntryId = ref.parentid;
        const refType = ref.reference_type;
        if (paymentEntryId && refType === doctype) {
            const paymentEntry = await $zodula.doctype("Payment Entry").get(paymentEntryId);
            if (paymentEntry && paymentEntry.doc_status === "Submitted") {
                const allocatedAmount = parseFloat(String((ref as any).allocate_amount || 0)) || 0;
                totalAllocated += allocatedAmount;
            }
        }
    }

    const outstandingAmount = totalAmount - totalAllocated;
    let paymentStatus: "Unpaid" | "Partially Paid" | "Paid" = "Unpaid";
    if (outstandingAmount <= 0.01) {
        paymentStatus = "Paid";
    } else if (outstandingAmount < totalAmount) {
        paymentStatus = "Partially Paid";
    }

    await $zodula.doctype(doctype).update(docId, {
        payment_status: paymentStatus
    } as any);
}