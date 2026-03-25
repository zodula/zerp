export default $doctype<"Salary Slip">({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        filters: JSON.stringify([["status", "=", "Active"]]),
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
    },
    posting_date: {
        type: "Date",
        label: "Posting Date",
        required: 1,
        default: "TODAY()",
    },
    payroll_frequency: {
        type: "Select",
        label: "Payroll Frequency",
        options: "Monthly\nFortnightly\nWeekly\nDaily",
    },
    start_date: {
        type: "Date",
        label: "Start Date",
        required: 1,
    },
    end_date: {
        type: "Date",
        label: "End Date",
        required: 1,
    },
    working_days: {
        type: "Float",
        label: "Working Days",
        readonly: 1,
    },
    absence_days: {
        type: "Float",
        label: "Absence Days",
        readonly: 1,
    },
    leave_without_pay_days: {
        type: "Float",
        label: "Leave Without Pay Days",
        readonly: 1,
    },
    payment_days: {
        type: "Float",
        label: "Payment Days",
        readonly: 1,
        description: "Paid day units on scheduled working days (excludes holidays & shift day-offs), from Attendance.",
    },
    calculation_note: {
        type: "Long Text",
        label: "Calculation Note",
        readonly: 1,
    },
    earnings: {
        type: "Reference Table",
        label: "Earnings",
        reference: "Salary Slip Earning",
        required: 0,
        readonly: 1,
    },
    deductions: {
        type: "Reference Table",
        label: "Deductions",
        reference: "Salary Slip Deduction",
        required: 0,
        readonly: 1,
    },
    total_earnings: {
        type: "Currency",
        label: "Total Earnings",
        required: 0,
        readonly: 1,
    },
    total_deductions: {
        type: "Currency",
        label: "Total Deductions",
        required: 0,
        readonly: 1,
    },
    net_pay: {
        type: "Currency",
        label: "Net Pay",
        required: 0,
        readonly: 1,
    },
}, {
    label: "Salary Slip",
    naming_series: "SL-{YYYY}-{MM}-{DD}-{#####}",
    search_fields: "employee\nstart_date\nend_date",
    display_field: "employee",
    is_submittable: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Salary Slip",
            layout: [
                { type: "section", value: "Employee & Period", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "posting_date", align: "left" },
                ],
                { type: "section", value: "Payroll", align: "left" },
                [
                    { type: "field", value: "payroll_frequency", align: "left" },
                    { type: "field", value: "start_date", align: "left" },
                    { type: "field", value: "end_date", align: "left" },
                ],
                [
                    { type: "field", value: "working_days", align: "left" },
                    { type: "field", value: "payment_days", align: "left" },
                    { type: "field", value: "absence_days", align: "left" },
                    { type: "field", value: "leave_without_pay_days", align: "left" },
                ],
                [
                    { type: "field", value: "calculation_note", align: "left" },
                ],
                { type: "section", value: "Earnings & Deductions", align: "left" },
                [
                    { type: "field", value: "earnings", align: "left" },
                    { type: "field", value: "deductions", align: "left" },
                ],
                // Payroll
                { type: "section", value: "Total", align: "left" },
                [
                    { type: "field", value: "total_deductions", align: "left" },
                    { type: "field", value: "total_earnings", align: "left" },
                    { type: "field", value: "net_pay", align: "left" },
                ]
            ],
        }
    ])
})
    .on("before_save", async ({ doc }) => {
        const salary_slip_doc = doc as any;
        const dayOfWeekToDayOffField: Record<number, string> = {
            0: "sun_is_day_off",
            1: "mon_is_day_off",
            2: "tue_is_day_off",
            3: "wed_is_day_off",
            4: "thu_is_day_off",
            5: "fri_is_day_off",
            6: "sat_is_day_off",
        };
        const toDateString = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };
        const dateFromString = (dateString: string) => new Date(`${dateString}T00:00:00`);
        const payroll_setting_doc = await $zodula.doctype("Payroll Setting").select().limit(1).then(r => r.docs[0] as any);
        const mark_unmarked_attendance_with = String(payroll_setting_doc?.mark_unmarked_attendance_with ?? "Present");
        const unmarked_working_day_counts_as_present = mark_unmarked_attendance_with !== "Absent";
        const social_security_percentage = Number(payroll_setting_doc?.social_security_percentage ?? 0);
        const max_social_security_deduct = Number(payroll_setting_doc?.max_social_security_deduct ?? 0);
        /** Paid day units for one scheduled working day (holiday/day-off already excluded). */
        const paidDayUnitsForAttendance = (attendance: { status: string; is_half_day?: number | string; is_leave_without_pay?: number | string } | undefined) => {
            if (!attendance) return unmarked_working_day_counts_as_present ? 1 : 0;
            const half = Number(attendance.is_half_day) === 1 ? 0.5 : 1;
            const halfAbsentOrLwp = Number(attendance.is_half_day) === 1 ? 0.5 : 0;
            if (attendance.status === "Present") return half;
            if (attendance.status === "Absent") return halfAbsentOrLwp;
            if (attendance.status === "On Leave") {
                if (Number(attendance.is_leave_without_pay) === 1) return halfAbsentOrLwp;
                return half;
            }
            return 1;
        };
        const earning_components = [
            "Base Salary",
            "Overtime",
            "Commission",
            "Diligence Allowance",
            "Bonus",
            "Allowance",
            "Meal Allowance",
            "Transport Allowance",
            "Housing Allowance",
            "Phone Allowance",
            "KPI Incentive",
            "Performance Incentive",
            "Holiday Pay",
            "Other",
        ];
        const deduction_components = [
            "Absent",
            "Leave Without Pay",
            "Late",
            "Social Security",
            "Health Insurance",
            "Tax",
            "Advance",
            "Loan",
            "Other",
        ];
        let earning_base_salary = 0;
        let earning_overtime = 0;
        let earning_commission = 0;
        let earning_diligence_allowance = 0;
        let earning_bonus = 0;
        let earning_other = 0;
        let deduction_absent = 0;
        let deduction_leave_without_pay = 0;
        let deduction_late = 0;
        let deduction_social_security = 0;
        let deduction_other = 0;
        const employee_doc = await $zodula.doctype("Employee").get(doc.employee);
        const employee_work_shift = await $zodula.doctype("Work Shift").get(employee_doc.work_shift);
        doc.employee_name = employee_doc.full_name;
        const base_salary = employee_doc.base_salary;
        const salary_type = String(employee_doc.salary_type ?? "");

        let hourly_salary = 0
        if (salary_type === "Daily") {
            hourly_salary = base_salary / 8;
        } else if (salary_type === "Fortnightly") {
            hourly_salary = base_salary / 15 / 8;
        } else if (salary_type === "Weekly") {
            hourly_salary = base_salary / 7 / 8;
        } else if (salary_type === "Monthly") {
            hourly_salary = base_salary / 30 / 8;
        } else {
            throw new Error("Invalid salary type");
        }
        const { docs: employee_attendances } = await $zodula.doctype("Attendance").select().where("employee", "=", doc.employee).where("attendance_date", ">=", doc.start_date).where("attendance_date", "<=", doc.end_date);
        const { docs: holidays } = await $zodula.doctype("Holiday").select().where("date", ">=", doc.start_date).where("date", "<=", doc.end_date);
        const holiday_date_set = new Set(holidays.map((holiday) => holiday.date));
        const attendance_by_date = new Map(employee_attendances.map((attendance) => [attendance.attendance_date, attendance]));
        const working_date_array: string[] = [];
        const absence_date_array: string[] = [];
        const leave_without_pay_date_array: string[] = [];
        const start_date = dateFromString(doc.start_date);
        const end_date = dateFromString(doc.end_date);
        for (let cursor = new Date(start_date); cursor <= end_date; cursor.setDate(cursor.getDate() + 1)) {
            const date_string = toDateString(cursor);
            if (holiday_date_set.has(date_string)) {
                continue;
            }
            const day_off_field = dayOfWeekToDayOffField[cursor.getDay()] ?? "sun_is_day_off";
            if ((employee_work_shift as any)[day_off_field]) {
                continue;
            }
            working_date_array.push(date_string);
        }
        salary_slip_doc.working_days = working_date_array.length;
        salary_slip_doc.payment_days = working_date_array.reduce((acc, date) => {
            return acc + paidDayUnitsForAttendance(attendance_by_date.get(date) as any);
        }, 0);
        salary_slip_doc.absence_days = working_date_array.reduce((acc, date) => {
            const attendance = attendance_by_date.get(date);
            if (!attendance) {
                if (unmarked_working_day_counts_as_present) return acc;
                absence_date_array.push(date);
                return acc + 1;
            }
            if (attendance.status !== "Absent") {
                return acc;
            }
            absence_date_array.push(date);
            return acc + (attendance.is_half_day ? 0.5 : 1);
        }, 0);
        salary_slip_doc.leave_without_pay_days = working_date_array.reduce((acc, date) => {
            const attendance = attendance_by_date.get(date);
            if (!attendance || attendance.status !== "On Leave" || attendance.is_leave_without_pay !== 1) {
                return acc;
            }
            leave_without_pay_date_array.push(date);
            return acc + (attendance.is_half_day ? 0.5 : 1);
        }, 0);
        if (!employee_doc) {
            throw new Error("Employee not found");
        }

        doc.earnings = [];
        doc.deductions = [];
        const { docs: additional_salaries } = await $zodula.doctype("Additional Salary").select().where("employee", "=", doc.employee).where("payroll_date", ">=", doc.start_date).where("payroll_date", "<=", doc.end_date).where("doc_status", "=", "Submitted");
        const { docs: overtime_applications } = await $zodula.doctype("Overtime Application").select().where("employee", "=", doc.employee).where("overtime_date", ">=", doc.start_date).where("overtime_date", "<=", doc.end_date).where("doc_status", "=", "Submitted");
        const additional_earning_note_lines: string[] = [];
        const additional_deduction_note_lines: string[] = [];
        for (const earning of earning_components) {
            switch (earning) {
                case "Base Salary":
                    if (salary_type === "Monthly") {
                        earning_base_salary += base_salary;
                    } else if (salary_type === "Fortnightly") {
                        earning_base_salary += base_salary / 2;
                    } else if (salary_type === "Daily") {
                        earning_base_salary += base_salary * salary_slip_doc.working_days;
                    } else {
                        throw new Error("Invalid salary type");
                    }
                    for (const additional_salary of additional_salaries) {
                        if (additional_salary.earning_component === earning && additional_salary.component_type === "Earning") {
                            earning_base_salary += additional_salary.amount;
                            additional_earning_note_lines.push(`- ${additional_salary.payroll_date}: ${earning} +${additional_salary.amount}`);
                        }
                    }
                    doc.earnings.push({
                        component_type: earning,
                        amount: earning_base_salary,
                    } as any);
                    break;
                case "Overtime":
                    earning_overtime += overtime_applications.reduce((acc, overtime) => acc + overtime.hours * overtime.rate * hourly_salary, 0);
                    for (const additional_salary of additional_salaries) {
                        if (additional_salary.earning_component === earning && additional_salary.component_type === "Earning") {
                            earning_overtime += additional_salary.amount;
                            additional_earning_note_lines.push(`- ${additional_salary.payroll_date}: ${earning} +${additional_salary.amount}`);
                        }
                    }
                    doc.earnings.push({
                        component_type: earning,
                        amount: earning_overtime,
                    } as any);
                    break;
                default:
                    earning_other += 0;
                    for (const additional_salary of additional_salaries) {
                        if (additional_salary.earning_component === earning && additional_salary.component_type === "Earning") {
                            earning_other += additional_salary.amount;
                            additional_earning_note_lines.push(`- ${additional_salary.payroll_date}: ${earning} +${additional_salary.amount}`);
                        }
                    }
                    doc.earnings.push({
                        component_type: earning,
                        amount: earning_other,
                    } as any);
                    break;
            }
        }

        for (const deduction of deduction_components) {
            switch (deduction) {
                case "Absent":
                    if (salary_type !== "Daily") {
                        deduction_absent += salary_slip_doc.absence_days * hourly_salary * 8;
                    }
                    for (const additional_salary of additional_salaries) {
                        const deduction_component = (additional_salary as any).deduction_component;
                        if (deduction_component === deduction && additional_salary.component_type === "Deduction") {
                            deduction_absent += additional_salary.amount;
                            additional_deduction_note_lines.push(`- ${additional_salary.payroll_date}: ${deduction} +${additional_salary.amount}`);
                        }
                    }
                    doc.deductions.push({
                        component_type: deduction,
                        amount: deduction_absent,
                    } as any);
                    break;
                case "Leave Without Pay":
                    if (salary_type !== "Daily") {
                        deduction_leave_without_pay += salary_slip_doc.leave_without_pay_days * hourly_salary * 8;
                    }
                    for (const additional_salary of additional_salaries) {
                        const deduction_component = (additional_salary as any).deduction_component;
                        if (deduction_component === deduction && additional_salary.component_type === "Deduction") {
                            deduction_leave_without_pay += additional_salary.amount;
                            additional_deduction_note_lines.push(`- ${additional_salary.payroll_date}: ${deduction} +${additional_salary.amount}`);
                        }
                    }
                    doc.deductions.push({
                        component_type: deduction,
                        amount: deduction_leave_without_pay,
                    } as any);
                    break;
                case "Social Security":
                    if (social_security_percentage > 0) {
                        deduction_social_security += (earning_base_salary * social_security_percentage) / 100;
                        if (max_social_security_deduct > 0) {
                            deduction_social_security = Math.min(deduction_social_security, max_social_security_deduct);
                        }
                    }
                    for (const additional_salary of additional_salaries) {
                        const deduction_component = (additional_salary as any).deduction_component;
                        if (deduction_component === deduction && additional_salary.component_type === "Deduction") {
                            deduction_social_security += additional_salary.amount;
                            additional_deduction_note_lines.push(`- ${additional_salary.payroll_date}: ${deduction} +${additional_salary.amount}`);
                        }
                    }
                    doc.deductions.push({
                        component_type: deduction,
                        amount: deduction_social_security,
                    } as any);
                    break;
                default:
                    deduction_other += 0;
                    for (const additional_salary of additional_salaries) {
                        if (additional_salary.deduction_component === deduction && additional_salary.component_type === "Deduction") {
                            deduction_other += additional_salary.amount;
                            additional_deduction_note_lines.push(`- ${additional_salary.payroll_date}: ${deduction} +${additional_salary.amount}`);
                        }
                    }
                    doc.deductions.push({
                        component_type: deduction,
                        amount: deduction_other,
                    } as any);
                    break;
            }
        }

        const overtime_note_lines = overtime_applications.map((overtime) =>
            `- ${overtime.overtime_date}: ${overtime.hours}h x rate ${overtime.rate} x hourly ${hourly_salary.toFixed(2)} = ${(overtime.hours * overtime.rate * hourly_salary).toFixed(2)}`
        );
        const calculation_note_sections: string[] = [];
        if (overtime_note_lines.length) {
            calculation_note_sections.push(
                "Overtime Calculation:",
                overtime_note_lines.join("\n")
            );
        }
        if (absence_date_array.length) {
            calculation_note_sections.push(
                "Absent Deduction Dates:",
                `- ${absence_date_array.join(", ")}`
            );
        }
        if (leave_without_pay_date_array.length) {
            calculation_note_sections.push(
                "Leave Without Pay Deduction Dates:",
                `- ${leave_without_pay_date_array.join(", ")}`
            );
        }
        if (additional_earning_note_lines.length) {
            calculation_note_sections.push(
                "Additional Salary (Earning):",
                additional_earning_note_lines.join("\n")
            );
        }
        if (additional_deduction_note_lines.length) {
            calculation_note_sections.push(
                "Additional Salary (Deduction):",
                additional_deduction_note_lines.join("\n")
            );
        }
        calculation_note_sections.unshift(
            `Working days (excl. Holiday & shift day-off): ${salary_slip_doc.working_days}`,
            `Payment days (from Attendance): ${salary_slip_doc.payment_days}`,
            `Days without Attendance row treated as: ${mark_unmarked_attendance_with} (Payroll Setting)`
        );
        salary_slip_doc.calculation_note = calculation_note_sections.join("\n\n");

        // calculate total earnings and deductions
        doc.total_earnings = doc.earnings.reduce((acc, earning) => acc + earning.amount, 0);
        doc.total_deductions = doc.deductions.reduce((acc, deduction) => acc + deduction.amount, 0);
        doc.net_pay = doc.total_earnings - doc.total_deductions;

        // for each earning and deduction, if the amount is 0, remove the item from the list
        doc.earnings = doc.earnings.filter(earning => earning.amount > 0);
        doc.deductions = doc.deductions.filter(deduction => deduction.amount > 0);
    });