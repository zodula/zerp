import { z } from "bxo";

const dayPrefixByWeekday: Record<number, string> = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
};

function toDate(value: string): Date {
    return new Date(`${value}T00:00:00`);
}

function toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toMinutesFromTime(time: string): number {
    const [hh = "0", mm = "0"] = String(time || "00:00:00").split(":");
    return (parseInt(hh, 10) || 0) * 60 + (parseInt(mm, 10) || 0);
}

function toMinutesFromDateTime(value: string): number {
    const date = new Date(value);
    return date.getHours() * 60 + date.getMinutes();
}

/** Length of shift window in minutes (handles end before start as next-day end). */
function shiftWindowMinutes(shift_start: number, shift_end: number): number {
    if (shift_end >= shift_start) return shift_end - shift_start;
    return 24 * 60 - shift_start + shift_end;
}

export default $action(async (ctx) => {
    const hasRole = await $zodula.session.hasRoles(["System Admin", "HR Manager"]);
    if (!hasRole) return ctx.json({ error: "Unauthorized" }, 403);

    const employee_ids = (ctx.body.employee_ids ?? []) as string[];
    const start_date = String(ctx.body.start_date ?? "");
    const end_date = String(ctx.body.end_date ?? "");
    const force_process_duplicates = Number(ctx.body.force_process_duplicates ?? 0) === 1;
    if (!employee_ids.length || !start_date || !end_date) {
        return ctx.json({ error: "Missing required fields" }, 400);
    }

    const { docs: employee_docs } = await $zodula
        .doctype("Employee")
        .select()
        .where("id", "IN", employee_ids as any);
    const employee_map = new Map((employee_docs ?? []).map((row: any) => [row.id, row]));

    const { docs: holiday_docs } = await $zodula
        .doctype("Holiday")
        .select()
        .where("date", ">=", start_date)
        .where("date", "<=", end_date);
    const holiday_set = new Set((holiday_docs ?? []).map((h: any) => String(h.date)));

    const { docs: existing_attendance_docs } = await $zodula
        .doctype("Attendance")
        .select()
        .where("employee", "IN", employee_ids as any)
        .where("attendance_date", ">=", start_date)
        .where("attendance_date", "<=", end_date);
    const existing_key_set = new Set((existing_attendance_docs ?? []).map((a: any) => `${a.employee}::${a.attendance_date}`));

    const duplicates = Array.from(existing_key_set).map((key) => {
        const [employee, attendance_date] = key.split("::");
        const employee_name = employee_map.get(employee)?.full_name ?? employee;
        return { employee, employee_name, attendance_date };
    });
    if (duplicates.length > 0 && !force_process_duplicates) {
        return ctx.json({
            ok: true,
            needs_confirm: true,
            duplicates,
            created: 0,
            created_count: 0,
            created_attendance_ids: [] as string[],
            skipped_holiday_or_dayoff: [] as Array<{ employee: string; employee_name: string; attendance_date: string; reason: "Holiday" | "Day Off" }>,
            skipped_holiday_or_day_off: 0,
            skipped_duplicate: duplicates.length,
        });
    }

    const { docs: checkin_docs } = await $zodula
        .doctype("Employee Checkin")
        .select()
        .where("employee", "IN", employee_ids as any)
        .where("attendance_date", ">=", start_date)
        .where("attendance_date", "<=", end_date);
    const checkins_by_key = new Map<string, any[]>();
    for (const checkin of (checkin_docs ?? [])) {
        const key = `${checkin.employee}::${checkin.attendance_date}`;
        const list = checkins_by_key.get(key) || [];
        list.push(checkin);
        checkins_by_key.set(key, list);
    }

    const work_shift_cache = new Map<string, any>();
    let created = 0;
    let skipped_holiday_or_day_off = 0;
    let skipped_duplicate = 0;
    const created_attendance_ids: string[] = [];
    const skipped_holiday_or_dayoff_list: Array<{
        employee: string;
        employee_name: string;
        attendance_date: string;
        reason: "Holiday" | "Day Off";
    }> = [];

    const start = toDate(start_date);
    const end = toDate(end_date);
    for (const employee_id of employee_ids) {
        const employee = employee_map.get(employee_id);
        if (!employee) continue;
        if (!employee.work_shift) continue;
        if (!work_shift_cache.has(employee.work_shift)) {
            const work_shift = await $zodula.doctype("Work Shift").get(employee.work_shift);
            work_shift_cache.set(employee.work_shift, work_shift);
        }
        const work_shift = work_shift_cache.get(employee.work_shift);
        if (!work_shift) continue;

        for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
            const attendance_date = toDateString(cursor);
            if (holiday_set.has(attendance_date)) {
                skipped_holiday_or_day_off += 1;
                skipped_holiday_or_dayoff_list.push({
                    employee: employee_id,
                    employee_name: String(employee.full_name ?? employee_id),
                    attendance_date,
                    reason: "Holiday",
                });
                continue;
            }
            const day_prefix = dayPrefixByWeekday[cursor.getDay()] || "sun";
            if (Number(work_shift[`${day_prefix}_is_day_off`] ?? 0) === 1) {
                skipped_holiday_or_day_off += 1;
                skipped_holiday_or_dayoff_list.push({
                    employee: employee_id,
                    employee_name: String(employee.full_name ?? employee_id),
                    attendance_date,
                    reason: "Day Off",
                });
                continue;
            }

            const attendance_key = `${employee_id}::${attendance_date}`;
            if (existing_key_set.has(attendance_key)) {
                skipped_duplicate += 1;
                continue;
            }

            let status: "Present" | "Absent" = "Absent";
            let is_late_entry = 0;
            let is_early_exit = 0;
            let is_half_day = 0;

            const day_checkins = (checkins_by_key.get(attendance_key) || []).sort((a, b) =>
                String(a.check_time).localeCompare(String(b.check_time))
            );
            if (day_checkins.length) {
                status = "Present";
                const shift_start = toMinutesFromTime(String(work_shift[`${day_prefix}_start_time`] || "00:00:00"));
                const shift_end = toMinutesFromTime(String(work_shift[`${day_prefix}_end_time`] || "00:00:00"));
                const break_start_m = toMinutesFromTime(String(work_shift[`${day_prefix}_break_start`] || "00:00:00"));
                const break_end_m = toMinutesFromTime(String(work_shift[`${day_prefix}_break_end`] || "00:00:00"));
                const break_amount = break_end_m > break_start_m ? break_end_m - break_start_m : 0;
                const early_entry_allowance = Number(work_shift.can_early_entry ?? 0) || 0;
                const late_allowance = Number(work_shift.can_late_entry ?? 0) || 0;
                const early_exit_allowance = Number(work_shift.can_early_exit ?? 0) || 0;
                const late_exit_allowance = Number(work_shift.can_late_exit ?? 0) || 0;
                const min_check_time = shift_start - early_entry_allowance;
                const max_check_time = shift_end + late_exit_allowance;
                const valid_checkins = day_checkins.filter((item) => {
                    const minute = toMinutesFromDateTime(String(item.check_time));
                    return minute >= min_check_time && minute <= max_check_time;
                });
                const candidate_checkins = valid_checkins.length ? valid_checkins : day_checkins;
                const first_check = toMinutesFromDateTime(String(candidate_checkins[0].check_time));
                const last_check = toMinutesFromDateTime(String(candidate_checkins[candidate_checkins.length - 1].check_time));
                is_late_entry = first_check > shift_start + late_allowance ? 1 : 0;
                is_early_exit = last_check < shift_end - early_exit_allowance ? 1 : 0;

                const gross_shift_min = shiftWindowMinutes(shift_start, shift_end);
                const work_shift_time = Math.max(0, gross_shift_min - break_amount);
                const half_work_shift_time = work_shift_time / 2;
                const presence_to_last = last_check - shift_start - break_amount;
                if (work_shift_time > 0 && half_work_shift_time > 0 && presence_to_last < half_work_shift_time) {
                    is_half_day = 1;
                }
            }

            const att = await $zodula.doctype("Attendance").insert({
                employee: employee_id,
                employee_name: employee.full_name ?? "",
                attendance_date,
                status,
                is_late_entry,
                is_early_exit,
                is_half_day,
            } as any);
            created += 1;
            if (att?.id) created_attendance_ids.push(String(att.id));
        }
    }

    return ctx.json({
        ok: true,
        needs_confirm: false,
        duplicates: [] as any[],
        created,
        created_count: created,
        created_attendance_ids,
        skipped_holiday_or_dayoff: skipped_holiday_or_dayoff_list,
        skipped_holiday_or_day_off,
        skipped_duplicate,
    });
}, {
    body: z.object({
        employee_ids: z.array(z.string()).min(1),
        start_date: z.string(),
        end_date: z.string(),
        force_process_duplicates: z.number().optional().default(0),
    }),
    response: {
        200: z.object({
            ok: z.boolean(),
            needs_confirm: z.boolean(),
            duplicates: z.array(z.object({
                employee: z.string(),
                employee_name: z.string(),
                attendance_date: z.string(),
            })),
            created: z.number(),
            created_count: z.number(),
            created_attendance_ids: z.array(z.string()),
            skipped_holiday_or_dayoff: z.array(z.object({
                employee: z.string(),
                employee_name: z.string(),
                attendance_date: z.string(),
                reason: z.enum(["Holiday", "Day Off"]),
            })),
            skipped_holiday_or_day_off: z.number(),
            skipped_duplicate: z.number(),
        }).passthrough(),
    },
});
