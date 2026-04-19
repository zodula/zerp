import { z } from "bxo";

const ERP_DEFAULT_ACCOUNT_CODE_TO_FIELD: Record<string, string> = {
  "5218": "default_write_off_account",
  "1310": "default_receivable_account",
  "2110": "default_payable_account",
  "5212": "default_round_off_account",
  "2120": "default_payroll_payable_account",
  "1610": "default_employee_advance_account",
};

const PAYROLL_DEFAULT_ACCOUNT_CODE_TO_FIELD: Record<string, string> = {
  "5213": "default_salary_expense_account",
};

async function applySetupDefaultAccountsFromChart() {
  const codes = [
    ...Object.keys(ERP_DEFAULT_ACCOUNT_CODE_TO_FIELD),
    ...Object.keys(PAYROLL_DEFAULT_ACCOUNT_CODE_TO_FIELD),
  ];
  if (!codes.length) return { erp_fields_set: 0, payroll_fields_set: 0 };

  const res = await $zodula
    .doctype("Account")
    .select()
    .where("account_code", "IN", codes as any)
    .bypass(true)
    .fields(["id", "account_code"] as any);

  const accountCodeToId: Record<string, string> = {};
  for (const d of res.docs ?? []) {
    accountCodeToId[(d as any).account_code] = (d as any).id;
  }

  const erpPatch: Record<string, string> = {};
  for (const [accountCode, fieldName] of Object.entries(ERP_DEFAULT_ACCOUNT_CODE_TO_FIELD)) {
    const id = accountCodeToId[accountCode];
    if (id) erpPatch[fieldName] = id;
  }

  const payrollPatch: Record<string, string> = {};
  for (const [accountCode, fieldName] of Object.entries(PAYROLL_DEFAULT_ACCOUNT_CODE_TO_FIELD)) {
    const id = accountCodeToId[accountCode];
    if (id) payrollPatch[fieldName] = id;
  }

  let erp_fields_set = 0;
  if (Object.keys(erpPatch).length) {
    const erpRow = (await $zodula.doctype("ERP Setting").select().limit(1).bypass(true)).docs?.[0] as any;
    const merged: Record<string, string> = {};
    for (const [k, v] of Object.entries(erpPatch)) {
      if (erpRow?.[k] == null || String(erpRow[k]).trim() === "") merged[k] = v;
    }
    if (Object.keys(merged).length) {
      await $zodula.doctype("ERP Setting").update("ERP Setting" as any, merged as any).bypass(true);
      erp_fields_set = Object.keys(merged).length;
    }
  }

  let payroll_fields_set = 0;
  if (Object.keys(payrollPatch).length) {
    const payrollRow = (await $zodula.doctype("Payroll Setting").select().limit(1).bypass(true)).docs?.[0] as any;
    const merged: Record<string, string> = {};
    for (const [k, v] of Object.entries(payrollPatch)) {
      if (payrollRow?.[k] == null || String(payrollRow[k]).trim() === "") merged[k] = v;
    }
    if (Object.keys(merged).length) {
      await $zodula.doctype("Payroll Setting").update("Payroll Setting" as any, merged as any).bypass(true);
      payroll_fields_set = Object.keys(merged).length;
    }
  }

  return { erp_fields_set, payroll_fields_set };
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

async function ensureFiscalYear(input?: {
  year_name?: string;
  start_date?: string;
  end_date?: string;
}) {
  const today = $zodula.date.today();
  const yyyy = Number(String(today).slice(0, 4)) || new Date().getFullYear();
  const fallbackYearName = String(yyyy);
  const fallbackStart = `${fallbackYearName}-01-01`;
  const fallbackEnd = `${fallbackYearName}-12-31`;

  const yearName = String(input?.year_name ?? fallbackYearName).trim() || fallbackYearName;
  const startDate = String(input?.start_date ?? fallbackStart).slice(0, 10);
  const endDate = String(input?.end_date ?? fallbackEnd).slice(0, 10);

  if (startDate > endDate) {
    throw new Error("Fiscal Year end_date must be greater than or equal to start_date.");
  }

  const existing = await $zodula.doctype("Fiscal Year").get(yearName as any).bypass(true).fields(["id"] as any);
  if (!existing?.id) {
    await $zodula.doctype("Fiscal Year").insert({
      year_name: yearName,
      start_date: startDate,
      end_date: endDate,
      is_short_year: 0,
    } as any);
    return { created: 1, id: yearName };
  }

  await $zodula.doctype("Fiscal Year").update(yearName as any, {
    year_name: yearName,
    start_date: startDate,
    end_date: endDate,
    is_short_year: 0,
  } as any).bypass(true);
  return { created: 0, id: yearName };
}

export default $action(async (ctx) => {
  const hasRoles = await $zodula.session.hasRoles(["System Admin"]);
  if (!hasRoles) return ctx.json({ error: "Unauthorized" }, 403);

  const {
    organization,
    create_standard_price_projects,
    standard_price_lists,
    fiscal_year,
    mark_setup,
  } = ctx.body;

  let orgUpdated = false;
  if (organization && Object.keys(organization).length > 0) {
    const currency = (organization as any)?.currency;
    const { currency: _c, ...orgFields } = organization as any;

    await $zodula
      .doctype("Organization")
      .update("Organization", orgFields)
      .bypass(true);
    orgUpdated = true;

    if (currency != null && currency !== "") {
      await $zodula
        .doctype("Global Setting")
        .update("Global Setting", { currency: String(currency).trim() } as any)
        .bypass(true);
    }
  }

  const defaults = await applySetupDefaultAccountsFromChart();
  const erp_setting_defaults_set = defaults.erp_fields_set;
  const payroll_setting_defaults_set = defaults.payroll_fields_set;

  let priceProjects = { created: 0, ids: [] as string[] };
  if (create_standard_price_projects) {
    priceProjects = await ensureStandardPriceProjects(standard_price_lists);
  }

  const fiscalYearResult = await ensureFiscalYear(fiscal_year);

  if (mark_setup) {
    await $zodula
      .doctype("Global Setting")
      .update("Global Setting", { is_setup: 1 } as any)
      .bypass(true);
  }

  return ctx.json({
    ok: true,
    org_updated: orgUpdated,
    erp_setting_defaults_set,
    payroll_setting_defaults_set,
    price_projects_created: priceProjects.created,
    fiscal_year_id: fiscalYearResult.id,
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
    create_standard_price_projects: z.boolean().optional().default(true),
    standard_price_lists: z.object({
      selling: z.string().optional(),
      buying: z.string().optional(),
    }).optional(),
    fiscal_year: z.object({
      year_name: z.string().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
    }).optional(),
    mark_setup: z.boolean().optional().default(true),
  }),
  response: {
    200: z.object({
      ok: z.literal(true),
      org_updated: z.boolean(),
      erp_setting_defaults_set: z.number().optional(),
      payroll_setting_defaults_set: z.number().optional(),
      price_projects_created: z.number(),
      fiscal_year_id: z.string().optional(),
    }).passthrough(),
  },
});

