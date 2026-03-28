import { ZodulaDoctypeHelper } from "@/zodula/server/zodula/doc/helper";
import { loader } from "@/zodula/server/loader";

export default $doctype<"Payment Entry">({
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
    total_allocated: {
        type: "Currency",
        label: "Total Allocate",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    unallocated_amount: {
        type: "Currency",
        label: "Unallocate Amount",
        required: 0,
        in_list_view: 1
    },
    total_amount: {
        type: "Currency",
        label: "Total Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1
    },
    total_taxes_and_charges: {
        type: "Currency",
        label: "WHT Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1
        ,
        hidden: 1,
    },
    wht_rate: {
        type: "Float",
        label: "WHT Rate",
        required: 0,
        in_list_view: 1,
    },
    wht_amount: {
        type: "Currency",
        label: "WHT Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1,
    },
    paid_amount: {
        type: "Currency",
        label: "Paid Amount",
        required: 1,
        in_list_view: 1
    },
    to_paid_amount: {
        type: "Currency",
        label: "To Paid Amount",
        required: 1,
        in_list_view: 1,
        readonly: 1,
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
    from_request: {
        type: "Reference",
        label: "From Request",
        reference: "Payment Entry Request",
        required: 0,
        in_list_view: 0,
        readonly: 1,
        depends_on: "!!doc.form_request"
    },
    references: {
        type: "Reference Table",
        label: "References",
        reference: "Payment Entry Reference",
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
    is_submittable: 1,
    track_changes: 1,
    naming_series: "PE-{YYYY}-{MM}-{DD}-{#####}",
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
                    { type: "field", value: "party", align: "left" }
                ],
                { type: "section", value: "Amounts", align: "left" },
                [
                    { type: "field", value: "total_allocated", align: "left" },
                    { type: "field", value: "unallocated_amount", align: "left" },
                    { type: "field", value: "total_amount", align: "left" },
                    { type: "field", value: "wht_rate", align: "left" },
                    { type: "field", value: "wht_amount", align: "left" },
                ],
                [
                    { type: "field", value: "to_paid_amount", align: "left" },
                    { type: "field", value: "paid_amount", align: "left" },
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
                [
                    { type: "field", value: "from_request", align: "left" }
                ],
                { type: "section", value: "Allocations", align: "left" },
                [{ type: "field", value: "references", align: "left" }],
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

        // Validate document using validateDoc function
        const doctypeSchema = loader.from("doctype").get("Payment Entry").schema;
        ZodulaDoctypeHelper.validateDoc(doc, doctypeSchema, false);

        // Calculate total_allocated from references (sum of allocate_amount)
        const docAny = doc as any;
        let totalAllocated = 0;
        if (doc.references && Array.isArray(doc.references)) {
            for (const ref of doc.references) {
                totalAllocated += await getReferenceSignedAllocation(doc.payment_type as any, ref as any);
            }
        }
        docAny.total_allocated = totalAllocated;

        const unallocatedAmount = parseFloat(String(docAny.unallocated_amount || 0)) || 0;
        const totalAmount = totalAllocated + unallocatedAmount;
        docAny.total_amount = totalAmount;

        const whtRate = parseFloat(String(docAny.wht_rate || 0)) || 0;
        const whtAmount = (totalAmount * whtRate) / 100;
        docAny.wht_amount = whtAmount;
        docAny.total_taxes_and_charges = whtAmount;
    })
    .on("before_save", async ({ doc }) => {
        const num = (v: any) => parseFloat(String(v ?? 0)) || 0;
        const docAny = doc as any;
        let totalAllocated = 0;
        if (Array.isArray(docAny.references)) {
            for (const ref of docAny.references) {
                totalAllocated += await getReferenceSignedAllocation(doc.payment_type as any, ref as any);
            }
        }
        const unallocatedAmount = num(docAny.unallocated_amount);
        const whtRate = num(docAny.wht_rate);
        const totalAmount = totalAllocated + unallocatedAmount;
        const whtAmount = (totalAmount * whtRate) / 100;

        docAny.total_allocated = totalAllocated;
        docAny.total_amount = totalAmount;
        docAny.wht_amount = whtAmount;
        docAny.total_taxes_and_charges = whtAmount;

        const paidAmount = num(docAny.paid_amount);
        const paidDiff = Math.abs(totalAmount - paidAmount);
        if (paidDiff > 0.0001) {
            throw new Error(
                `Invalid amount balance: paid_amount must equal total_amount ` +
                `(total_allocate + unallocate_amount). ` +
                `Expected ${totalAmount.toFixed(4)} but got ${paidAmount.toFixed(4)}.`
            );
        }

        const expectedToPaid = totalAmount - whtAmount;
        const toPaidAmount = num(docAny.to_paid_amount);
        const diff = Math.abs(expectedToPaid - toPaidAmount);
        if (diff > 0.0001) {
            throw new Error(
                `Invalid amount balance: net paid (to_paid_amount) must equal total_amount - wht_amount. ` +
                `Expected ${expectedToPaid.toFixed(4)} but got ${toPaidAmount.toFixed(4)}.`
            );
        }
    })
    .on("after_submit", async ({ doc }) => {
        const docAny = doc as any;
        const amount = parseFloat(String(docAny.to_paid_amount || 0)) || 0;
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
                party: doc.party,
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
                party: doc.party,
            } as any);
        }

        // Manage payment status for each referenced document
        if (doc.references && Array.isArray(doc.references)) {
            const invoiceMap = new Map<string, Set<string>>();
            for (const ref of doc.references) {
                const refType = (ref as any).reference_type;
                const invoiceId = (ref as any).reference_id;
                if (refType && invoiceId && (refType === "Sales Invoice" || refType === "Purchase Invoice" || refType === "Employee Advance" || refType === "Expense Claim" || refType === "Salary Slip")) {
                    if (!invoiceMap.has(refType)) {
                        invoiceMap.set(refType, new Set());
                    }
                    invoiceMap.get(refType)!.add(invoiceId);
                }
            }
            // Update payment status for each referenced document
            for (const [dt, docIds] of invoiceMap.entries()) {
                for (const docId of docIds) {
                    await updatePaymentStatusForReference(dt as "Sales Invoice" | "Purchase Invoice" | "Employee Advance" | "Expense Claim" | "Salary Slip", docId);
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

        // Recalculate payment_status for each referenced document (cancelled PE no longer counts as submitted)
        if (doc.references && Array.isArray(doc.references)) {
            for (const ref of doc.references) {
                const refType = (ref as any).reference_type;
                const referenceId = (ref as any).reference_id;
                if (referenceId && refType && (refType === "Sales Invoice" || refType === "Purchase Invoice" || refType === "Employee Advance" || refType === "Expense Claim" || refType === "Salary Slip")) {
                    await updatePaymentStatusForReference(refType as "Sales Invoice" | "Purchase Invoice" | "Employee Advance" | "Expense Claim" | "Salary Slip", referenceId);
                }
            }
        }
    });

/**
 * Updates the payment status of a reference document.
 * based on all submitted payment entries that reference it.
 */
async function updatePaymentStatusForReference(
    doctype: "Sales Invoice" | "Purchase Invoice" | "Employee Advance" | "Expense Claim" | "Salary Slip",
    docId: string
) {
    const doc = await $zodula.doctype(doctype as any).get(docId);
    if (!doc) {
        throw new Error(`${doctype} ${docId} not found`);
    }

    const totalAmountRaw =
        doctype === "Employee Advance" || doctype === "Expense Claim"
            ? parseFloat(String((doc as any).amount || 0)) || 0
            : doctype === "Salary Slip"
            ? parseFloat(String((doc as any).net_pay || 0)) || 0
            : parseFloat(String((doc as any).grand_total || 0)) || 0;
    const totalAmount = Math.abs(totalAmountRaw);
    if (totalAmount === 0) {
        await $zodula.doctype(doctype as any).update(docId, {
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
                const allocatedAmount = Math.abs(parseFloat(String((ref as any).allocate_amount || 0)) || 0);
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

    await $zodula.doctype(doctype as any).update(docId, {
        payment_status: paymentStatus
    } as any);
}

async function getReferenceSignedAllocation(
    paymentType: string | undefined,
    ref: { reference_type?: string; reference_id?: string; allocate_amount?: number }
) {
    const allocateAmount = Math.abs(parseFloat(String(ref?.allocate_amount || 0)) || 0);
    if (allocateAmount === 0) return 0;
    const refType = String(ref?.reference_type ?? "");
    const refId = String(ref?.reference_id ?? "");
    if (refType !== "Sales Invoice" || !refId) return allocateAmount;
    const salesInvoice = await $zodula.doctype("Sales Invoice").get(refId);
    if (!salesInvoice) return allocateAmount;
    const isCreditNote = Number((salesInvoice as any).is_credit_note ?? 0) === 1;
    if (!isCreditNote) return allocateAmount;
    return String(paymentType ?? "") === "Receive" ? -allocateAmount : allocateAmount;
}