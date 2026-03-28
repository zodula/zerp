type LeavePolicyRow = {
    leave_type?: string;
    total_leaves_allowed?: number;
};

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

export default $doctype<"Leave Policy">({
    policy_name: {
        type: "Text",
        label: "Policy Name",
        required: 1,
        in_list_view: 1,
    },
    is_active: {
        type: "Check",
        label: "Is Active",
        default: "1",
        in_list_view: 1,
    },
    leave_table: {
        type: "Reference Table",
        label: "Leave Table",
        reference: "Leave Policy Detail",
        required: 1,
    },
}, {
    label: "Leave Policy",
    naming_series: "LPOL-{YYYY}-{#####}",
    search_fields: "policy_name",
    track_changes: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Policy", align: "left" },
                [
                    { type: "field", value: "policy_name", align: "left" },
                    { type: "field", value: "is_active", align: "left" },
                ],
                { type: "section", value: "Leave Table", align: "left" },
                [
                    { type: "field", value: "leave_table", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_save", async ({ doc }) => {
        const rows = (doc.leave_table ?? []) as LeavePolicyRow[];
        if (!rows.length) {
            throw new Error("Leave Policy must have at least one leave row.");
        }
        const seen = new Set<string>();
        for (const [index, row] of rows.entries()) {
            const rowNo = index + 1;
            const leaveType = String(row.leave_type ?? "").trim();
            const total = num(row.total_leaves_allowed);
            if (!leaveType) throw new Error(`Row ${rowNo}: Leave Type is required.`);
            if (total <= 0) throw new Error(`Row ${rowNo}: Total Leaves Allowed must be greater than 0.`);
            if (seen.has(leaveType)) throw new Error(`Row ${rowNo}: Duplicate Leave Type ${leaveType}.`);
            seen.add(leaveType);
        }
    });
