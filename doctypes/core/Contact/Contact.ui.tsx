import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";

export default function ContactScripts() {
    useEffect(() => {
        const doctype = "Contact" as const;

        // Auto-update inline_contact when contact fields change
        const updateInlineContact = (frm: FormType<typeof doctype>) => {
            const name = frm.get_value("name" as any) || "";
            const designation = frm.get_value("designation" as any) || "";
            const email = frm.get_value("email" as any) || "";
            const phone = frm.get_value("phone" as any) || "";
            const mobile = frm.get_value("mobile" as any) || "";

            const parts: string[] = [];
            
            if (name) parts.push(name);
            if (designation) parts.push(`(${designation})`);
            if (email) parts.push(email);
            if (phone) parts.push(phone);
            if (mobile && mobile !== phone) parts.push(mobile);

            const inlineContact = parts.join(" - ");
            frm.set_value("inline_contact" as any, inlineContact);
        };

        zui.form.on(doctype, {
            name: updateInlineContact,
            designation: updateInlineContact,
            email: updateInlineContact,
            phone: updateInlineContact,
            mobile: updateInlineContact,
            refresh: (frm: FormType<typeof doctype>) => {
                // Update inline contact on form load
                updateInlineContact(frm);
            }
        });
    }, []);

    return null;
}

