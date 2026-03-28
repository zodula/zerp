import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

function toLeaveRows(rows: any[]) {
    return rows.map((row) => ({
        leave_type: row.leave_type ?? "",
        total_leaves_allowed: row.total_leaves_allowed ?? 0,
    }));
}

export default function LeaveAllocationEntryScripts() {
    useZui((zui) => {
        async function applyLeavePolicyToTable(frm: any) {
            const leavePolicy = String(frm.get_value("leave_policy") ?? "").trim();
            if (!leavePolicy) {
                await frm.set_df_property("leave_table", "readonly", 0);
                return;
            }
            const policy = await zodula.doc.get_doc("Leave Policy" as any, leavePolicy) as any;
            const policyRows = toLeaveRows(policy?.leave_table ?? []);
            frm.clear_table?.("leave_table");
            for (let i = 0; i < policyRows.length; i++) {
                await frm.set_value(`leave_table.${i}.leave_type`, policyRows[i].leave_type);
                await frm.set_value(`leave_table.${i}.total_leaves_allowed`, policyRows[i].total_leaves_allowed);
            }
            await frm.set_df_property("leave_table", "readonly", 1);
        }

        zui.form.on("Leave Allocation Entry" as any, {
            on_render: async (frm: any) => {
                await applyLeavePolicyToTable(frm);
            },
            leave_policy: async (frm: any) => {
                await applyLeavePolicyToTable(frm);
            },
        } as any);

        zui.form.set_secondary_button("Leave Allocation Entry", "Select Employees", async (frm) => {
            const selected = await zui.open_multiselect_dialog({
                doctype: "Employee",
                standard_filter_fields: ["full_name", "employee_number", "department", "designation", "status"],
                columns: ["full_name", "employee_number", "department", "designation", "status"],
                defaultFilters: [["status", "=", "Active"]],
            }, {
                title: "Select Employees",
                maxWidth: 1100,
            });
            if (!selected) return;
            const ids = "ids" in selected ? selected.ids : (selected.id ? [selected.id] : []);
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
        }, { icon: "Users", condition: (ctx) => (ctx?.doc?.doc_status ?? "Draft") === "Draft" });
    }, []);
    return <></>;
}
