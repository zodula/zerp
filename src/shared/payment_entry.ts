const NOT_GROUP_FILTER = ["is_group", "!=", 1] as const;

export const PARTY_BY_PAYMENT: Record<string, string[]> = {
    Receive: ["Customer", "Employee"],
    Pay: ["Supplier", "Employee", "Customer"],
    Transfer: [],
};

export const REFERENCE_TYPES_BY_PARTY: Record<string, string[]> = {
    Customer: ["Sales Invoice"],
    Employee: ["Expense Claim", "Employee Advance", "Salary Slip"],
    Supplier: ["Purchase Invoice"],
};

export const REFERENCE_TYPE_TOTAL_AMOUNT_FIELD: Record<string, string> = {
    "Sales Invoice": "grand_total",
    "Purchase Invoice": "grand_total",
    "Expense Claim": "amount",
    "Employee Advance": "amount",
    "Salary Slip": "net_pay",
};

export const REFERENCE_TYPE_PARTY_FIELD: Record<string, string> = {
    "Sales Invoice": "customer",
    "Purchase Invoice": "supplier",
    "Expense Claim": "employee",
    "Employee Advance": "employee",
    "Salary Slip": "employee",
};

export const PAYMENT_ENTRY_ACCOUNT_FILTERS = {
    bankCash: JSON.stringify([["account_type", "IN", ["Bank", "Cash"]], NOT_GROUP_FILTER]),
    receivable: JSON.stringify([["account_type", "IN", ["Receivable"]], NOT_GROUP_FILTER]),
    payable: JSON.stringify([["account_type", "IN", ["Payable"]], NOT_GROUP_FILTER]),
    notGroupBankCash: JSON.stringify([NOT_GROUP_FILTER, ["account_type", "IN", ["Bank", "Cash"]]]),
};
