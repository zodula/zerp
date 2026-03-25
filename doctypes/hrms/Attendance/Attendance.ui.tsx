import { zodula } from "@/zodula/client";
import { useZui } from "@/zodula/ui";

type ProcessAttendanceResult = {
    ok: boolean;
    needs_confirm: boolean;
    duplicates: Array<{ employee: string; employee_name: string; attendance_date: string }>;
    created: number;
    skipped_holiday_or_day_off: number;
    skipped_duplicate: number;
};

export default function AttendanceScripts() {
    useZui(async (zui) => {
        zui.list.set_secondary_button("Attendance", "Process Attendance", async (ctx) => {
            let did_process = false;
            const result = await zui.open_multiselect_dialog({
                doctype: "Employee",
                standard_filter_fields: [
                    "full_name",
                    "employee_number",
                    "department",
                    "designation",
                    "branch",
                    "work_shift",
                    "status",
                ],
                columns: [
                    "full_name",
                    "employee_number",
                    "department",
                    "designation",
                    "branch",
                    "work_shift",
                    "status",
                ],
                extend_fields: [
                    { name: "start_date", label: "Start Date", type: "Date", required: true },
                    { name: "end_date", label: "End Date", type: "Date", required: true },
                ],
                defaultFilters: [["status", "=", "Active"]],
                on_submit: async (payload) => {
                    const employee_ids = "ids" in payload ? payload.ids : (payload.id ? [payload.id] : []);
                    const extend_values = payload.extend_values || {};
                    const start_date = String(extend_values.start_date || "");
                    const end_date = String(extend_values.end_date || "");
                    if (!employee_ids.length || !start_date || !end_date) {
                        zui.toast.error("Employee, start date and end date are required");
                        return false;
                    }

                    const call = async (force_process_duplicates: 0 | 1) => {
                        return await zodula.action("zerp.hrms.process_attendance" as any, {
                            data: {
                                employee_ids,
                                start_date,
                                end_date,
                                force_process_duplicates,
                            },
                        }) as ProcessAttendanceResult;
                    };

                    const first = await call(0);
                    if (first?.needs_confirm && (first.duplicates?.length || 0) > 0) {
                        const preview = first.duplicates
                            .slice(0, 20)
                            .map((item) => `- ${item.employee_name} (${item.employee}) - ${item.attendance_date}`)
                            .join("\n");
                        const hidden_count = Math.max((first.duplicates?.length || 0) - 20, 0);
                        const should_continue = await zui.confirm({
                            title: "Duplicate Attendance Found",
                            message:
                                `Attendance will not be processed for duplicated employee/date rows.\n\n` +
                                `${preview}` +
                                (hidden_count > 0 ? `\n... and ${hidden_count} more duplicate rows.` : "") +
                                `\n\nContinue processing remaining records?`,
                            confirmText: "Continue",
                        } as any);
                        if (!should_continue) return false;
                        const second = await call(1);
                        zui.toast.success(
                            `Processed. Created: ${second.created}, Skipped Holiday/Day Off: ${second.skipped_holiday_or_day_off}, Skipped Duplicate: ${second.skipped_duplicate}`
                        );
                        did_process = true;
                        return true;
                    }

                    zui.toast.success(
                        `Processed. Created: ${first.created}, Skipped Holiday/Day Off: ${first.skipped_holiday_or_day_off}, Skipped Duplicate: ${first.skipped_duplicate}`
                    );
                    did_process = true;
                    return true;
                },
            }, {
                title: "Process Attendance",
                description: "This will process attendnace from Emplyee Checkin",
                width: "min(96vw, 1100px)",
                maxWidth: "1100px",
            });

            if (!result) return;
            if (!did_process) return;
            await ctx.reload?.();
        }, { icon: "Calendar" });
    }, []);
    return <></>;
}
