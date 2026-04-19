import React, { useCallback, useEffect, useMemo, useState } from "react";
import { zodula } from "@/zodula/client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/zodula/ui/components/ui/dialog";
import { Button } from "@/zodula/ui/components/ui/button";
import { FormControl } from "@/zodula/ui/components/ui/form-control";
import { toast } from "@/zodula/ui/components/ui/toast";
import { useAuth } from "@/zodula/ui/hooks/use-auth";

export type OrgInfo = {
  id: string;
  organization_name?: string | null;
  abbr?: string | null;
  currency?: string | null;
  is_setup?: number | null;
};

type SetupTemplate = {
  default_price_lists: { selling: string; buying: string };
};

export default function SetupWizard({
  shouldOpen,
  org,
  onSetupComplete,
}: {
  shouldOpen: boolean;
  org: OrgInfo | null;
  onSetupComplete: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const open = shouldOpen && isAuthenticated;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    organization_name: "",
    abbr: "",
    currency: "฿",
    fiscal_year_name: String(new Date().getFullYear()),
    fiscal_year_start_date: `${new Date().getFullYear()}-01-01`,
    fiscal_year_end_date: `${new Date().getFullYear()}-12-31`,
  });

  const [priceLists, setPriceLists] = useState({
    selling: "Standard Selling",
    buying: "Standard Buying",
  });

  const canNextStep1 = useMemo(() => {
    const name = form.organization_name.trim();
    const abbr = form.abbr.trim();
    const fyName = form.fiscal_year_name.trim();
    const fyStart = String(form.fiscal_year_start_date ?? "").slice(0, 10);
    const fyEnd = String(form.fiscal_year_end_date ?? "").slice(0, 10);
    if (!name || !abbr || !fyName || !fyStart || !fyEnd) return false;
    return fyStart <= fyEnd;
  }, [form.organization_name, form.abbr, form.fiscal_year_name, form.fiscal_year_start_date, form.fiscal_year_end_date]);

  const canNextPriceLists = useMemo(() => {
    const s = priceLists.selling.trim();
    const b = priceLists.buying.trim();
    if (!s || !b) return false;
    if (s === b) return false;
    return true;
  }, [priceLists]);

  useEffect(() => {
    if (!open) return;
    const o = org;
    const fyYear = String(new Date().getFullYear());

    setStep(1);
    setSubmitting(false);
    setPriceLists({ selling: "Standard Selling", buying: "Standard Buying" });
    setForm({
      organization_name: String(o?.organization_name ?? ""),
      abbr: String(o?.abbr ?? ""),
      currency: String((o as any)?.currency ?? "฿"),
      fiscal_year_name: fyYear,
      fiscal_year_start_date: `${fyYear}-01-01`,
      fiscal_year_end_date: `${fyYear}-12-31`,
    });

    zodula
      .get_action("zerp.setup.template" as any, {})
      .then((data: SetupTemplate) => {
        setPriceLists({
          selling: String(data?.default_price_lists?.selling ?? "Standard Selling"),
          buying: String(data?.default_price_lists?.buying ?? "Standard Buying"),
        });
      })
      .catch((e: any) => {
        toast.error("Failed to load setup template", e?.message ?? "");
      });
  }, [open, org]);

  const onStep1FieldChange = useCallback((fieldKey: string, value: unknown) => {
    setForm((p) => ({ ...p, [fieldKey]: value ?? "" }));
  }, []);

  const onPriceListFieldChange = useCallback((fieldKey: string, value: unknown) => {
    setPriceLists((p) => ({ ...p, [fieldKey]: value ?? "" }));
  }, []);

  const runWizard = async () => {
    setSubmitting(true);
    try {
      const payload = {
        organization: {
          organization_name: form.organization_name.trim(),
          abbr: form.abbr.trim(),
          currency: form.currency.trim(),
        },
        create_standard_price_projects: true,
        standard_price_lists: {
          selling: priceLists.selling.trim(),
          buying: priceLists.buying.trim(),
        },
        fiscal_year: {
          year_name: form.fiscal_year_name.trim(),
          start_date: String(form.fiscal_year_start_date ?? "").slice(0, 10),
          end_date: String(form.fiscal_year_end_date ?? "").slice(0, 10),
        },
        mark_setup: true,
      };

      const res = (await zodula.action("zerp.setup.wizard" as any, { data: payload })) as any;
      if (res?.error) {
        toast.error("Setup failed", String(res.error));
        return;
      }

      toast.success(
        "Setup completed",
        `Price Projects: ${res?.price_projects_created ?? 0}`
      );

      onSetupComplete();
      window.location.reload();
    } catch (e: any) {
      toast.error("Setup failed", e?.message ?? "");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => {}}>
      <div className="zd:fixed zd:inset-0 zd:bg-black/40 zd:backdrop-blur-md" aria-hidden="true" />
      <div className="zd:fixed zd:inset-0 zd:flex zd:items-center zd:justify-center zd:p-4">
        <DialogContent className="zd:w-[92vw] zd:max-w-3xl zd:p-0 zd:overflow-hidden zd:max-h-[92vh] zd:flex zd:flex-col">
          <div className="zd:px-6 zd:py-5 zd:border-b zd:flex zd:items-start zd:justify-between zd:gap-4">
            <div>
              <DialogTitle>Setup Wizard</DialogTitle>
              <DialogDescription>Complete initial setup before using ZERP.</DialogDescription>
            </div>
            <div className="zd:text-xs zd:text-muted-foreground zd:mt-1">Step {step} / 3</div>
          </div>

          <div className="zd:p-6 zd:flex-1 zd:overflow-y-auto">
            {step === 1 && (
              <div className="zd:space-y-4">
                <div className="zd:text-sm zd:text-muted-foreground">Set organization essential information.</div>
                <div className="zd:grid zd:grid-cols-1 md:zd:grid-cols-2 zd:gap-3">
                  <FormControl
                    label="Organization Name"
                    fieldKey="organization_name"
                    field={{ type: "Text", label: "Organization Name" }}
                    value={form.organization_name}
                    onChange={onStep1FieldChange}
                    placeholder="Your organization name"
                  />
                  <FormControl
                    label="Abbreviation"
                    fieldKey="abbr"
                    field={{ type: "Text", label: "Abbreviation" }}
                    value={form.abbr}
                    onChange={onStep1FieldChange}
                    placeholder="ABBR"
                  />
                  <FormControl
                    label="Currency"
                    fieldKey="currency"
                    field={{ type: "Text", label: "Currency" }}
                    value={form.currency}
                    onChange={onStep1FieldChange}
                    placeholder="฿"
                  />
                  <FormControl
                    label="Fiscal Year Name"
                    fieldKey="fiscal_year_name"
                    field={{ type: "Text", label: "Fiscal Year Name" }}
                    value={form.fiscal_year_name}
                    onChange={onStep1FieldChange}
                    placeholder="2026"
                  />
                  <FormControl
                    label="Fiscal Year Start Date"
                    fieldKey="fiscal_year_start_date"
                    field={{ type: "Date", label: "Fiscal Year Start Date" }}
                    value={form.fiscal_year_start_date}
                    onChange={onStep1FieldChange}
                  />
                  <FormControl
                    label="Fiscal Year End Date"
                    fieldKey="fiscal_year_end_date"
                    field={{ type: "Date", label: "Fiscal Year End Date" }}
                    value={form.fiscal_year_end_date}
                    onChange={onStep1FieldChange}
                  />
                </div>
                {String(form.fiscal_year_start_date ?? "").slice(0, 10) >
                  String(form.fiscal_year_end_date ?? "").slice(0, 10) && (
                    <div className="zd:text-xs zd:text-destructive">
                      Fiscal Year end date must be greater than or equal to start date.
                    </div>
                  )}
              </div>
            )}

            {step === 2 && (
              <div className="zd:space-y-4">
                <div className="zd:text-sm zd:text-muted-foreground">Name the standard price lists.</div>
                <div className="zd:grid zd:grid-cols-1 md:zd:grid-cols-2 zd:gap-3">
                  <FormControl
                    label="Standard Selling Price List"
                    fieldKey="selling"
                    field={{ type: "Text", label: "Standard Selling Price List" }}
                    value={priceLists.selling}
                    onChange={onPriceListFieldChange}
                    placeholder="Standard Selling"
                  />
                  <FormControl
                    label="Standard Buying Price List"
                    fieldKey="buying"
                    field={{ type: "Text", label: "Standard Buying Price List" }}
                    value={priceLists.buying}
                    onChange={onPriceListFieldChange}
                    placeholder="Standard Buying"
                  />
                </div>
                {!canNextPriceLists && (
                  <div className="zd:text-xs zd:text-muted-foreground">
                    Both names are required and must be different.
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="zd:space-y-4">
                <div className="zd:text-sm zd:text-muted-foreground">Confirm and run setup.</div>
                <div className="zd:rounded-lg zd:border zd:p-4">
                  <div className="zd:text-xs zd:text-muted-foreground">Organization</div>
                  <div className="zd:mt-1 zd:text-sm">
                    {form.organization_name.trim() || "(not set)"} ({form.abbr.trim() || "—"})
                  </div>
                  <div className="zd:mt-1 zd:text-xs zd:text-muted-foreground">Currency: {form.currency.trim() || "—"}</div>
                  <div className="zd:mt-1 zd:text-xs zd:text-muted-foreground">
                    Fiscal Year: {form.fiscal_year_name.trim() || "—"} ({form.fiscal_year_start_date || "—"} to{" "}
                    {form.fiscal_year_end_date || "—"})
                  </div>
                  <div className="zd:mt-1 zd:text-xs zd:text-muted-foreground">
                    Price Lists: {priceLists.selling.trim() || "—"} / {priceLists.buying.trim() || "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="zd:px-6 zd:py-4 zd:border-t zd:flex zd:items-center zd:justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as any)))}
              disabled={step === 1 || submitting}
            >
              Back
            </Button>

            <div className="zd:flex zd:items-center zd:gap-2">
              {step < 3 && (
                <Button
                  onClick={() => setStep((s) => (s === 3 ? 3 : ((s + 1) as any)))}
                  disabled={
                    submitting ||
                    (step === 1 && !canNextStep1) ||
                    (step === 2 && !canNextPriceLists)
                  }
                >
                  Next
                </Button>
              )}
              {step === 3 && (
                <Button onClick={runWizard} disabled={submitting}>
                  {submitting ? "Running..." : "Run Setup"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}

