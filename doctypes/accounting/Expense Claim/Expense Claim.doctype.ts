export default $doctype({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        filters: JSON.stringify([["status", "=", "Active"]]),
        in_list_view: 1,
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
        in_list_view: 1,
        fetch_from: "employee.full_name",
    },
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        default: "TODAY()",
        in_list_view: 1,
    },
    amount: {
        type: "Currency",
        label: "Amount",
        required: 0,
        readonly: 1,
        in_list_view: 1,
    },
    expense_item: {
        type: "Reference Table",
        label: "Expense Item",
        reference: "Expense Claim Item",
        required: 1,
    },
    reason: {
        type: "Text",
        label: "Reason",
        required: 0,
    },
    status: {
        type: "Select",
        label: "Status",
        options: "Open\nApproved\nRejected",
        default: "Open",
        in_list_view: 1,
    },
    approver: {
        type: "Reference",
        label: "Approver",
        reference: "User",
        readonly: 1,
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
    label: "Expense Claim",
    naming_series: "EXC-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "employee\nemployee_name",
    additional_connections: JSON.stringify([{
        doctype: "Payment Entry",
        filters: [["references.reference_type", "=", "Expense Claim"], ["references.reference_id", "=", "{{id}}"]],
        field: "references.reference_id",
    }]),
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Expense Claim", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "employee_name", align: "left" },
                    { type: "field", value: "posting_date", align: "left" },
                ],
                [
                    { type: "field", value: "amount", align: "left" },
                ],
                { type: "section", value: "Expense Item", align: "left" },
                [
                    { type: "field", value: "expense_item", align: "left" },
                ],
                { type: "section", value: "Workflow", align: "left" },
                [
                    { type: "field", value: "status", align: "left" },
                    { type: "field", value: "approver", align: "left" },
                    { type: "field", value: "payment_status", align: "left" },
                ],
                [
                    { type: "field", value: "reason", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_save", async ({ doc, old }) => {
        const rows = ((doc as any).expense_item ?? []) as any[];
        if (!rows.length) throw new Error("Expense Item must have at least one row.");
        const totalAmount = rows.reduce((sum, row, index) => {
            const amount = parseFloat(String(row?.amount ?? 0)) || 0;
            if (amount <= 0) {
                throw new Error(`Expense Item row ${index + 1}: Amount must be greater than 0.`);
            }
            const claimType = String(row?.expense_claim_type ?? "").trim();
            if (!claimType) {
                throw new Error(`Expense Item row ${index + 1}: Expense Claim Type is required.`);
            }
            return sum + amount;
        }, 0);
        (doc as any).amount = totalAmount;

        const employeeId = String((doc as any).employee ?? "").trim();
        if (!employeeId) {
            throw new Error("Employee is required.");
        }
        const employee = await $zodula.doctype("Employee").get(employeeId);
        if (!employee) {
            throw new Error(`Employee ${employeeId} not found.`);
        }
        (doc as any).approver = (employee as any).expense_approver;
        (doc as any).employee_name = (employee as any).full_name;

        const approverId = (await $zodula.session.user()).id;
        if (doc?.status !== old?.status && doc?.status === "Approved" && (doc as any).approver !== approverId) {
            throw new Error("You are not authorized to approve this expense claim");
        }
    })
    .on("before_submit", async ({ doc }) => {
        const status = String((doc as any).status ?? "").trim();
        if (status !== "Approved") {
            throw new Error("Expense Claim must be Approved before submit.");
        }
        (doc as any).payment_status = "Unpaid";
    })
    .on("after_cancel", async ({ doc }) => {
        await $zodula.doctype("Expense Claim").update(doc.id, { status: "Rejected" } as any);
    });
