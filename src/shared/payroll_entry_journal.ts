const num = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

/**
 * Creates or replaces the accrual Journal Entry for a submitted Payroll Entry
 * from all submitted Salary Slips linked via payroll_entry.
 */
export async function ensurePayrollEntryAccrualJournal(payrollEntryId: string) {
    const peId = String(payrollEntryId ?? "").trim();
    if (!peId) return;

    const pe = (await $zodula.doctype("Payroll Entry").get(peId)) as any;
    if (!pe || String(pe.doc_status ?? "") !== "Submitted") return;

    const slipsRes = await $zodula
        .doctype("Salary Slip")
        .select()
        .where("payroll_entry", "=", peId)
        .limit(500);
    const slips = (slipsRes.docs ?? []) as any[];
    const submitted = slips.filter((s) => String(s.doc_status ?? "") === "Submitted");
    let totalEarnings = 0;
    for (const slip of submitted) {
        totalEarnings += num(slip.total_earnings);
    }

    const linkedJe = await $zodula
        .doctype("Journal Entry")
        .select()
        .where("reference_doctype", "=", "Payroll Entry")
        .where("reference_id", "=", peId)
        .limit(50);
    const existingJe = (linkedJe.docs ?? []).find((d: any) => {
        const desc = String((d as any).description ?? "").trim();
        return desc === `Payroll Entry ${peId}`;
    }) as any;

    if (existingJe?.id) {
        const st = String(existingJe.doc_status ?? "");
        if (st === "Submitted") {
            await $zodula.doctype("Journal Entry").cancel(existingJe.id);
        } else {
            await $zodula.doctype("Journal Entry").delete(existingJe.id);
        }
    }

    if (totalEarnings <= 0.02) return;

    const payrollSetting = await $zodula.doctype("Payroll Setting").select().limit(1).then((r) => r.docs[0] as any);
    const erp = await $zodula.doctype("ERP Setting").select().limit(1).then((r) => r.docs[0] as any);
    const expense = String(payrollSetting?.default_salary_expense_account ?? "").trim();
    const payable =
        String(pe.payroll_payable_account ?? "").trim() || String(erp?.default_payroll_payable_account ?? "").trim();
    if (!expense || !payable) return;

    const items: any[] = [
        {
            account: expense,
            debit_amount: totalEarnings,
            credit_amount: 0,
            memo: `Payroll accrual ${peId}`,
        },
        {
            account: payable,
            debit_amount: 0,
            credit_amount: totalEarnings,
            memo: `Payroll payable ${peId}`,
        },
    ];

    const je = await $zodula.doctype("Journal Entry").insert({
        journal_date: pe.posting_date,
        description: `Payroll Entry ${peId}`,
        reference_doctype: "Payroll Entry",
        reference_id: peId,
        journal_entry_items: items,
    } as any);

    await $zodula.doctype("Journal Entry").submit(je.id);
}
