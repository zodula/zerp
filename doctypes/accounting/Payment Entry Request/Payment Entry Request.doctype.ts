import {
    PARTY_BY_PAYMENT,
    REFERENCE_TYPES_BY_PARTY,
    REFERENCE_TYPE_PARTY_FIELD,
} from "@/zerp/src/shared/payment_entry";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

type RequestReferenceRow = {
    reference_type?: string;
    reference_id?: string;
    allocate_amount?: number;
    outstanding_amount?: number;
};

export default $doctype<"Payment Entry Request">({
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
        required: 1,
        in_list_view: 1
    },
    account_paid_from: {
        type: "Reference",
        label: "Account Paid From",
        reference: "Account",
        required: 1,
        in_list_view: 1
    },
    reference_no: {
        type: "Text",
        label: "Reference No"
    },
    reference_date: {
        type: "Date",
        label: "Reference Date",
        required: 0
    },
    append_sales_invoice_from_delivery_note: {
        type: "Scanner",
        label: "Append Sales Invoice From Delivery Note",
        required: 0,
        depends_on: "doc.payment_type == \"Receive\"",
    },
    references: {
        type: "Reference Table",
        label: "References",
        reference: "Payment Entry Request Reference",
        required: 1
    },
    total_allocated: {
        type: "Currency",
        label: "Total Allocated",
        readonly: 1,
        in_list_view: 1
    }
}, {
    label: "Payment Entry Request",
    naming_series: "PER-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "payment_type\nparty_type\nreference_no",
    additional_connections: JSON.stringify([{
        doctype: "Payment Entry",
        filters: [["from_request", "=", "{{id}}"]],
        field: "from_request",
    }]),
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Header", align: "left" },
                [
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "payment_type", align: "left" },
                    { type: "field", value: "party_type", align: "left" },
                ],
                [
                    { type: "field", value: "payment_method", align: "left" },
                    { type: "field", value: "account_paid_from", align: "left" },
                    { type: "field", value: "account_paid_to", align: "left" },
                ],
                [
                    { type: "field", value: "reference_no", align: "left" },
                    { type: "field", value: "reference_date", align: "left" },
                    { type: "field", value: "total_allocated", align: "left" },
                ],
                [
                    { type: "field", value: "append_sales_invoice_from_delivery_note", align: "left" }
                ],
                { type: "section", value: "References", align: "left" },
                [
                    { type: "field", value: "references", align: "left" }
                ]
            ]
        }
    ])
})
    .on("before_change", async ({ doc }) => {
        const refs = (doc.references ?? []) as RequestReferenceRow[];
        const totalAllocated = refs.reduce((sum, row) => sum + num(row?.allocate_amount), 0);
        (doc as any).total_allocated = totalAllocated;
    })
    .on("before_submit", async ({ doc }) => {
        const paymentType = String(doc.payment_type ?? "").trim();
        const partyType = String(doc.party_type ?? "").trim();
        const allowedPartyTypes = PARTY_BY_PAYMENT[paymentType] ?? [];
        if (!allowedPartyTypes.includes(partyType)) {
            throw new Error(`Party Type ${partyType || "(empty)"} is not valid for payment type ${paymentType || "(empty)"}`);
        }

        const refs = (doc.references ?? []) as RequestReferenceRow[];
        if (refs.length === 0) {
            throw new Error("Payment Entry Request must have at least one reference row.");
        }

        const allowedReferenceTypes = REFERENCE_TYPES_BY_PARTY[partyType] ?? [];
        for (const [index, row] of refs.entries()) {
            const rowNo = index + 1;
            const referenceType = String(row.reference_type ?? "").trim();
            const referenceId = String(row.reference_id ?? "").trim();
            const allocateAmount = num(row.allocate_amount);

            if (!referenceType) throw new Error(`Row ${rowNo}: Reference Type is required.`);
            if (!referenceId) throw new Error(`Row ${rowNo}: Reference ID is required.`);
            if (allocateAmount <= 0) throw new Error(`Row ${rowNo}: Allocate Amount must be greater than 0.`);
            if (!allowedReferenceTypes.includes(referenceType)) {
                throw new Error(`Row ${rowNo}: Reference Type ${referenceType} is not allowed for Party Type ${partyType}.`);
            }

            const partyField = REFERENCE_TYPE_PARTY_FIELD[referenceType];
            if (!partyField) {
                throw new Error(`Row ${rowNo}: Missing party mapping for reference type ${referenceType}.`);
            }
            const baseDoc = await $zodula.doctype(referenceType as any).get(referenceId);
            if (!baseDoc) {
                throw new Error(`Row ${rowNo}: ${referenceType} ${referenceId} not found.`);
            }
            const rowParty = String((baseDoc as any)[partyField] ?? "").trim();
            if (!rowParty) throw new Error(`Row ${rowNo}: Could not detect party from ${referenceType} ${referenceId}.`);
        }
    })
    .on("after_submit", async ({ doc }) => {
        const refs = (doc.references ?? []) as RequestReferenceRow[];
        const createdPaymentEntries: string[] = [];

        try {
            for (const row of refs) {
                const allocateAmount = num(row.allocate_amount);
                const referenceType = String(row.reference_type ?? "").trim();
                const referenceId = String(row.reference_id ?? "").trim();
                const partyField = REFERENCE_TYPE_PARTY_FIELD[referenceType];
                if (!partyField) throw new Error(`Missing party mapping for reference type ${referenceType}.`);
                const baseDoc = await $zodula.doctype(referenceType as any).get(referenceId);
                if (!baseDoc) throw new Error(`${referenceType} ${referenceId} not found.`);
                const party = String((baseDoc as any)[partyField] ?? "").trim();
                if (!party) throw new Error(`Could not detect party from ${referenceType} ${referenceId}.`);

                const payload: any = {
                    payment_type: doc.payment_type,
                    posting_date: doc.posting_date,
                    party_type: doc.party_type,
                    party,
                    payment_method: doc.payment_method,
                    account_paid_from: doc.account_paid_from,
                    account_paid_to: doc.account_paid_to,
                    reference_no: doc.reference_no,
                    reference_date: doc.reference_date,
                    paid_amount: allocateAmount,
                    total_allocated: allocateAmount,
                    total_amount: allocateAmount,
                    wht_amount: 0,
                    wht_rate: 0,
                    to_paid_amount: allocateAmount,
                    from_request: doc.id,
                    references: [
                        {
                            reference_type: row.reference_type,
                            reference_id: row.reference_id,
                            outstanding_amount: row.outstanding_amount,
                            allocate_amount: allocateAmount,
                        }
                    ],
                };

                const paymentEntry = await $zodula.doctype("Payment Entry").insert(payload);
                createdPaymentEntries.push(paymentEntry.id);
                await $zodula.doctype("Payment Entry").submit(paymentEntry.id);
            }
        } catch (err) {
            for (const paymentEntryId of createdPaymentEntries.reverse()) {
                try {
                    const createdDoc = await $zodula.doctype("Payment Entry").get(paymentEntryId);
                    if ((createdDoc as any)?.doc_status === "Submitted") {
                        await $zodula.doctype("Payment Entry").cancel(paymentEntryId);
                    } else {
                        await $zodula.doctype("Payment Entry").delete(paymentEntryId);
                    }
                } catch {
                    // Best-effort rollback of already generated rows.
                }
            }
            throw err;
        }
    });
