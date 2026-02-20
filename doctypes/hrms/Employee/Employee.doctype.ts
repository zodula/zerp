export default $doctype({
    name: {
        type: "Text",
        label: "Employee Name",
        required: 1,
        in_list_view: 1,
    },
    employee_number: {
        type: "Text",
        label: "Employee Number",
        in_list_view: 1,
    },
    designation: {
        type: "Reference",
        label: "Designation",
        reference: "zerp__Designation",
        required: 0,
        in_list_view: 1,
    },
    department: {
        type: "Reference",
        label: "Department",
        reference: "zerp__Department",
        required: 0,
        in_list_view: 1,
    },
    branch: {
        type: "Reference",
        label: "Branch",
        reference: "zerp__Branch",
        required: 0,
        in_list_view: 1,
    },
    gender: {
        type: "Select",
        label: "Gender",
        options: "\nMale\nFemale\nOther",
        in_list_view: 1,
    },
    date_of_birth: {
        type: "Date",
        label: "Date of Birth",
    },
    date_of_joining: {
        type: "Date",
        label: "Date of Joining",
        in_list_view: 1,
    },
    email: {
        type: "Email",
        label: "Email",
        in_list_view: 1,
    },
    phone: {
        type: "Text",
        label: "Phone",
        in_list_view: 1,
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
    base_monthly_salary: {
        type: "Float",
        label: "Base Monthly Salary",
        required: 0,
        in_list_view: 1,
        description: "If the salary type is Daily, the base monthly salary will be divided by the monthly divider from Payroll Setting.",
    },
    salary_type: {
        type: "Select",
        label: "Salary Type",
        options: "Daily\nFortnightly\nMonthly",
        required: 0,
        in_list_view: 1,
    },
    salary_channel: {
        type: "Select",
        label: "Salary Channel",
        options: "\nBank\nCash",
        required: 0,
        in_list_view: 1,
    },
    bank_name: {
        type: "Text",
        label: "Bank Name",
        required: 0,
        in_list_view: 1,
    },
    bank_account_no: {
        type: "Text",
        label: "Bank Account No",
        required: 0,
        in_list_view: 1,
    },
}, {
    label: "Employee",
    naming_series: "EMP-{{organization_abbr}}-{#####}",
    search_fields: "name\nemployee_number\nemail\nphone\ndesignation\ndepartment",
    track_changes: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Employment",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
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
                    { type: "field", value: "base_monthly_salary", align: "left" },
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
    ]),
});
