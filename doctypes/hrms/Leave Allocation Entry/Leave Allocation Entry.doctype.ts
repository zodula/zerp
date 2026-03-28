type EmployeeRow = {
    employee?: string;
};

type LeaveRow = {
    leave_type?: string;
    total_leaves_allowed?: number;
};

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

function samePolicyAndLeaveRows(policyRows: LeaveRow[], entryRows: LeaveRow[]) {
    if (policyRows.length !== entryRows.length) return false;
    for (let i = 0; i < policyRows.length; i++) {
        const pLeaveType = String(policyRows[i]?.leave_type ?? "").trim();
        const eLeaveType = String(entryRows[i]?.leave_type ?? "").trim();
        const pTotal = num(policyRows[i]?.total_leaves_allowed);
        const eTotal = num(entryRows[i]?.total_leaves_allowed);
        if (pLeaveType !== eLeaveType) return false;
        if (Math.abs(pTotal - eTotal) > 0.0001) return false;
    }
    return true;
}

export default $doctype<"Leave Allocation Entry">({
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        in_list_view: 1,
        default: "TODAY()",
    },
    leave_period: {
        type: "Reference",
        label: "Leave Period",
        reference: "Leave Period",
        required: 1,
        in_list_view: 1,
    },
    leave_policy: {
        type: "Reference",
        label: "Leave Policy",
        reference: "Leave Policy",
        in_list_view: 1,
    },
    employee_table: {
        type: "Reference Table",
        label: "Employee Table",
        reference: "Leave Allocation Entry Employee",
        required: 1,
    },
    leave_table: {
        type: "Reference Table",
        label: "Leave Table",
        reference: "Leave Allocation Entry Leave",
        required: 1,
    },
}, {
    label: "Leave Allocation Entry",
    naming_series: "LAE-{YYYY}-{MM}-{DD}-{#####}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "leave_period\nleave_policy",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Header", align: "left" },
                [
                    { type: "field", value: "posting_date", align: "left" },
                    { type: "field", value: "leave_period", align: "left" },
                    { type: "field", value: "leave_policy", align: "left" },
                ],
                { type: "section", value: "Employees", align: "left" },
                [
                    { type: "field", value: "employee_table", align: "left" },
                ],
                { type: "section", value: "Leave Allocation", align: "left" },
                [
                    { type: "field", value: "leave_table", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_save", async ({ doc }) => {
        const employees = (doc.employee_table ?? []) as EmployeeRow[];
        const leaveRows = (doc.leave_table ?? []) as LeaveRow[];
        if (!employees.length) throw new Error("Employee Table must have at least one row.");
        if (!leaveRows.length) throw new Error("Leave Table must have at least one row.");

        const seenEmployees = new Set<string>();
        for (const [index, row] of employees.entries()) {
            const rowNo = index + 1;
            const employee = String(row.employee ?? "").trim();
            if (!employee) throw new Error(`Employee row ${rowNo}: Employee is required.`);
            if (seenEmployees.has(employee)) throw new Error(`Employee row ${rowNo}: Duplicate Employee ${employee}.`);
            seenEmployees.add(employee);
        }

        const seenLeaveTypes = new Set<string>();
        for (const [index, row] of leaveRows.entries()) {
            const rowNo = index + 1;
            const leaveType = String(row.leave_type ?? "").trim();
            const total = num(row.total_leaves_allowed);
            if (!leaveType) throw new Error(`Leave row ${rowNo}: Leave Type is required.`);
            if (total <= 0) throw new Error(`Leave row ${rowNo}: Total Leaves Allowed must be greater than 0.`);
            if (seenLeaveTypes.has(leaveType)) throw new Error(`Leave row ${rowNo}: Duplicate Leave Type ${leaveType}.`);
            seenLeaveTypes.add(leaveType);
        }

        if (doc.leave_policy) {
            const policy = await $zodula.doctype("Leave Policy").get(String(doc.leave_policy));
            if (!policy) throw new Error(`Leave Policy ${doc.leave_policy} not found.`);
            const policyRows = (policy.leave_table ?? []) as LeaveRow[];
            if (!samePolicyAndLeaveRows(policyRows, leaveRows)) {
                throw new Error("Leave Table must match Leave Policy rows when Leave Policy is selected.");
            }
        }
    })
    .on("before_submit", async ({ doc }) => {
        const leavePeriod = String(doc.leave_period ?? "").trim();
        const postingDate = String(doc.posting_date ?? "").trim();
        const employees = (doc.employee_table ?? []) as EmployeeRow[];
        const leaveRows = (doc.leave_table ?? []) as LeaveRow[];

        for (const employeeRow of employees) {
            const employee = String(employeeRow.employee ?? "").trim();
            for (const leaveRow of leaveRows) {
                const leaveType = String(leaveRow.leave_type ?? "").trim();
                const { docs: existing } = await $zodula.doctype("Leave Allocation")
                    .select()
                    .where("employee", "=", employee)
                    .where("leave_type", "=", leaveType)
                    .where("leave_period", "=", leavePeriod);
                const duplicated = (existing ?? []).find((d) => (d as any).doc_status !== "Cancelled");
                if (duplicated) {
                    throw new Error(`Duplicate Leave Allocation found for employee ${employee}, leave type ${leaveType}, leave period ${leavePeriod}.`);
                }
            }
        }

        const createdIds: string[] = [];
        try {
            for (const employeeRow of employees) {
                const employee = String(employeeRow.employee ?? "").trim();
                for (const leaveRow of leaveRows) {
                    const payload: any = {
                        posting_date: postingDate,
                        employee,
                        leave_type: leaveRow.leave_type,
                        leave_period: leavePeriod,
                        total_leaves_allowed: num(leaveRow.total_leaves_allowed),
                    };
                    const allocation = await $zodula.doctype("Leave Allocation").insert(payload);
                    createdIds.push(allocation.id);
                    await $zodula.doctype("Leave Allocation").submit(allocation.id);
                }
            }
        } catch (err) {
            for (const id of createdIds.reverse()) {
                try {
                    const row = await $zodula.doctype("Leave Allocation").get(id);
                    if ((row as any)?.doc_status === "Submitted") {
                        await $zodula.doctype("Leave Allocation").cancel(id);
                    } else {
                        await $zodula.doctype("Leave Allocation").delete(id);
                    }
                } catch {
                    // Best effort rollback
                }
            }
            throw err;
        }
    })
    .on("after_cancel", async ({ doc }) => {
        const leavePeriod = String(doc.leave_period ?? "").trim();
        const employees = (doc.employee_table ?? []) as EmployeeRow[];
        const leaveRows = (doc.leave_table ?? []) as LeaveRow[];

        for (const employeeRow of employees) {
            const employee = String(employeeRow.employee ?? "").trim();
            if (!employee) continue;
            for (const leaveRow of leaveRows) {
                const leaveType = String(leaveRow.leave_type ?? "").trim();
                if (!leaveType) continue;
                const { docs: allocations } = await $zodula.doctype("Leave Allocation")
                    .select()
                    .where("employee", "=", employee)
                    .where("leave_type", "=", leaveType)
                    .where("leave_period", "=", leavePeriod);
                for (const row of allocations ?? []) {
                    const id = (row as any).id as string;
                    const status = String((row as any).doc_status ?? "");
                    if (!id) continue;
                    if (status === "Submitted") {
                        await $zodula.doctype("Leave Allocation").cancel(id);
                        await $zodula.doctype("Leave Allocation").delete(id);
                        continue;
                    }
                    await $zodula.doctype("Leave Allocation").delete(id);
                }
            }
        }
    });
