export default $doctype<"Employee Kiosk">({
    kiosk_name: {
        type: "Text",
        label: "Kiosk Name",
        required: 1,
        in_list_view: 1,
    },
    user: {
        type: "Reference",
        label: "User",
        reference: "User",
        required: 1,
        unique: 1,
        in_list_view: 1,
    },
    is_active: {
        type: "Check",
        label: "Is Active",
        default: "1",
        in_list_view: 1,
    },
    filter_designation: {
        type: "Reference",
        label: "Limit to designation",
        reference: "Designation",
        description: "If set, only employees with this designation are loaded for face check-in. Leave empty for no filter.",
    },
    filter_department: {
        type: "Reference",
        label: "Limit to department",
        reference: "Department",
        description: "If set, only employees in this department are loaded. Leave empty for no filter.",
    },
    filter_branch: {
        type: "Reference",
        label: "Limit to branch",
        reference: "Branch",
        description: "If set, only employees at this branch are loaded. Leave empty for no filter.",
    },
}, {
    label: "Employee Kiosk",
    naming_series: "{{kiosk_name}}",
    display_field: "kiosk_name",
    search_fields: "kiosk_name\nuser\nfilter_designation\nfilter_department\nfilter_branch",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Kiosk", align: "left" },
                [
                    { type: "field", value: "kiosk_name", align: "left" },
                    { type: "field", value: "user", align: "left" },
                    { type: "field", value: "is_active", align: "left" },
                ],
                { type: "section", value: "Face check-in scope", align: "left" },
                [
                    { type: "field", value: "filter_designation", align: "left" },
                    { type: "field", value: "filter_department", align: "left" },
                    { type: "field", value: "filter_branch", align: "left" },
                ],
            ],
        },
    ]),
});
