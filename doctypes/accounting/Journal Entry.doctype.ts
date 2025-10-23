export default $doctype({
    journal_date: {
        type: "Date",
        label: "Journal Date",
        required: 1,
        in_list_view: 1
    },
    description: {
        type: "Text",
        label: "Description"
    },
    reference_doctype: {
        type: "Text",
        label: "Reference Doctype"
    },
    reference_id: {
        type: "Text",
        label: "Reference ID"
    },
    created_by: {
        type: "Reference",
        label: "Created By",
        reference: "zodula__User",
        required: 1
    },
    approved_by: {
        type: "Reference",
        label: "Approved By",
        reference: "zodula__User"
    }
}, {
    label: "Journal Entry",
    naming_series: "JE-{{journal_date}}",
    is_submittable: 1,
    track_changes: 1,
    search_fields: "description\nreference_doctype\nreference_id"
})
