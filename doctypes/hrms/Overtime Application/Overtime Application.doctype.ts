export default $doctype<"Overtime Application">({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
        in_list_view: 1,
        fetch_from: "employee.full_name",
    },
    overtime_date: {
        type: "Date",
        label: "Overtime Date",
        required: 1,
        default: "TODAY()",
    },
    hours: {
        type: "Float",
        label: "Overtime Hours",
        required: 1,
    },
    rate: {
        type: "Float",
        label: "Rate",
        required: 1,
    },
    reason: {
        type: "Long Text",
        label: "Reason",
    },
    status: {
        type: "Select",
        label: "Status",
        options: "Open\nApproved\nRejected",
        default: "Open",
        required: 1,
    },
    approver: {
        type: "Reference",
        label: "Approver",
        reference: "User",
        required: 0,
        readonly: 1,
    },
}, {
    is_submittable: 1,
    display_field: "employee_name",
})
    .on("before_save", async ({ doc, old, input }) => {
        const employee_doc = await $zodula.doctype("Employee").get(doc.employee);
        doc.approver = employee_doc.attendance_approver;
        const approver_id = (await ($zodula.session.user())).id;
        if (doc?.status !== old?.status && doc?.status === "Approved" && doc.approver !== approver_id) {
            throw new Error("You are not authorized to approve this overtime application");
        }
    });