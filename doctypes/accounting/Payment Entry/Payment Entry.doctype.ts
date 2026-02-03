export default $doctype<"zerp__Payment Entry">({
    customer: {
        type: "Reference",
        label: "Customer",
        reference: "zerp__Customer",
        required: 0,
        in_list_view: 1
    },
    supplier: {
        type: "Reference",
        label: "Supplier",
        reference: "zerp__Supplier",
        required: 0,
        in_list_view: 1
    },
    payment_type: {
        type: "Select",
        label: "Payment Type",
        options: "Receive\nPay",
        required: 1,
        in_list_view: 1
    },
    payment_date: {
        type: "Date",
        label: "Payment Date",
        required: 1,
        in_list_view: 1
    },
    amount: {
        type: "Currency",
        label: "Amount",
        required: 1,
        in_list_view: 1
    },
    payment_method: {
        type: "Select",
        label: "Payment Method",
        options: "Cash\nBank\nCard\nTransfer",
        required: 1,
        in_list_view: 1
    },
    reference_no: {
        type: "Text",
        label: "Reference No"
    },
    sales_invoices_references: {
        type: "Reference Table",
        label: "Sales Invoice References",
        reference: "zerp__Sales Invoice Reference",
        required: 0
    },
    purchase_invoice_references: {
        type: "Reference Table",
        label: "Purchase Invoice References",
        reference: "zerp__Purchase Invoice Reference",
        required: 0
    }
}, {
    label: "Payment Entry",
    naming_series: "PE-{{payment_date}}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "customer\nsupplier\npayment_type\nreference_no",
    tabs: JSON.stringify([
        {
            type: "Tab", 
            label: "Main", 
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "payment_type", align: "left" },
                    { type: "field", value: "customer", align: "left" },
                    { type: "field", value: "supplier", align: "left" },
                    { type: "field", value: "payment_date", align: "left" }
                ],
                { type: "section", value: "Amount", align: "left" },
                [
                    { type: "field", value: "amount", align: "left" }
                ],
                { type: "section", value: "Payment Details", align: "left" },
                [
                    { type: "field", value: "payment_method", align: "left" },
                    { type: "field", value: "reference_no", align: "left" }
                ],
                { type: "section", value: "Invoice References", align: "left" },
                [
                    { type: "field", value: "sales_invoices_references", align: "left" },
                    { type: "field", value: "purchase_invoice_references", align: "left" }
                ]
            ]
        }
    ])
})
.on("after_submit", async ({ doc }) => {
    // Get all sales invoice references
    if (doc.sales_invoices_references && Array.isArray(doc.sales_invoices_references)) {
        const invoiceIds = new Set<string>();
        for (const ref of doc.sales_invoices_references) {
            if (ref.sales_invoice) {
                invoiceIds.add(ref.sales_invoice);
            }
        }
        for (const invoiceId of invoiceIds) {
            await updateInvoicePaymentAmount("zerp__Sales Invoice", invoiceId);
        }
    }
    
    // Get all purchase invoice references
    if (doc.purchase_invoice_references && Array.isArray(doc.purchase_invoice_references)) {
        const invoiceIds = new Set<string>();
        for (const ref of doc.purchase_invoice_references) {
            if (ref.purchase_invoice) {
                invoiceIds.add(ref.purchase_invoice);
            }
        }
        for (const invoiceId of invoiceIds) {
            await updateInvoicePaymentAmount("zerp__Purchase Invoice", invoiceId);
        }
    }
})
.on("after_cancel", async ({ doc }) => {
    // Get all sales invoice references from the cancelled doc
    if (doc.sales_invoices_references && Array.isArray(doc.sales_invoices_references)) {
        const invoiceIds = new Set<string>();
        for (const ref of doc.sales_invoices_references) {
            if (ref.sales_invoice) {
                invoiceIds.add(ref.sales_invoice);
            }
        }
        for (const invoiceId of invoiceIds) {
            await updateInvoicePaymentAmount("zerp__Sales Invoice", invoiceId);
        }
    }
    
    // Get all purchase invoice references from the cancelled doc
    if (doc.purchase_invoice_references && Array.isArray(doc.purchase_invoice_references)) {
        const invoiceIds = new Set<string>();
        for (const ref of doc.purchase_invoice_references) {
            if (ref.purchase_invoice) {
                invoiceIds.add(ref.purchase_invoice);
            }
        }
        for (const invoiceId of invoiceIds) {
            await updateInvoicePaymentAmount("zerp__Purchase Invoice", invoiceId);
        }
    }
});

async function updateInvoicePaymentAmount(
    doctype: "zerp__Sales Invoice" | "zerp__Purchase Invoice", 
    invoiceId: string
) {
    // Get the invoice
    const invoice = await $zodula.doctype(doctype).get(invoiceId);
    if (!invoice) return;
    
    const totalAmount = parseFloat(String(invoice.total_amount || 0)) || 0;
    
    // Calculate total allocated amount from all payment entries
    const referenceDoctype = doctype === "zerp__Sales Invoice" 
        ? "zerp__Sales Invoice Reference" 
        : "zerp__Purchase Invoice Reference";
    const invoiceField = doctype === "zerp__Sales Invoice" 
        ? "sales_invoice" 
        : "purchase_invoice";
    
    // Get all payment entries that reference this invoice
    const references = await $zodula.doctype(referenceDoctype as any)
        .select()
        .where(invoiceField as any, "=", invoiceId)
        .limit(10000);
    
    // Get all payment entries and sum their allocated amounts
    let totalAllocated = 0;
    for (const ref of references.docs) {
        const paymentEntryId = ref.payment_entry;
        if (paymentEntryId) {
            const paymentEntry = await $zodula.doctype("zerp__Payment Entry").get(paymentEntryId);
            if (paymentEntry && paymentEntry.doc_status === 1) { // Only count submitted payment entries
                const allocatedAmount = parseFloat(ref.allocated_amount) || 0;
                totalAllocated += allocatedAmount;
            }
        }
    }
    
    const paymentAmount = totalAmount - totalAllocated;
    
    // Update payment_status based on payment_amount
    let paymentStatus: "Unpaid" | "Partially Paid" | "Paid" = "Unpaid";
    if (paymentAmount <= 0) {
        paymentStatus = "Paid";
    } else if (paymentAmount < totalAmount) {
        paymentStatus = "Partially Paid";
    }
    
    // Update the invoice
    await $zodula.doctype(doctype).update(invoiceId, {
        payment_amount: paymentAmount,
        payment_status: paymentStatus
    });
}