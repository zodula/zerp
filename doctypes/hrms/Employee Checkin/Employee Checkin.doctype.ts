export default $doctype<"Employee Checkin">({
    employee: {
        type: "Reference",
        label: "Employee",
        reference: "Employee",
        required: 1,
        in_list_view: 1,
    },
    employee_name: {
        type: "Text",
        label: "Employee Name",
        readonly: 1,
        in_list_view: 1,
        fetch_from: "employee.full_name",
    },
    work_shift: {
        type: "Reference",
        label: "Work Shift",
        reference: "Work Shift",
        required: 1,
        in_list_view: 1,
    },
    check_time: {
        type: "DateTime",
        label: "Check Time",
        required: 1,
        in_list_view: 1,
    },
    attendance_date: {
        type: "Date",
        label: "Attendance Date",
        required: 1,
        readonly: 1,
        in_list_view: 1,
    },
    employee_kiosk: {
        type: "Text",
        label: "Employee Kiosk",
    },
}, {
    label: "Employee Checkin",
    naming_series: "CHK-{YYYY}-{MM}-{DD}-{#####}",
    search_fields: "employee\nemployee_name\nattendance_date\nwork_shift",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Employee Checkin", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "employee_name", align: "left" },
                    { type: "field", value: "work_shift", align: "left" },
                ],
                [
                    { type: "field", value: "check_time", align: "left" },
                    { type: "field", value: "attendance_date", align: "left" },
                    { type: "field", value: "employee_kiosk", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_change", async ({ doc }) => {
        const employee = await $zodula.doctype("Employee").get(doc.employee);
        if (!employee) {
            throw new Error("Employee not found");
        }
        doc.employee_name = employee.full_name ?? "";
        doc.work_shift = employee.work_shift;
        const parsed = $zodula.utils.parseDate(doc.check_time as any);
        doc.attendance_date = parsed ? $zodula.utils.format(parsed, "date") : "";
    });
