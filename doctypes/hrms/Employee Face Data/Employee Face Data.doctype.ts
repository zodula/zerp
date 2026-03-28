import {
    generateFaceDescriptorFromImageFilePath,
    zodulaFileUrlToAbsolutePath,
} from "@/zodula/face/server";
import fs from "fs/promises";

export default $doctype<"Employee Face Data">({
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
    },
    face_descriptor: {
        type: "JSON",
        label: "Face Descriptor",
        description: "Float array from face-api.js (typically 128 numbers).",
    },
    employee_image: {
        type: "File",
        label: "Employee Image",
        description: "Source image used to produce face data.",
    },
    is_active: {
        type: "Check",
        label: "Is Active",
        default: "1",
        in_list_view: 1,
    },
    last_captured_at: {
        type: "DateTime",
        label: "Last Captured At",
    },
}, {
    label: "Employee Face Data",
    naming_series: "{{employee}}",
    display_field: "employee_name",
    search_fields: "employee\nemployee_name",
    tabs: JSON.stringify([
        {
            type: "Tab",
            label: "Main",
            layout: [
                { type: "section", value: "Face Data", align: "left" },
                [
                    { type: "field", value: "employee", align: "left" },
                    { type: "field", value: "employee_name", align: "left" },
                ],
                [
                    { type: "field", value: "is_active", align: "left" },
                    { type: "field", value: "last_captured_at", align: "left" },
                ],
                { type: "field", value: "employee_image", align: "left" },
                { type: "field", value: "face_descriptor", align: "left" },
            ],
        },
    ]),
})
    .on("before_save", async ({ doc }) => {
        const employee = await $zodula.doctype("Employee").get(doc.employee);
        if (!employee) {
            throw new Error("Employee not found");
        }
        doc.employee_name = employee.full_name ?? "";
        // Keep captured timestamp in sync when image/descriptor is provided.
        if (doc.employee_image || doc.face_descriptor) {
            doc.last_captured_at = $zodula.utils.format(new Date(), "datetime");
        }
        if (!doc.employee_image) {
            doc.face_descriptor = null;
            doc.last_captured_at = $zodula.utils.format(new Date(), "datetime");
        }
    })
    .on("after_save", async ({ old, doc }) => {
        const url = doc.employee_image;
        if (!url || typeof url !== "string") return;

        const prevImg = old?.employee_image;
        const sameImage = String(prevImg || "") === String(url);
        console.log("sameImage", sameImage);
        if (sameImage && doc.face_descriptor) return;

        const absPath = zodulaFileUrlToAbsolutePath(url);
        if (!absPath) return;

        await fs.access(absPath);
        const descriptor = await generateFaceDescriptorFromImageFilePath(absPath);
        const now = $zodula.utils.format(new Date(), "datetime");
        await $zodula
            .doctype("Employee Face Data")
            .update(doc.id, {
                face_descriptor: JSON.stringify(descriptor || []),
                last_captured_at: now,
            } as any)
            .bypass(true);
    });
