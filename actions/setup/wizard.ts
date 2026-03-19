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
  | "Tax"
  | "Temporary";

const STANDARD_ACCOUNTS: Array<{
  account_code: string;
  account_name: string;
  root_type: RootType;
  account_type?: AccountDetailType;
  parent_code?: string;
}> = [
  { account_code: "1000", account_name: "Application of Funds (Assets)", root_type: "Asset" },
  { account_code: "1100-1600", account_name: "Current Assets", root_type: "Asset", account_type: "Current Asset", parent_code: "1000" },
  { account_code: "1100", account_name: "Cash In Hand", root_type: "Asset", account_type: "Cash", parent_code: "1100-1600" },
  { account_code: "1110", account_name: "Cash", root_type: "Asset", account_type: "Cash", parent_code: "1100" },
  { account_code: "1200", account_name: "Bank Accounts", root_type: "Asset", account_type: "Bank", parent_code: "1100-1600" },
  { account_code: "1300", account_name: "Accounts Receivable", root_type: "Asset", parent_code: "1100-1600" },
  { account_code: "1310", account_name: "Debtors", root_type: "Asset", account_type: "Receivable", parent_code: "1300" },
  { account_code: "1400", account_name: "Stock Assets", root_type: "Asset", account_type: "Stock", parent_code: "1100-1600" },
  { account_code: "1410", account_name: "Stock In Hand", root_type: "Asset", account_type: "Stock", parent_code: "1400" },
  { account_code: "1500", account_name: "Tax Assets", root_type: "Asset", parent_code: "1100-1600" },
  { account_code: "1510", account_name: "Input VAT", root_type: "Asset", account_type: "Tax", parent_code: "1500" },
  { account_code: "1600", account_name: "Loans and Advances (Assets)", root_type: "Asset", parent_code: "1100-1600" },
  { account_code: "1610", account_name: "Employee Advances", root_type: "Asset", parent_code: "1600" },
  { account_code: "1650", account_name: "Securities and Deposits", root_type: "Asset", parent_code: "1100-1600" },
  { account_code: "1651", account_name: "Earnest Money", root_type: "Asset", parent_code: "1650" },
  { account_code: "1700", account_name: "Fixed Assets", root_type: "Asset", parent_code: "1000" },
  { account_code: "1710", account_name: "Capital Equipments", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1720", account_name: "Electronic Equipments", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1730", account_name: "Furnitures and Fixtures", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1740", account_name: "Office Equipments", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1750", account_name: "Plants and Machineries", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1760", account_name: "Buildings", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1770", account_name: "Softwares", root_type: "Asset", account_type: "Fixed Asset", parent_code: "1700" },
  { account_code: "1780", account_name: "Accumulated Depreciation", root_type: "Asset", account_type: "Accumulated Depreciation", parent_code: "1700" },
  { account_code: "1790", account_name: "CWIP Account", root_type: "Asset", account_type: "Capital Work in Progress", parent_code: "1700" },
  { account_code: "1800", account_name: "Investments", root_type: "Asset", parent_code: "1000" },
  { account_code: "1900", account_name: "Temporary Accounts", root_type: "Asset", parent_code: "1000" },
  { account_code: "1910", account_name: "Temporary Opening", root_type: "Asset", account_type: "Temporary", parent_code: "1900" },
  { account_code: "2000", account_name: "Source of Funds (Liabilities)", root_type: "Liability" },
  { account_code: "2100-2400", account_name: "Current Liabilities", root_type: "Liability", account_type: "Current Liability", parent_code: "2000" },
  { account_code: "2100", account_name: "Accounts Payable", root_type: "Liability", parent_code: "2100-2400" },
  { account_code: "2110", account_name: "Creditors", root_type: "Liability", account_type: "Payable", parent_code: "2100" },
  { account_code: "2120", account_name: "Payroll Payable", root_type: "Liability", parent_code: "2100" },
  { account_code: "2200", account_name: "Stock Liabilities", root_type: "Liability", parent_code: "2100-2400" },
  { account_code: "2210", account_name: "Stock Received But Not Billed", root_type: "Liability", account_type: "Stock Received But Not Billed", parent_code: "2200" },
  { account_code: "2211", account_name: "Asset Received But Not Billed", root_type: "Liability", account_type: "Asset Received But Not Billed", parent_code: "2200" },
  { account_code: "2300", account_name: "Duties and Taxes", root_type: "Liability", account_type: "Tax", parent_code: "2100-2400" },
  { account_code: "2310", account_name: "Output VAT", root_type: "Liability", account_type: "Tax", parent_code: "2300" },
  { account_code: "2320", account_name: "Withholding Tax Payable", root_type: "Liability", account_type: "Tax", parent_code: "2300" },
  { account_code: "2400", account_name: "Loans (Liabilities)", root_type: "Liability", parent_code: "2100-2400" },
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
  { account_code: "5000", account_name: "Expenses", root_type: "Expense", account_type: "Expense Account" },
  { account_code: "5100", account_name: "Direct Expenses", root_type: "Expense", account_type: "Direct Expense", parent_code: "5000" },
  { account_code: "5110", account_name: "Stock Expenses", root_type: "Expense", parent_code: "5100" },
  { account_code: "5111", account_name: "Cost of Goods Sold", root_type: "Expense", account_type: "Cost of Goods Sold", parent_code: "5110" },
  { account_code: "5112", account_name: "Expenses Included In Asset Valuation", root_type: "Expense", account_type: "Expenses Included In Asset Valuation", parent_code: "5110" },
  { account_code: "5118", account_name: "Expenses Included In Valuation", root_type: "Expense", account_type: "Expenses Included In Valuation", parent_code: "5110" },
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
  { account_code: "5219", account_name: "Exchange Gain/Loss", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5220", account_name: "Gain/Loss on Asset Disposal", root_type: "Expense", account_type: "Indirect Expense", parent_code: "5200" },
  { account_code: "5221", account_name: "Miscellaneous Expenses", root_type: "Expense", account_type: "Chargeable", parent_code: "5200" },
];

const GROUP_ACCOUNT_CODES = new Set<string>([
  "1000",
  "1100-1600",
  "1100",
  "1200",
  "1300",
  "1400",
  "1500",
  "1600",
  "1650",
  "1700",
  "1800",
  "1900",
  "2000",
  "2100-2400",
  "2100",
  "2200",
  "2300",
  "2400",
  "3000",
  "4000",
  "4100",
  "4200",
  "5000",
  "5100",
  "5110",
  "5200",
]);

function expandAccountSelection(selectedCodes: string[]) {
  const byCode = new Map(STANDARD_ACCOUNTS.map((a) => [a.account_code, a]));
  const out = new Set<string>();

  const visit = (code: string) => {
    if (!code || out.has(code)) return;
    const node = byCode.get(code);
    if (!node) return;
    out.add(code);
    if (node.parent_code) visit(node.parent_code);
  };

  for (const code of selectedCodes) visit(code);
  return [...out];
}

async function ensureStandardAccounts(selectedCodes?: string[]) {
  const existing = await $zodula
    .doctype("Account")
    .select()
    .fields(["account_code", "id"])
    .bypass(true);

  const existingByCode = new Map(
    (existing.docs ?? []).map((d: { account_code: string; id: string }) => [d.account_code, d.id])
  );
  const selection =
    selectedCodes && selectedCodes.length > 0
      ? expandAccountSelection(selectedCodes)
      : STANDARD_ACCOUNTS.map((a) => a.account_code);
  const selectedSet = new Set(selection);

  const toCreate = STANDARD_ACCOUNTS.filter(
    (a) => selectedSet.has(a.account_code) && !existingByCode.has(a.account_code)
  );

  const created: string[] = [];
  const codeToId = new Map<string, string>(existingByCode);

  const sorted = [...toCreate].sort((a, b) => {
    const aIsParent = !a.parent_code;
    const bIsParent = !b.parent_code;
    if (aIsParent && !bIsParent) return -1;
    if (!aIsParent && bIsParent) return 1;
    return a.account_code.localeCompare(b.account_code);
  });

  for (const account of sorted) {
    const parentId = account.parent_code ? codeToId.get(account.parent_code) : undefined;
    const isGroup = GROUP_ACCOUNT_CODES.has(account.account_code) ? 1 : 0;
    const { parent_code: _pc, ...accountData } = account;
    const doc = await $zodula.doctype("Account").insert({
      ...accountData,
      balance: 0,
      is_group: isGroup,
      ...(parentId ? { parent_account: parentId } : {}),
    });
    created.push(doc.id);
    codeToId.set(account.account_code, doc.id);
  }

  return { created: created.length, ids: created };
}

async function ensureStandardPriceProjects(names?: { selling?: string; buying?: string }) {
  const created: string[] = [];

  const sellingName = String(names?.selling ?? "Standard Selling").trim() || "Standard Selling";
  const buyingName = String(names?.buying ?? "Standard Buying").trim() || "Standard Buying";

  const required = [
    { name: sellingName, is_selling: 1, is_buying: 0 },
    { name: buyingName, is_selling: 0, is_buying: 1 },
  ] as const;

  for (const pp of required) {
    const exists = await $zodula.doctype("Price Project").get(pp.name as any).bypass(true).fields(["id"] as any);
    if (exists?.id) continue;
    const payload = {
      name: pp.name,
      description: `${pp.name} price project`,
      is_selling: pp.is_selling,
      is_buying: pp.is_buying,
    }
    const doc = await $zodula.doctype("Price Project").insert(payload);
    created.push(doc.id);
  }

  return { created: created.length, ids: created };
}

export default $action(async (ctx) => {
  const hasRoles = await $zodula.session.hasRoles(["System Admin"]);
  if (!hasRoles) return ctx.json({ error: "Unauthorized" }, 403);

  const {
    organization,
    generate_standard_accounts,
    standard_account_codes,
    create_standard_price_projects,
    standard_price_lists,
    mark_setup,
  } = ctx.body;

  let orgUpdated = false;
  if (organization && Object.keys(organization).length > 0) {
    await $zodula
      .doctype("Organization")
      .update("Organization", organization)
      .bypass(true);
    orgUpdated = true;
  }

  let accounts = { created: 0, ids: [] as string[] };
  if (generate_standard_accounts) {
    accounts = await ensureStandardAccounts(standard_account_codes);
  }

  let priceProjects = { created: 0, ids: [] as string[] };
  if (create_standard_price_projects) {
    priceProjects = await ensureStandardPriceProjects(standard_price_lists);
  }

  if (mark_setup) {
    await $zodula
      .doctype("Organization")
      .update("Organization", { is_setup: 1 } as any)
      .bypass(true);
  }

  return ctx.json({
    ok: true,
    org_updated: orgUpdated,
    accounts_created: accounts.created,
    price_projects_created: priceProjects.created,
  });
}, {
  body: z.object({
    organization: z.object({
      organization_name: z.string().optional(),
      abbr: z.string().optional(),
      tax_id: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
      currency: z.string().optional(),
    }).partial().optional(),
    generate_standard_accounts: z.boolean().optional().default(true),
    standard_account_codes: z.array(z.string()).optional(),
    create_standard_price_projects: z.boolean().optional().default(true),
    standard_price_lists: z.object({
      selling: z.string().optional(),
      buying: z.string().optional(),
    }).optional(),
    mark_setup: z.boolean().optional().default(true),
  }),
  response: {
    200: z.object({
      ok: z.literal(true),
      org_updated: z.boolean(),
      accounts_created: z.number(),
      price_projects_created: z.number(),
    }).passthrough(),
  },
});

