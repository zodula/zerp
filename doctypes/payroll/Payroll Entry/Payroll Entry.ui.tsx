import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

type PayrollSlipUi = {
    hasDraftSlip: boolean;
    allSlipsSubmitted: boolean;
    slipCount: number;
    needsCreateSlip: boolean;
};

const payrollSlipUiCache = new Map<string, PayrollSlipUi>();

async function refreshPayrollSlipCache(frm: any) {
    const pid = String(frm.get_value("id") ?? frm?.doc?.id ?? "").trim();
    if (!pid || pid.startsWith("temp-")) {
        if (pid) payrollSlipUiCache.delete(pid);
        return;
    }
    const res = await zodula.doc.select_docs("Salary Slip" as any, {
        filters: [["payroll_entry", "=", pid]],
        limit: 500,
        sort: "id",
        order: "asc",
    });
    const docs = (res?.docs ?? []) as any[];
    const slipDocs = docs.filter((d) => String(d.doc_status ?? "") !== "Cancelled");
    const slipByEmp = new Map(slipDocs.map((s) => [String(s.employee ?? "").trim(), s]));
    const tableRows = (frm.get_value("employee_table") ?? []) as any[];
    const employees = tableRows.map((r) => String(r?.employee ?? "").trim()).filter(Boolean);
    const needsCreateSlip = employees.some((emp) => !slipByEmp.has(emp));
    const hasDraftSlip = slipDocs.some((d) => String(d.doc_status ?? "") === "Draft");
    const allSlipsSubmitted =
        employees.length > 0 &&
        employees.every((emp) => {
            const s = slipByEmp.get(emp);
            return s && String(s.doc_status ?? "") === "Submitted";
        });
    payrollSlipUiCache.set(pid, {
        hasDraftSlip,
        allSlipsSubmitted,
        slipCount: slipDocs.length,
        needsCreateSlip,
    });
}

function getPayrollSlipUi(payrollId: string | undefined): PayrollSlipUi | undefined {
    const id = String(payrollId ?? "").trim();
    if (!id) return undefined;
    return payrollSlipUiCache.get(id);
}

/** Submitted payment journals: net already paid per employee (debit lines with party Employee). */
async function sumEmployeePaidFromPaymentJournals(payrollId: string, empId: string) {
    const jes = await zodula.doc.select_docs("Journal Entry" as any, {
        filters: [
            ["reference_doctype", "=", "Payroll Entry"],
            ["reference_id", "=", payrollId],
            ["doc_status", "=", "Submitted"],
        ],
        limit: 100,
        sort: "id",
        order: "asc",
    });
    let sum = 0;
    for (const je of jes.docs ?? []) {
        const items = await zodula.doc.select_docs("Journal Entry Item" as any, {
            filters: [["parentid", "=", (je as any).id]],
            limit: 200,
            sort: "id",
            order: "asc",
        });
        for (const it of items.docs ?? []) {
            const row = it as any;
            if (String(row.party_type ?? "").trim() !== "Employee") continue;
            if (String(row.party ?? "").trim() !== empId) continue;
            sum += Math.abs(num(row.debit_amount));
        }
    }
    return sum;
}

export default function PayrollEntryScripts() {
    useZui((zui) => {
        zui.form.on("Payroll Entry" as any, {
            on_render: async (frm: any) => {
                const erp = (await zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any)) as any;
                const defaultPayable = erp?.default_payroll_payable_account;
                if (defaultPayable && !String(frm.get_value("payroll_payable_account") ?? "").trim()) {
                    await frm.set_value("payroll_payable_account", defaultPayable);
                }
                await refreshPayrollSlipCache(frm);
                const rows = (frm.get_value("employee_table") ?? []) as any[];
                await frm.set_value("employee_table", [...rows]);
            },
            employee_table: async (frm: any) => {
                await refreshPayrollSlipCache(frm);
                const rows = (frm.get_value("employee_table") ?? []) as any[];
                await frm.set_value("employee_table", [...rows]);
            },
        } as any);

        zui.form.set_secondary_button(
            "Payroll Entry" as any,
            "Get Employee",
            async (frm: any) => {
                const selected = await zui.open_multiselect_dialog(
                    {
                        doctype: "Employee",
                        standard_filter_fields: ["full_name", "employee_number", "department", "designation", "status"],
                        columns: ["full_name", "employee_number", "department", "designation", "status"],
                        defaultFilters: [["status", "=", "Active"]],
                    },
                    {
                        title: "Select Employees",
                        maxWidth: 1100,
                    }
                );
                if (!selected) return;
                const sel = selected as { ids?: string[]; id?: string };
                const ids = Array.isArray(sel.ids) ? sel.ids : sel.id ? [String(sel.id)] : [];
                if (!ids.length) return;

                const currentRows = (frm.get_value("employee_table") ?? []) as any[];
                const seen = new Set(currentRows.map((row) => String(row?.employee ?? "").trim()).filter(Boolean));
                let nextIndex = currentRows.length;
                for (const id of ids) {
                    const employeeId = String(id ?? "").trim();
                    if (!employeeId || seen.has(employeeId)) continue;
                    await frm.set_value(`employee_table.${nextIndex}.employee`, employeeId);
                    seen.add(employeeId);
                    nextIndex += 1;
                }
            },
            { icon: "Users", condition: (ctx) => (ctx?.doc?.doc_status ?? "Draft") === "Draft" }
        );

        zui.form.set_secondary_button(
            "Payroll Entry" as any,
            "Create Salary Slip",
            async (frm: any) => {
                const payrollId = frm.get_value("id") ?? frm?.doc?.id;
                if (!payrollId || String(payrollId).startsWith("temp-")) {
                    zui.toast.error("Save the Payroll Entry first.");
                    return;
                }
                if (String(frm.get_value("doc_status") ?? frm?.doc?.doc_status ?? "") !== "Submitted") {
                    zui.toast.error("Submit the Payroll Entry first.");
                    return;
                }
                const start = String(frm.get_value("start_date") ?? "").trim();
                const end = String(frm.get_value("end_date") ?? "").trim();
                if (!start || !end) {
                    zui.toast.error("Start Date and End Date are required.");
                    return;
                }
                if (start > end) {
                    zui.toast.error("Start Date must be on or before End Date.");
                    return;
                }

                const rows = [...((frm.get_value("employee_table") ?? []) as any[])];
                let created = 0;
                for (let i = 0; i < rows.length; i++) {
                    const empId = String(rows[i]?.employee ?? "").trim();
                    if (!empId) continue;

                    const linked = await zodula.doc.select_docs("Salary Slip" as any, {
                        filters: [
                            ["payroll_entry", "=", payrollId],
                            ["employee", "=", empId],
                        ],
                        limit: 10,
                        sort: "id",
                        order: "asc",
                    });
                    const existing = (linked.docs ?? []).find((d: any) => d.doc_status !== "Cancelled");
                    if (existing) {
                        const pe = String((existing as any).payroll_entry ?? "").trim();
                        if (pe && pe !== payrollId) {
                            zui.toast.error(`Employee row ${i + 1}: Salary Slip ${(existing as any).id} already linked to another Payroll Entry.`);
                            continue;
                        }
                        rows[i] = {
                            ...rows[i],
                            net_pay: num((existing as any).net_pay),
                        };
                        continue;
                    }

                    const dup = await zodula.doc.select_docs("Salary Slip" as any, {
                        filters: [
                            ["employee", "=", empId],
                            ["start_date", "=", start],
                            ["end_date", "=", end],
                        ],
                        limit: 30,
                        sort: "id",
                        order: "asc",
                    });
                    const conflict = (dup.docs ?? []).find((d: any) => d.doc_status !== "Cancelled");
                    if (conflict) {
                        const pe = String((conflict as any).payroll_entry ?? "").trim();
                        if (pe && pe !== payrollId) {
                            zui.toast.error(`Employee row ${i + 1}: Salary Slip ${(conflict as any).id} already exists for this period.`);
                            continue;
                        }
                        if (!pe) {
                            zui.toast.error(`Employee row ${i + 1}: Existing Salary Slip ${(conflict as any).id} has no Payroll Entry link. Resolve manually.`);
                            continue;
                        }
                        rows[i] = {
                            ...rows[i],
                            net_pay: num((conflict as any).net_pay),
                        };
                        continue;
                    }

                    try {
                        const slip = (await zodula.doc.create_doc("Salary Slip" as any, {
                            employee: empId,
                            posting_date: frm.get_value("posting_date") || zodula.date.today(),
                            payroll_frequency: frm.get_value("payroll_frequency") || "Monthly",
                            start_date: start,
                            end_date: end,
                            payroll_entry: payrollId,
                        } as any)) as any;
                        rows[i] = {
                            ...rows[i],
                            net_pay: num(slip.net_pay),
                        };
                        created += 1;
                    } catch (e: any) {
                        zui.toast.error(e?.message ?? `Failed to create Salary Slip for row ${i + 1}.`);
                    }
                }

                await zodula.doc.update_doc("Payroll Entry" as any, payrollId, { employee_table: rows } as any);
                await refreshPayrollSlipCache(frm);
                // wait for 1 second
                await new Promise((resolve) => setTimeout(resolve, 1000));
                if (frm.reload) await frm.reload();
                zui.toast.success(created ? `Created ${created} Salary Slip(s).` : "Salary Slip table updated.");
            },
            {
                icon: "FileText",
                condition: (ctx) => {
                    const st = String(ctx?.doc?.doc_status ?? ctx.get_value?.("doc_status") ?? "Draft");
                    if (st !== "Submitted") return false;
                    const pid = ctx?.doc?.id ?? ctx.get_value?.("id");
                    return !!getPayrollSlipUi(pid)?.needsCreateSlip;
                },
            }
        );

        zui.form.set_secondary_button(
            "Payroll Entry" as any,
            "Submit Salary Slip",
            async (frm: any) => {
                const payrollId = frm.get_value("id") ?? frm?.doc?.id;
                if (!payrollId || String(payrollId).startsWith("temp-")) {
                    zui.toast.error("Save the Payroll Entry first.");
                    return;
                }
                if (String(frm.get_value("doc_status") ?? frm?.doc?.doc_status ?? "") !== "Submitted") {
                    zui.toast.error("Submit the Payroll Entry first.");
                    return;
                }
                const rows = (frm.get_value("employee_table") ?? []) as any[];
                let submitted = 0;
                for (let i = 0; i < rows.length; i++) {
                    const empId = String(rows[i]?.employee ?? "").trim();
                    if (!empId) continue;
                    const res = await zodula.doc.select_docs("Salary Slip" as any, {
                        filters: [
                            ["payroll_entry", "=", payrollId],
                            ["employee", "=", empId],
                        ],
                        limit: 5,
                        sort: "id",
                        order: "asc",
                    });
                    const slip = (res.docs ?? []).find((d: any) => d.doc_status !== "Cancelled") as any;
                    const slipId = slip?.id ? String(slip.id) : "";
                    if (!slipId || slip.doc_status !== "Draft") continue;
                    try {
                        await zodula.doc.submit_doc("Salary Slip" as any, slipId);
                        submitted += 1;
                    } catch (e: any) {
                        zui.toast.error(e?.message ?? `Submit failed for ${slipId}.`);
                    }
                }
                await refreshPayrollSlipCache(frm);
                if (frm.reload) await frm.reload();
                zui.toast.success(submitted ? `Submitted ${submitted} Salary Slip(s).` : "No draft Salary Slips to submit.");
            },
            {
                icon: "Check",
                condition: (ctx) => {
                    const st = String(ctx?.doc?.doc_status ?? ctx.get_value?.("doc_status") ?? "Draft");
                    if (st !== "Submitted") return false;
                    const pid = ctx?.doc?.id ?? ctx.get_value?.("id");
                    const ui = getPayrollSlipUi(pid);
                    return !!ui?.hasDraftSlip;
                },
            }
        );

        zui.form.set_secondary_button(
            "Payroll Entry" as any,
            "Create Payment Journal",
            async (frm: any) => {
                const payrollId = frm.get_value("id") ?? frm?.doc?.id;
                if (!payrollId || String(payrollId).startsWith("temp-")) {
                    zui.toast.error("Save the Payroll Entry first.");
                    return;
                }
                if (String(frm.get_value("doc_status") ?? frm?.doc?.doc_status ?? "") !== "Submitted") {
                    zui.toast.error("Submit the Payroll Entry first.");
                    return;
                }
                const bank = String(frm.get_value("bank_account") ?? "").trim();
                let payable = String(frm.get_value("payroll_payable_account") ?? "").trim();
                if (!payable) {
                    const erp = (await zodula.doc.get_doc("ERP Setting" as any, "ERP Setting" as any)) as any;
                    payable = String(erp?.default_payroll_payable_account ?? "").trim();
                }
                if (!bank || !payable) {
                    zui.toast.error("Set Payment Account (Bank, Cash) and Payroll Payable (or ERP Default Payroll Payable).");
                    return;
                }

                const draftJe = await zodula.doc.select_docs("Journal Entry" as any, {
                    filters: [
                        ["reference_doctype", "=", "Payroll Entry"],
                        ["reference_id", "=", payrollId],
                        ["doc_status", "=", "Draft"],
                    ],
                    limit: 5,
                    sort: "id",
                    order: "asc",
                });
                const hasDraftPayment = (draftJe.docs ?? []).some((je: any) =>
                    String((je as any).description ?? "").startsWith("Payroll bank payment ")
                );
                if (hasDraftPayment) {
                    zui.toast.error("A draft payment Journal Entry already exists for this payroll. Submit or delete it first.");
                    return;
                }

                const rows = (frm.get_value("employee_table") ?? []) as any[];
                const items: any[] = [];
                let bankCredit = 0;

                for (const row of rows) {
                    const empId = String(row?.employee ?? "").trim();
                    if (!empId) continue;
                    const res = await zodula.doc.select_docs("Salary Slip" as any, {
                        filters: [
                            ["payroll_entry", "=", payrollId],
                            ["employee", "=", empId],
                        ],
                        limit: 5,
                        sort: "id",
                        order: "asc",
                    });
                    const slip = (res.docs ?? []).find((d: any) => d.doc_status !== "Cancelled") as any;
                    if (!slip || slip.doc_status !== "Submitted") continue;
                    const net = num(slip.net_pay);
                    if (net <= 0) continue;
                    const already = await sumEmployeePaidFromPaymentJournals(payrollId, empId);
                    const remaining = net - already;
                    if (remaining <= 0.001) continue;
                    const name = String(row?.employee_name ?? slip.employee_name ?? "").trim();
                    items.push({
                        account: payable,
                        debit_amount: remaining,
                        credit_amount: 0,
                        party_type: "Employee",
                        party: empId,
                        memo: name ? `Net pay — ${name}` : `Net pay — ${empId}`,
                    });
                    bankCredit += remaining;
                }

                if (bankCredit <= 0.001) {
                    zui.toast.error("No remaining net pay to pay (all employees settled or slips not submitted).");
                    return;
                }

                items.push({
                    account: bank,
                    debit_amount: 0,
                    credit_amount: bankCredit,
                    memo: `Bank payroll ${payrollId}`,
                });

                try {
                    await zodula.doc.create_doc("Journal Entry" as any, {
                        journal_date: frm.get_value("posting_date") || zodula.date.today(),
                        description: `Payroll bank payment ${payrollId}`,
                        reference_doctype: "Payroll Entry",
                        reference_id: payrollId,
                        journal_entry_items: items,
                    } as any);
                    zui.toast.success("Created payment Journal Entry draft. Review and submit.");
                } catch (e: any) {
                    zui.toast.error(e?.message ?? "Failed to create Journal Entry.");
                }
            },
            {
                icon: "Building2",
                condition: (ctx) => {
                    const st = String(ctx?.doc?.doc_status ?? ctx.get_value?.("doc_status") ?? "Draft");
                    if (st !== "Submitted") return false;
                    const pid = ctx?.doc?.id ?? ctx.get_value?.("id");
                    const ui = getPayrollSlipUi(pid);
                    return !!ui?.allSlipsSubmitted && (ui?.slipCount ?? 0) > 0;
                },
            }
        );
    }, []);
    return <></>;
}
