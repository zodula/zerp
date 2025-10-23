export default $doctype({
    party_type: {
        type: "Select",
        label: "Party Type",
        options: "Customer\nSupplier\nEmployee\nOther",
        required: 1,
        in_list_view: 1
    },
    name: {
        type: "Text",
        label: "Name",
        required: 1,
        in_list_view: 1
    },
    email: {
        type: "Email",
        label: "Email"
    },
    phone: {
        type: "Text",
        label: "Phone"
    },
    address: {
        type: "Text",
        label: "Address"
    }
}, {
    label: "Party",
    naming_series: "{{party_type}}-{{name}}",
    search_fields: "name\nemail\nphone"
})
