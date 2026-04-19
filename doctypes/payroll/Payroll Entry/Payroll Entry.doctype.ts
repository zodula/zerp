import { ensurePayrollEntryAccrualJournal } from "@/zerp/src/shared/payroll_entry_journal";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

type EmployeeRow = {
    employee?: string;
    employee_name?: string;
    salary_slip_submitted?: number;
    net_pay?: number;
};

const payrollAccrualJeDescription = (payrollEntryId: string) => `Payroll Entry ${payrollEntryId}`;
const isPayrollPaymentJe = (description: string) => description.startsWith("Payroll bank payment ");
const isPayrollManagedJe = (description: string, payrollEntryId: string) =>
    description === payrollAccrualJeDescription(payrollEntryId) || isPayrollPaymentJe(description);

export default $doctype<"Payroll Entry">({
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        in_list_view: 1,
        default: "TODAY()",
    },
    start_date: {
        type: "Date",
        label: "Start Date",
        required: 1,
        in_list_view: 1,
    },
    end_date: {
        type: "Date",
        label: "End Date",
        required: 1,
        in_list_view: 1,
    },
    payroll_frequency: {
        type: "Select",
        label: "Payroll Frequency",
        options: "Monthly\nFortnightly\nWeekly\nDaily",
        default: "Monthly",
    },
    employee_table: {
        type: "Reference Table",
        label: "Employees",
        reference: "Payroll Entry Employee",
        required: 1,
        height: 240,
    },
    payroll_payable_account: {
        type: "Reference",
        label: "Payroll Payable Account",
        reference: "Account",
        required: 1,
        in_list_view: 0,
        filters: JSON.stringify([["account_type", "IN", ["Payable"]], ["is_group", "=", "0"]]),
        description: "Accrual credit and payment journal debit for net salaries. Falls back to ERP Setting → Payroll Payable if empty.",
    },
    bank_account: {
        type: "Reference",
        label: "Payment Account (Bank, Cash)",
        reference: "Account",
        required: 1,
        filters: JSON.stringify([["account_type", "IN", ["Bank", "Cash"]], ["is_group", "=", "0"]]),
        description: "Bank or cash account used when creating payment drafts from this payroll run.",
    },
    total_net_pay: {
        type: "Currency",
        label: "Total Net Pay",
        required: 0,
        readonly: 1,
        description: "Sum of net pay on employee rows (from Salary Slips). Compared to payment Journal Entries for status.",
    },
    payment_status: {
        type: "Select",
        label: "Payment Status",
        options: "Unpaid\nPartially Paid\nPaid",
        default: "Unpaid",
        required: 1,
        readonly: 1,
        in_list_view: 1,
    },
}, {
    label: "Payroll Entry",
    naming_series: "PR-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "start_date\nend_date\npayment_status",
    additional_connections: JSON.stringify([
        {
            doctype: "Journal Entry",
            filters: [
                ["reference_doctype", "=", "Payroll Entry"],
                ["reference_id", "=", "{{id}}"],
            ],
            field: "reference_id",
        },
    ]),
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Period", align: "left" },
                [
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "start_date", align: "left" },
                    { type: "field", value: "end_date", align: "left" },
                    { type: "field", value: "payroll_frequency", align: "left" },
                ],
                { type: "section", value: "Employees", align: "left" },
                [{ type: "field", value: "employee_table", align: "left" }],
                { type: "section", value: "Accounting", align: "left" },
                [
                    { type: "field", value: "payroll_payable_account", align: "left" },
                    { type: "field", value: "bank_account", align: "left" },
                    { type: "field", value: "total_net_pay", align: "left" },
                    { type: "field", value: "payment_status", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_save", async ({ doc }) => {
        const start = String(doc.start_date ?? "").slice(0, 10);
        const end = String(doc.end_date ?? "").slice(0, 10);
        if (start && end && start > end) {
            throw new Error("Start Date must be on or before End Date.");
        }
        const rows = (doc.employee_table ?? []) as EmployeeRow[];
        let sumNet = 0;
        const peId = String(doc.id ?? "").trim();
        for (const row of rows) {
            const emp = String(row.employee ?? "").trim();
            if (!emp) {
                (row as any).salary_slip_submitted = 0;
                continue;
            }
            const e = await $zodula.doctype("Employee").get(emp);
            if (e) (row as any).employee_name = (e as any).full_name;
            if (peId && !peId.startsWith("temp-")) {
                const res = await $zodula
                    .doctype("Salary Slip")
                    .select()
                    .where("payroll_entry", "=", peId)
                    .where("employee", "=", emp)
                    .limit(20);
                const slip = (res.docs ?? []).find((s: any) => String(s.doc_status ?? "") !== "Cancelled");
                (row as any).salary_slip_submitted = slip && String((slip as any).doc_status ?? "") === "Submitted" ? 1 : 0;
                if (slip) (row as any).net_pay = num((slip as any).net_pay);
            } else {
                (row as any).salary_slip_submitted = 0;
            }
            sumNet += num((row as any).net_pay);
        }
        (doc as any).total_net_pay = sumNet;
    })
    .on("before_submit", async ({ doc }) => {
        const rows = (doc.employee_table ?? []) as EmployeeRow[];
        if (!rows.length) throw new Error("Add at least one employee.");

        const erp = await $zodula.doctype("ERP Setting").select().limit(1).then((r) => r.docs[0] as any);
        const payrollSetting = await $zodula.doctype("Payroll Setting").select().limit(1).then((r) => r.docs[0] as any);
        const expense = String(payrollSetting?.default_salary_expense_account ?? "").trim();
        const payable =
            String((doc as any).payroll_payable_account ?? "").trim() || String(erp?.default_payroll_payable_account ?? "").trim();
        if (!expense) {
            throw new Error("Set Default Salary Expense Account on Payroll Setting (accrual journal debit).");
        }
        if (!payable) {
            throw new Error("Set Payroll Payable Account on this document or Default Payroll Payable in ERP Setting.");
        }

        const existingJe = await $zodula
            .doctype("Journal Entry" as any)
            .select()
            .where("reference_doctype", "=", "Payroll Entry")
            .where("reference_id", "=", doc.id)
            .limit(50);
        const hasAccrualJe = (existingJe.docs ?? []).some(
            (row: any) => String(row?.description ?? "").trim() === payrollAccrualJeDescription(String(doc.id ?? ""))
        );
        if (hasAccrualJe) {
            throw new Error("Payroll accrual Journal Entry already exists; cancel and amend if you need to re-post.");
        }
    })
    .on("after_submit", async ({ doc }) => {
        await ensurePayrollEntryAccrualJournal(String(doc.id));
    })
    .on("after_cancel", async ({ doc }) => {
        const linked = await $zodula
            .doctype("Journal Entry" as any)
            .select()
            .where("reference_doctype", "=", "Payroll Entry")
            .where("reference_id", "=", doc.id)
            .limit(100);
        for (const row of linked.docs ?? []) {
            const jeId = String((row as any)?.id ?? "").trim();
            if (!jeId) continue;
            const desc = String((row as any)?.description ?? "").trim();
            if (!isPayrollManagedJe(desc, String(doc.id ?? ""))) continue;
            const je = await $zodula.doctype("Journal Entry").get(jeId);
            if (je && String((je as any).doc_status ?? "") === "Submitted") {
                await $zodula.doctype("Journal Entry").cancel(jeId);
            }
        }
    });
