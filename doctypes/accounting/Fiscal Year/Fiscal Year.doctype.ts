export default $doctype<"Fiscal Year">({
    year_name: {
        type: "Text",
        label: "Year Name",
        required: 1,
        in_list_view: 1,
    },
    start_date: {
        type: "Date",
        label: "Start Date",
        required: 1,
        in_list_view: 1,
        only_once: 1,
    },
    end_date: {
        type: "Date",
        label: "End Date",
        required: 1,
        in_list_view: 1,
        only_once: 1,
    },
    is_short_year: {
        type: "Check",
        label: "Is Short Year",
        default: "0",
        in_list_view: 1,
        only_once: 1,
    },
    description: {
        type: "Text",
        label: "Description",
    },
}, {
    label: "Fiscal Year",
    naming_series: "{{year_name}}",
    track_changes: 1,
    comments_enabled: 1,
    search_fields: "year_name\nstart_date\nend_date",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "year_name", align: "left" },
                    { type: "field", value: "is_short_year", align: "left" },
                ],
                { type: "section", value: "Period", align: "left" },
                [
                    { type: "field", value: "start_date", align: "left" },
                    { type: "field", value: "end_date", align: "left" },
                ],
                { type: "section", value: "Description", align: "left" },
                [
                    { type: "field", value: "description", align: "left" },
                ],
            ],
        },
    ]),
})
    .on("before_save", async ({ doc }) => {
        const startDate = String(doc.start_date ?? "").slice(0, 10);
        const endDate = String(doc.end_date ?? "").slice(0, 10);
        if (!startDate || !endDate) return;
        if (startDate > endDate) {
            throw new Error("End Date must be greater than or equal to Start Date.");
        }
        // Enforce only-once semantics at server side too.
        if (doc.id) {
            const prev = await $zodula.doctype("Fiscal Year").get(doc.id as any);
            if (prev) {
                const prevStart = String((prev as any).start_date ?? "").slice(0, 10);
                const prevEnd = String((prev as any).end_date ?? "").slice(0, 10);
                const prevShort = Number((prev as any).is_short_year ?? 0);
                const nextShort = Number((doc as any).is_short_year ?? 0);
                if (prevStart && prevStart !== startDate) {
                    throw new Error("start_date is only_once and cannot be changed.");
                }
                if (prevEnd && prevEnd !== endDate) {
                    throw new Error("end_date is only_once and cannot be changed.");
                }
                if (prevShort !== nextShort) {
                    throw new Error("is_short_year is only_once and cannot be changed.");
                }
            }
        }
    });
