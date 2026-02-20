import { useEffect } from "react";
import { zui, type FormType } from "@/zodula/ui";
import type { FormContext } from "@/zodula/ui/zui";
import { zodula } from "@/zodula/client";

const doctype = "zerp__Leave Application" as const;

function calculateTotalLeaveDays(frm: FormType<typeof doctype>) {
    const fromDateVal = frm.get_value("from_date");
    const toDateVal = frm.get_value("to_date");
    if (!fromDateVal || !toDateVal) {
        frm.set_value("total_leave_days", 0);
        return;
    }
    const from = zodula.utils.parseDate(String(fromDateVal));
    const to = zodula.utils.parseDate(String(toDateVal));
    if (!from || !to) {
        frm.set_value("total_leave_days", 0);
        return;
    }
    const diffTime = to.getTime() - from.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    frm.set_value("total_leave_days", Math.max(0, diffDays));
}

function getDocStatusBadge(doc: { doc_status?: number }) {
    if (doc?.doc_status === 1) return "Submitted";
    return "Draft";
}

export default function LeaveApplicationScripts() {
    useEffect(() => {
        zui.form.on(doctype, {
            from_date: calculateTotalLeaveDays,
            to_date: calculateTotalLeaveDays,
            refresh: calculateTotalLeaveDays,
            on_render: (context: FormContext) => {
                context.addBadge("doc_status", {
                    variant: "muted",
                    size: "sm",
                    getValue: getDocStatusBadge,
                });
            },
        });
    }, []);

    return null;
}
