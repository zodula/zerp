export default $doctype<"Price Project">(
    {
        name: {
            type: "Text",
            label: "Name",
            required: 1,
            in_list_view: 1
        },
        description: {
            type: "Text",
            label: "Description",
            in_quick_entry: 1
        },
        is_selling: {
            type: "Check",
            label: "Is Selling",
            default: "0",
            description: "When enabled, this price project is used for selling items.",
        },
        is_buying: {
            type: "Check",
            label: "Is Buying",
            default: "0",
            description: "When enabled, this price project is used for buying items.",
        },
    }, {
    label: "Price Project",
    naming_series: "{{name}}",
    search_fields: "name\ndescription",
    is_quick_entry: 1,
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Basic Information", align: "left" },
                [
                    { type: "field", value: "name", align: "left" },
                    { type: "field", value: "description", align: "left" }
                ]
            ]
        }
    ])
})
    .on("before_save", async ({ doc }) => {
        if (doc.is_selling !== 1 && doc.is_buying !== 1) {
            throw new Error("At least one of Is Selling or Is Buying must be enabled.");
        }
        if (doc.is_selling === 1) {
            doc.is_buying = 0;
        }
        if (doc.is_buying === 1) {
            doc.is_selling = 0;
        }
    });

