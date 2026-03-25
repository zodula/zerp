export default $doctype({
    name: {
        type: "Text",
        label: "Name",
        required: 1,
        in_list_view: 1,
        in_quick_entry: 1,
    }
}, {
    naming_series: "{{name}}",
    search_fields: "name",
    label: "UOM",
    is_quick_entry: 1,
})