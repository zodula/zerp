export default $doctype<"Additional Salary">({
    payroll_date: {
        type: "Date",
        label: "Payroll Date",
        required: 1,
    },
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
    component_type: {
        type: "Select",
        label: "Component Type",
        options: "Earning\nDeduction",
        required: 1,
    },
    earning_component: {
        type: "Select",
        label: "Earning Component",
        options: "Base Salary\nOvertime\nCommission\nDiligence Allowance\nBonus\nAllowance\nMeal Allowance\nTransport Allowance\nHousing Allowance\nPhone Allowance\nKPI Incentive\nPerformance Incentive\nHoliday Pay\nOther",
        depends_on: "doc.component_type === 'Earning'",
    },
    deduction_component: {
        type: "Select",
        label: "Deduction Component",
        options: "Absent\nLeave Without Pay\nLate\nSocial Security\nHealth Insurance\nTax\nAdvance\nLoan\nOther",
        depends_on: "doc.component_type === 'Deduction'",
    },
    amount: {
        type: "Currency",
        label: "Amount",
        required: 1,
    },
}, {
    label: "Additional Salary",
    is_submittable: 1,
    display_field: "employee_name",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Employee & Date", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "payroll_date", align: "left" },
                ],
                { type: "section", value: "Component", align: "left" },
                [
                    { type: "field", value: "component_type", align: "left" },
                    { type: "field", value: "earning_component", align: "left" },
                    { type: "field", value: "deduction_component", align: "left" },
                ],
                { type: "section", value: "Amount", align: "left" },
                [
                    { type: "field", value: "amount", align: "left" },
                ],
            ],
        },
    ]),
})