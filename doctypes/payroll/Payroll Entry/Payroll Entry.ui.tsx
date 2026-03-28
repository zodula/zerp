import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

export default function PayrollEntryScripts() {
    useZui((zui) => {
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
                const ids = "ids" in selected ? selected.ids : selected.id ? [selected.id] : [];
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
                    if (String(rows[i]?.salary_slip ?? "").trim()) continue;
                    const empId = String(rows[i]?.employee ?? "").trim();
                    if (!empId) continue;

                    const dup = await zodula.doc.select_docs("Salary Slip" as any, {
                        filters: [
                            ["employee", "=", empId],
                            ["start_date", "=", start],
                            ["end_date", "=", end],
                        ],
                        limit: 30,
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
                            salary_slip: (conflict as any).id,
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
                            salary_slip: slip.id,
                            net_pay: num(slip.net_pay),
                        };
                        created += 1;
                    } catch (e: any) {
                        zui.toast.error(e?.message ?? `Failed to create Salary Slip for row ${i + 1}.`);
                    }
                }

                await zodula.doc.update_doc("Payroll Entry" as any, payrollId, { employee_table: rows } as any);
                if (frm.reload) await frm.reload();
                zui.toast.success(created ? `Created ${created} Salary Slip(s).` : "Salary Slip table updated.");
            },
            { icon: "FileText", condition: (ctx) => (ctx?.doc?.doc_status ?? "Draft") === "Draft" }
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
                const rows = (frm.get_value("employee_table") ?? []) as any[];
                let submitted = 0;
                for (let i = 0; i < rows.length; i++) {
                    const slipId = String(rows[i]?.salary_slip ?? "").trim();
                    if (!slipId) continue;
                    const slip = (await zodula.doc.get_doc("Salary Slip" as any, slipId)) as any;
                    if (!slip || slip.doc_status !== "Draft") continue;
                    try {
                        await zodula.doc.submit_doc("Salary Slip" as any, slipId);
                        submitted += 1;
                    } catch (e: any) {
                        zui.toast.error(e?.message ?? `Submit failed for ${slipId}.`);
                    }
                }
                if (frm.reload) await frm.reload();
                zui.toast.success(submitted ? `Submitted ${submitted} Salary Slip(s).` : "No draft Salary Slips to submit.");
            },
            { icon: "Check", condition: (ctx) => (ctx?.doc?.doc_status ?? "Draft") === "Draft" }
        );

        zui.form.set_secondary_button(
            "Payroll Entry" as any,
            "Create Bank Payment",
            async (frm: any) => {
                const payrollId = frm.get_value("id") ?? frm?.doc?.id;
                if (!payrollId || String(payrollId).startsWith("temp-")) {
                    zui.toast.error("Save the Payroll Entry first.");
                    return;
                }
                const bank = String(frm.get_value("bank_account") ?? "").trim();
                const payable = String(frm.get_value("salaries_payable_account") ?? "").trim();
                if (!bank || !payable) {
                    zui.toast.error("Set Bank Account and Salaries Payable Account on this Payroll Entry first.");
                    return;
                }

                const rows = (frm.get_value("employee_table") ?? []) as any[];
                let created = 0;
                for (const row of rows) {
                    const slipId = String(row?.salary_slip ?? "").trim();
                    if (!slipId) continue;
                    const slip = (await zodula.doc.get_doc("Salary Slip" as any, slipId)) as any;
                    if (!slip || slip.doc_status !== "Submitted") continue;
                    if (String(slip.payment_status ?? "") === "Paid") continue;
                    const net = num(slip.net_pay);
                    if (net <= 0) continue;
                    const emp = String(slip.employee ?? "").trim();
                    if (!emp) continue;

                    try {
                        await zodula.doc.create_doc("Payment Entry" as any, {
                            payment_type: "Pay",
                            posting_date: frm.get_value("posting_date") || zodula.date.today(),
                            party_type: "Employee",
                            party: emp,
                            payment_method: "Bank",
                            account_paid_from: bank,
                            account_paid_to: payable,
                            paid_amount: net,
                            to_paid_amount: net,
                            wht_rate: 0,
                            unallocated_amount: 0,
                            references: [
                                {
                                    reference_type: "Salary Slip",
                                    reference_id: slipId,
                                    allocate_amount: net,
                                },
                            ],
                        } as any);
                        created += 1;
                    } catch (e: any) {
                        zui.toast.error(e?.message ?? `Failed to create Payment Entry for ${slipId}.`);
                    }
                }
                zui.toast.success(created ? `Created ${created} Payment Entry draft(s).` : "No unpaid submitted slips to pay.");
            },
            { icon: "Landmark", condition: (ctx) => (ctx?.doc?.doc_status ?? "Draft") === "Draft" }
        );
    }, []);
    return <></>;
}
