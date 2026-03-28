export default $doctype({
    name: {
        type: "Text",
        label: "Name",
        required: 1
    }
}, {
    label: "Item Category",
    search_fields: "name",
    display_field: "name",
    naming_series: "{{name}}",
    is_quick_entry: 1
})