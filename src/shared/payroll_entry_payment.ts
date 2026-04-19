/**
 * Updates Payroll Entry payment_status from submitted payroll payment Journal Entries
 * linked to the same Payroll Entry.
 */
export async function updatePayrollEntryPaymentStatusFromPaymentJournals(payrollEntryId: string) {
    const peId = String(payrollEntryId ?? "").trim();
    if (!peId) return;

    const doc = await $zodula.doctype("Payroll Entry").get(peId);
    if (!doc) return;

    const totalAmount = Math.abs(parseFloat(String((doc as any).total_net_pay || 0)) || 0);

    const jes = await $zodula
        .doctype("Journal Entry")
        .select()
        .where("reference_doctype", "=", "Payroll Entry")
        .where("reference_id", "=", peId)
        .limit(200);

    let totalPaid = 0;
    for (const je of jes.docs ?? []) {
        if (String((je as any).doc_status ?? "") !== "Submitted") continue;
        const desc = String((je as any).description ?? "").trim();
        if (!desc.startsWith("Payroll bank payment ")) continue;
        totalPaid += Math.abs(parseFloat(String((je as any).total_debit || 0)) || 0);
    }

    if (totalAmount <= 0.01) {
        await $zodula.doctype("Payroll Entry").update(peId, {
            payment_status: "Paid",
        } as any);
        return;
    }

    let paymentStatus: "Unpaid" | "Partially Paid" | "Paid" = "Unpaid";
    if (totalPaid >= totalAmount - 0.01) {
        paymentStatus = "Paid";
    } else if (totalPaid > 0.01) {
        paymentStatus = "Partially Paid";
    }

    await $zodula.doctype("Payroll Entry").update(peId, {
        payment_status: paymentStatus,
    } as any);
}
