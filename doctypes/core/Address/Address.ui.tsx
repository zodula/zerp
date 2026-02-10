import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";

export default function AddressScripts() {
    useEffect(() => {
        const doctype = "zerp__Address" as const;

        // Auto-update inline_address when address fields change
        const updateInlineAddress = (frm: FormType<typeof doctype>) => {
            const addressLine1 = frm.get_value("address_line1" as any) || "";
            const addressLine2 = frm.get_value("address_line2" as any) || "";
            const city = frm.get_value("city" as any) || "";
            const province = frm.get_value("province" as any) || "";
            const postalCode = frm.get_value("postal_code" as any) || "";
            const country = frm.get_value("country" as any) || "";

            const parts: string[] = [];
            
            if (addressLine1) parts.push(addressLine1);
            if (addressLine2) parts.push(addressLine2);
            if (city) parts.push(city);
            if (province) parts.push(province);
            if (postalCode) parts.push(postalCode);
            if (country) parts.push(country);

            const inlineAddress = parts.join(" ");
            frm.set_value("inline_address" as any, inlineAddress);
        };

        zui.form.on(doctype, {
            address_line1: updateInlineAddress,
            address_line2: updateInlineAddress,
            city: updateInlineAddress,
            province: updateInlineAddress,
            postal_code: updateInlineAddress,
            country: updateInlineAddress,
            refresh: (frm: FormType<typeof doctype>) => {
                // Update inline address on form load
                updateInlineAddress(frm);
            }
        });
    }, []);

    return null;
}

