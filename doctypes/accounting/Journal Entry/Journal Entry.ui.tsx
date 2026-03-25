import { useZui } from "@/zodula/ui";

const num = (v: any) => parseFloat(String(v ?? 0)) || 0;

function recalcTotals(frm: any) {
    const rows = (frm.get_value("journal_entry_items") ?? []) as any[];
    const totalDebit = rows.reduce((sum, r) => sum + num(r?.debit_amount), 0);
    const totalCredit = rows.reduce((sum, r) => sum + num(r?.credit_amount), 0);
    frm.set_value("total_debit", totalDebit);
    frm.set_value("total_credit", totalCredit);
}

export default function JournalEntryScripts() {
    useZui((zui) => {
        zui.form.on("Journal Entry", {
            on_render: recalcTotals,
            journal_entry_items: recalcTotals,
            "journal_entry_items.idx": recalcTotals,
            "journal_entry_items.debit_amount": (frm) => {
                const idx = frm.idx ?? 0;
                const debit = num(frm.get_value(`journal_entry_items.${idx}.debit_amount`));
                if (debit > 0) {
                    frm.set_value(`journal_entry_items.${idx}.credit_amount`, 0);
                }
                recalcTotals(frm);
            },
            "journal_entry_items.credit_amount": (frm) => {
                const idx = frm.idx ?? 0;
                const credit = num(frm.get_value(`journal_entry_items.${idx}.credit_amount`));
                if (credit > 0) {
                    frm.set_value(`journal_entry_items.${idx}.debit_amount`, 0);
                }
                recalcTotals(frm);
            },
        });
    }, []);
    return <></>;
}
