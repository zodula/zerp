const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

type EmployeeRow = {
    employee?: string;
    employee_name?: string;
    salary_slip?: string;
    net_pay?: number;
};

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
    salary_expense_account: {
        type: "Reference",
        label: "Salary Expense Account",
        reference: "Account",
        required: 0,
        in_list_view: 0,
    },
    salaries_payable_account: {
        type: "Reference",
        label: "Salaries Payable Account",
        reference: "Account",
        required: 0,
        in_list_view: 0,
    },
    deduction_payable_account: {
        type: "Reference",
        label: "Deduction Payable Account",
        reference: "Account",
        required: 0,
        in_list_view: 0,
    },
    bank_account: {
        type: "Reference",
        label: "Bank Account (payment)",
        reference: "Account",
        required: 0,
        description: "Used when creating bank payment drafts from this payroll run.",
    },
    journal_entry: {
        type: "Reference",
        label: "Journal Entry",
        reference: "Journal Entry",
        readonly: 1,
        allow_on_submit: 1,
    },
}, {
    label: "Payroll Entry",
    naming_series: "PR-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "start_date\nend_date",
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
                { type: "section", value: "Accounting (accrual)", align: "left" },
                [
                    { type: "field", value: "salary_expense_account", align: "left" },
                    { type: "field", value: "salaries_payable_account", align: "left" },
                    { type: "field", value: "deduction_payable_account", align: "left" },
                ],
                [
                    { type: "field", value: "journal_entry", align: "left" },
                ],
                { type: "section", value: "Bank payment", align: "left" },
                [
                    { type: "field", value: "bank_account", align: "left" },
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
        for (const row of rows) {
            const emp = String(row.employee ?? "").trim();
            if (!emp) continue;
            const e = await $zodula.doctype("Employee").get(emp);
            if (e) (row as any).employee_name = (e as any).full_name;
        }
    })
    .on("before_submit", async ({ doc }) => {
        const rows = (doc.employee_table ?? []) as EmployeeRow[];
        if (!rows.length) throw new Error("Add at least one employee.");

        const expense = String((doc as any).salary_expense_account ?? "").trim();
        const payable = String((doc as any).salaries_payable_account ?? "").trim();
        if (!expense || !payable) {
            throw new Error("Salary Expense Account and Salaries Payable Account are required to submit (accrual journal).");
        }

        let totalEarnings = 0;
        let totalNet = 0;
        let totalDeductions = 0;

        for (const [index, row] of rows.entries()) {
            const slipId = String(row.salary_slip ?? "").trim();
            if (!slipId) {
                throw new Error(`Row ${index + 1}: Create and link Salary Slips before submitting.`);
            }
            const slip = await $zodula.doctype("Salary Slip").get(slipId);
            if (!slip) throw new Error(`Salary Slip ${slipId} not found.`);
            if (String((slip as any).doc_status ?? "") !== "Submitted") {
                throw new Error(`Salary Slip ${slipId} must be submitted before Payroll Entry can be submitted.`);
            }
            totalEarnings += num((slip as any).total_earnings);
            totalNet += num((slip as any).net_pay);
            totalDeductions += num((slip as any).total_deductions);
        }

        const dedAccount = String((doc as any).deduction_payable_account ?? "").trim();
        if (totalDeductions > 0.01 && !dedAccount) {
            throw new Error("Deduction Payable Account is required when there are salary deductions.");
        }

        const expectedCredits = totalNet + totalDeductions;
        if (Math.abs(totalEarnings - expectedCredits) > 0.02) {
            throw new Error(
                `Salary Slip totals do not balance: sum of earnings (${totalEarnings}) must equal net pay + deductions (${expectedCredits}).`
            );
        }

        if ((doc as any).journal_entry) {
            throw new Error("Journal Entry is already linked; cancel and amend if you need to re-post.");
        }
    })
    .on("after_submit", async ({ doc }) => {
        const rows = (doc.employee_table ?? []) as EmployeeRow[];
        let totalEarnings = 0;
        let totalNet = 0;
        let totalDeductions = 0;
        for (const row of rows) {
            const slip = await $zodula.doctype("Salary Slip").get(String(row.salary_slip));
            if (!slip) continue;
            totalEarnings += num((slip as any).total_earnings);
            totalNet += num((slip as any).net_pay);
            totalDeductions += num((slip as any).total_deductions);
        }

        const expense = String((doc as any).salary_expense_account ?? "").trim();
        const payable = String((doc as any).salaries_payable_account ?? "").trim();
        const dedAccount = String((doc as any).deduction_payable_account ?? "").trim();

        const items: any[] = [
            {
                account: expense,
                debit_amount: totalEarnings,
                credit_amount: 0,
                memo: `Payroll accrual ${doc.id}`,
            },
            {
                account: payable,
                debit_amount: 0,
                credit_amount: totalNet,
                memo: `Net salaries payable ${doc.id}`,
            },
        ];
        if (totalDeductions > 0.01 && dedAccount) {
            items.push({
                account: dedAccount,
                debit_amount: 0,
                credit_amount: totalDeductions,
                memo: `Deductions payable ${doc.id}`,
            });
        }

        const je = await $zodula.doctype("Journal Entry").insert({
            journal_date: doc.posting_date,
            description: `Payroll Entry ${doc.id}`,
            reference_doctype: "Payroll Entry",
            reference_id: doc.id,
            journal_entry_items: items,
        } as any);

        await $zodula.doctype("Journal Entry").submit(je.id);
        await $zodula.doctype("Payroll Entry").update(doc.id, {
            journal_entry: je.id,
        } as any);
    })
    .on("after_cancel", async ({ doc }) => {
        const jeId = String((doc as any).journal_entry ?? "").trim();
        if (!jeId) return;
        const je = await $zodula.doctype("Journal Entry").get(jeId);
        if (je && String((je as any).doc_status ?? "") === "Submitted") {
            await $zodula.doctype("Journal Entry").cancel(jeId);
        }
    });
