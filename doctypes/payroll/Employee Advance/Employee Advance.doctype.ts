export default $doctype({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        filters: JSON.stringify([["status", "=", "Active"]]),
        in_list_view: 1,
    },
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        default: "TODAY()",
        in_list_view: 1,
    },
    payroll_date: {
        type: "Date",
        label: "Payroll Date",
        required: 1,
        in_list_view: 1,
    },
    purpose: {
        type: "Text",
        label: "Purpose",
        required: 0,
    },
    amount: {
        type: "Currency",
        label: "Amount",
        required: 1,
        in_list_view: 1,
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
    label: "Employee Advance",
    naming_series: "EA-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "employee\npayroll_date",
    additional_connections: JSON.stringify([{
        doctype: "Payment Entry",
        filters: [["references.reference_type", "=", "Employee Advance"], ["references.reference_id", "=", "{{id}}"]],
        field: "references.reference_id",
    }]),
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Employee Advance", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "payroll_date", align: "left" },
                ],
                [
                    { type: "field", value: "amount", align: "left" },
                    { type: "field", value: "payment_status", align: "left" },
                ],
                [
                    { type: "field", value: "purpose", align: "left" },
                ],
            ],
        }
    ]),
})
    .on("before_submit", async ({ doc }) => {
        const amount = parseFloat(String((doc as any).amount ?? 0)) || 0;
        if (amount <= 0) {
            throw new Error("Amount must be greater than 0.");
        }
        const payrollDate = String((doc as any).payroll_date ?? "").trim();
        const employee = String((doc as any).employee ?? "").trim();
        if (!payrollDate || !employee) {
            throw new Error("Employee and Payroll Date are required.");
        }
        const { docs: submittedSalarySlips } = await $zodula
            .doctype("Salary Slip")
            .select()
            .where("employee", "=", employee)
            .where("doc_status", "=", "Submitted")
            .where("start_date", "<=", payrollDate)
            .where("end_date", ">=", payrollDate)
            .limit(1);
        if (submittedSalarySlips.length > 0) {
            const salarySlipId = String((submittedSalarySlips[0] as any).id ?? "");
            throw new Error(`Cannot submit Employee Advance because Salary Slip ${salarySlipId} is already submitted for payroll date ${payrollDate}.`);
        }
        (doc as any).payment_status = "Unpaid";
    });
