export default $doctype<"Employee">({
    title: {
        type: "Text",
        label: "Title",
        required: 0,
    },
    first_name: {
        type: "Text",
        label: "First Name",
        required: 1,
    },
    last_name: {
        type: "Text",
        label: "Last Name",
        required: 1,
    },
    full_name: {
        type: "Text",
        label: "Full Name",
        required: 0,
        readonly: 1,
    },
    employee_number: {
        type: "Text",
        label: "Employee Number",
        in_list_view: 1,
        unique: 1,
    },
    designation: {
        type: "Reference",
        label: "Designation",
        reference: "Designation",
        required: 0,
    },
    department: {
        type: "Reference",
        label: "Department",
        reference: "Department",
        required: 0,
    },
    branch: {
        type: "Reference",
        label: "Branch",
        reference: "Branch",
        required: 0,
    },
    gender: {
        type: "Select",
        label: "Gender",
        options: "\nMale\nFemale\nOther",
        required: 1,
    },
    date_of_birth: {
        type: "Date",
        label: "Date of Birth",
    },
    date_of_joining: {
        type: "Date",
        label: "Date of Joining",
        required: 1,
    },
    email: {
        type: "Email",
        label: "Email",
    },
    phone: {
        type: "Text",
        label: "Phone",
    },
    address: {
        type: "Text",
        label: "Address",
    },
    status: {
        type: "Select",
        label: "Status",
        options: "Active\nLeft\nSuspended",
        default: "Active",
        in_list_view: 1,
    },
    base_salary: {
        type: "Float",
        label: "Base Salary",
        required: 1,
        description: "This is base salary per {salary_type}",
    },
    salary_type: {
        type: "Select",
        label: "Salary Type",
        options: "Daily\nMonthly",
        default: "Monthly",
        required: 1,
    },
    salary_channel: {
        type: "Select",
        label: "Salary Channel",
        options: "\nBank\nCash",
        required: 0,
    },
    bank_name: {
        type: "Text",
        label: "Bank Name",
        required: 0,
    },
    bank_account_no: {
        type: "Text",
        label: "Bank Account No",
        required: 0,
    },
    work_shift: {
        type: "Reference",
        label: "Work Shift",
        reference: "Work Shift",
        required: 1,
    },
    expense_approver: {
        type: "Reference",
        label: "Expense Approver",
        reference: "User",
        required: 0,
    },
    attendance_approver: {
        type: "Reference",
        label: "Attendance Approver",
        reference: "User",
        required: 0,
    },
}, {
    label: "Employee",
    naming_series: "EMP-{YYYY}-{MM}-{DD}-{#####}",
    display_field: "full_name",
    search_fields: "full_name\nemployee_number\nemail\nphone\ndesignation\ndepartment",
    track_changes: 1,
    additional_connections: JSON.stringify([{
        doctype: "Payment Entry",
        filters: [["party_type", "=", "Employee"], ["party", "=", "{{id}}"]],
        field: "party",
    }]),
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Employment",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "title", align: "left" },
                    { type: "field", value: "first_name", align: "left" },
                    { type: "field", value: "last_name", align: "left" },
                ],
                [
                    { type: "field", value: "full_name", align: "left" },
                    { type: "field", value: "employee_number", align: "left" },
                    { type: "field", value: "status", align: "left" },
                ],
                { type: "section", value: "Organization", align: "left" },
                [
                    { type: "field", value: "designation", align: "left" },
                    { type: "field", value: "department", align: "left" },
                    { type: "field", value: "branch", align: "left" },
                ],
            ],
        },
        {
            type: "Tab",
            label: "Personal & Contact",
            layout: [
                { type: "section", value: "Personal", align: "left" },
                [
                    { type: "field", value: "gender", align: "left" },
                    { type: "field", value: "date_of_birth", align: "left" },
                    { type: "field", value: "date_of_joining", align: "left" },
                ],
                { type: "section", value: "Contact", align: "left" },
                [
                    { type: "field", value: "email", align: "left" },
                    { type: "field", value: "phone", align: "left" },
                    { type: "field", value: "address", align: "left" },
                ],
            ],
        },
        {
            type: "Tab",
            label: "Salary & Bank",
            layout: [
                { type: "section", value: "Salary", align: "left" },
                [
                    { type: "field", value: "base_salary", align: "left" },
                    { type: "field", value: "salary_type", align: "left" },
                    { type: "field", value: "salary_channel", align: "left" },
                ],
                { type: "section", value: "Bank Details", align: "left" },
                [
                    { type: "field", value: "bank_name", align: "left" },
                    { type: "field", value: "bank_account_no", align: "left" },
                ],
            ],
        },
        {
            type: "Tab",
            label: "Work Shift & Approvers",
            layout: [
                [
                    { type: "field", value: "work_shift", align: "left" },
                    { type: "field", value: "expense_approver", align: "left" },
                    { type: "field", value: "attendance_approver", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_save", async ({ doc }) => {
        doc.full_name = [doc.title, doc.first_name, doc.last_name].filter(Boolean).join(" ").trim();
    });
