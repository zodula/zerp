import { z } from "bxo";

type RootType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";

type AccountDetailType =
  | "Accumulated Depreciation"
  | "Asset Received But Not Billed"
  | "Bank"
  | "Cash"
  | "Chargeable"
  | "Capital Work in Progress"
  | "Cost of Goods Sold"
  | "Current Asset"
  | "Current Liability"
  | "Depreciation"
  | "Direct Expense"
  | "Direct Income"
  | "Equity"
  | "Expense Account"
  | "Expenses Included In Asset Valuation"
  | "Expenses Included In Valuation"
  | "Fixed Asset"
  | "Income Account"
  | "Indirect Expense"
  | "Indirect Income"
  | "Liability"
  | "Payable"
  | "Receivable"
  | "Round Off"
  | "Round Off for Opening"
  | "Stock"
  | "Stock Adjustment"
  | "Stock Received But Not Billed"
  | "Service Received But Not Billed"
  | "Tax Payable"
  | "VAT Output"
  | "VAT Input"
  | "WHT Payable"
  | "WHT Receivable"
  | "Temporary";

const STANDARD_ACCOUNTS: Array<{
  account_code: string;
  account_name: string;
  root_type: RootType;
  account_type?: AccountDetailType;
  parent_code?: string;
}> = [
  { account_code: "1000", account_name: "Application of Funds (Assets)", root_type: "Asset" },
  { account_code: "1090", account_name: "Current Assets", root_type: "Asset", account_type: "Current Asset", parent_code: "1000" },
  { account_code: "1100", account_name: "Cash In Hand", root_type: "Asset", account_type: "Cash", parent_code: "1090" },
  { account_code: "1110", account_name: "Cash", root_type: "Asset", account_type: "Cash", parent_code: "1100" },
  { account_code: "1200", account_name: "Bank Accounts", root_type: "Asset", account_type: "Bank", parent_code: "1090" },
  { account_code: "1300", account_name: "Accounts Receivable", root_type: "Asset", account_type: "Receivable", parent_code: "1090" },
  { account_code: "1310", account_name: "Debtors", root_type: "Asset", account_type: "Receivable", parent_code: "1300" },
  { account_code: "1400", account_name: "Inventory", root_type: "Asset", account_type: "Stock", parent_code: "1090" },
  { account_code: "1410", account_name: "Stock In Hand", root_type: "Asset", account_type: "Stock", parent_code: "1400" },
  { account_code: "1500", account_name: "Tax Assets", root_type: "Asset", parent_code: "1090" },
  { account_code: "1520", account_name: "WHT Receivable", root_type: "Asset", account_type: "WHT Receivable", parent_code: "1500" },
  { account_code: "1600", account_name: "Loans and Advances (Assets)", root_type: "Asset", parent_code: "1090" },
  { account_code: "1610", account_name: "Employee Advances", root_type: "Asset", parent_code: "1600" },
  { account_code: "1650", account_name: "Securities and Deposits", root_type: "Asset", parent_code: "1090" },
  { account_code: "1651", account_name: "Earnest Money", root_type: "Asset", parent_code: "1650" },
  { account_code: "1700", account_name: "Fixed Assets", root_type: "Asset", parent_code: "1000" },
  { account_code: "1710", account_name: "Capital Equipment", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1720", account_name: "Electronic Equipment", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1730", account_name: "Furniture and Fixtures", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1740", account_name: "Office Equipment", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1750", account_name: "Plant and Machinery", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1760", account_name: "Buildings", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1770", account_name: "Software", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1780", account_name: "Accumulated Depreciation", root_type: "Asset", account_type: "Accumulated Depreciation", parent_code: "1700" },
  { account_code: "1790", account_name: "CWIP Account", root_type: "Asset", account_type: "Capital Work in Progress", parent_code: "1700" },
  { account_code: "1800", account_name: "Investments", root_type: "Asset", parent_code: "1000" },
  { account_code: "1900", account_name: "Temporary Accounts", root_type: "Asset", parent_code: "1000" },
  { account_code: "1910", account_name: "Temporary Opening", root_type: "Asset", account_type: "Temporary", parent_code: "1900" },
  { account_code: "2000", account_name: "Source of Funds (Liabilities)", root_type: "Liability" },
  { account_code: "2050", account_name: "Current Liabilities", root_type: "Liability", account_type: "Current Liability", parent_code: "2000" },
  { account_code: "2100", account_name: "Accounts Payable", root_type: "Liability", parent_code: "2050" },
  { account_code: "2110", account_name: "Creditors", root_type: "Liability", account_type: "Payable", parent_code: "2100" },
  { account_code: "2120", account_name: "Payroll Payable", root_type: "Liability", parent_code: "2100" },
  { account_code: "2200", account_name: "Stock Liabilities", root_type: "Liability", parent_code: "2050" },
  { account_code: "2210", account_name: "Stock Received But Not Billed", root_type: "Liability", account_type: "Stock Received But Not Billed", parent_code: "2200" },
  { account_code: "2211", account_name: "Asset Received But Not Billed", root_type: "Liability", account_type: "Asset Received But Not Billed", parent_code: "2200" },
  { account_code: "2300", account_name: "Duties and Taxes", root_type: "Liability", account_type: "Tax Payable", parent_code: "2050" },
  { account_code: "2330", account_name: "VAT", root_type: "Liability", account_type: "Tax Payable", parent_code: "2300" },
  { account_code: "2310", account_name: "Output VAT", root_type: "Liability", account_type: "VAT Output", parent_code: "2330" },
  { account_code: "2340", account_name: "Input VAT", root_type: "Liability", account_type: "VAT Input", parent_code: "2330" },
  { account_code: "2320", account_name: "WHT Payable", root_type: "Liability", account_type: "WHT Payable", parent_code: "2300" },
  { account_code: "2400", account_name: "Loans (Liabilities)", root_type: "Liability", parent_code: "2000" },
  { account_code: "2410", account_name: "Secured Loans", root_type: "Liability", parent_code: "2400" },
  { account_code: "2420", account_name: "Unsecured Loans", root_type: "Liability", parent_code: "2400" },
  { account_code: "2430", account_name: "Bank Overdraft Account", root_type: "Liability", parent_code: "2400" },
  { account_code: "3000", account_name: "Equity", root_type: "Equity" },
  { account_code: "3100", account_name: "Capital Stock", root_type: "Equity", account_type: "Equity", parent_code: "3000" },
  { account_code: "3200", account_name: "Dividends Paid", root_type: "Equity", account_type: "Equity", parent_code: "3000" },
  { account_code: "3300", account_name: "Opening Balance Equity", root_type: "Equity", account_type: "Equity", parent_code: "3000" },
  { account_code: "3400", account_name: "Retained Earnings", root_type: "Equity", account_type: "Equity", parent_code: "3000" },
  { account_code: "4000", account_name: "Income", root_type: "Income", account_type: "Income Account" },
  { account_code: "4100", account_name: "Direct Income", root_type: "Income", account_type: "Direct Income", parent_code: "4000" },
  { account_code: "4110", account_name: "Sales", root_type: "Income", account_type: "Direct Income", parent_code: "4100" },
  { account_code: "4120", account_name: "Service", root_type: "Income", account_type: "Direct Income", parent_code: "4100" },
  { account_code: "4200", account_name: "Indirect Income", root_type: "Income", account_type: "Indirect Income", parent_code: "4000" },
  { account_code: "4210", account_name: "Exchange Gain", root_type: "Income", account_type: "Indirect Income", parent_code: "4200" },
  { account_code: "4211", account_name: "Gain on Asset Disposal", root_type: "Income", account_type: "Indirect Income", parent_code: "4200" },
  { account_code: "5000", account_name: "Expenses", root_type: "Expense", account_type: "Expense Account" },
  { account_code: "5100", account_name: "Direct Expenses", root_type: "Expense", account_type: "Direct Expense", parent_code: "5000" },
  { account_code: "5110", account_name: "Stock Expenses", root_type: "Expense", parent_code: "5100" },
  { account_code: "5111", account_name: "Cost of Goods Sold", root_type: "Expense", account_type: "Cost of Goods Sold", parent_code: "5110" },
  { account_code: "5112", account_name: "Expenses Included In Asset Valuation", root_type: "Expense", account_type: "Expenses Included In Asset Valuation", parent_code: "5110" },
  { account_code: "5119", account_name: "Stock Adjustment", root_type: "Expense", account_type: "Stock Adjustment", parent_code: "5110" },
  { account_code: "5200", account_name: "Indirect Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5000" },
  { account_code: "5201", account_name: "Administrative Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5202", account_name: "Commission on Sales", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5203", account_name: "Depreciation", root_type: "Expense", account_type: "Depreciation", parent_code: "5200" },
  { account_code: "5204", account_name: "Entertainment Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5205", account_name: "Freight and Forwarding Charges", root_type: "Expense", account_type: "Chargeable", parent_code: "5200" },
  { account_code: "5206", account_name: "Legal Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5207", account_name: "Marketing Expenses", root_type: "Expense", account_type: "Chargeable", parent_code: "5200" },
  { account_code: "5208", account_name: "Office Maintenance Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5209", account_name: "Office Rent", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5210", account_name: "Postal Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5211", account_name: "Print and Stationery", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5212", account_name: "Round Off", root_type: "Expense", account_type: "Round Off", parent_code: "5200" },
  { account_code: "5213", account_name: "Salary", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5214", account_name: "Sales Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5215", account_name: "Telephone Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5216", account_name: "Travel Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5217", account_name: "Utility Expenses", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5218", account_name: "Write Off", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5219", account_name: "Exchange Loss", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5220", account_name: "Loss on Asset Disposal", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5221", account_name: "Miscellaneous Expenses", root_type: "Expense", account_type: "Chargeable", parent_code: "5200" },
];

const ESSENTIAL_DEFAULT_CODES = [
  "1110",
  "1200",
  "1310",
  "2110",
  "2310",
  "2340",
  "4110",
  "5213",
  "5209",
  "5212",
] as const;

export default $action(async (ctx) => {

  return ctx.json({
    accounts: STANDARD_ACCOUNTS,
    essential_account_codes: ESSENTIAL_DEFAULT_CODES,
    default_price_lists: {
      selling: "Standard Selling",
      buying: "Standard Buying",
    },
  });
}, {
  method: "GET",
  response: {
    200: z.object({
      accounts: z.array(z.object({
        account_code: z.string(),
        account_name: z.string(),
        root_type: z.string(),
        account_type: z.string().optional(),
        parent_code: z.string().optional(),
      })),
      essential_account_codes: z.array(z.string()),
      default_price_lists: z.object({
        selling: z.string(),
        buying: z.string(),
      }),
    }).passthrough(),
  },
});
