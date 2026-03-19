import React, { useEffect, useMemo, useState } from "react";
import { zodula } from "@/zodula/client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/zodula/ui/components/ui/dialog";
import { Button } from "@/zodula/ui/components/ui/button";
import { Input } from "@/zodula/ui/components/ui/input";
import { toast } from "@/zodula/ui/components/ui/toast";
import { TreeView, type TreeNode } from "@/zodula/ui/components/list/TreeView";
import { useRouter } from "@/zodula/ui";

interface ShellProps {
  children: React.ReactNode;
}

type OrgInfo = {
  id: string;
  organization_name?: string | null;
  abbr?: string | null;
  currency?: string | null;
  is_setup?: number | null;
};

type StandardAccount = {
  account_code: string;
  account_name: string;
  root_type: string;
  account_type?: string;
  parent_code?: string;
};

type SetupTemplate = {
  accounts: StandardAccount[];
  essential_account_codes: string[];
  default_price_lists: { selling: string; buying: string };
};

function isSetupDone(org: OrgInfo | null | undefined) {
  return Number((org as any)?.is_setup ?? 0) === 1;
}

function buildChildrenMap(accounts: StandardAccount[]) {
  const byParent = new Map<string, StandardAccount[]>();
  for (const a of accounts) {
    const parent = a.parent_code ?? "";
    const list = byParent.get(parent) ?? [];
    list.push(a);
    byParent.set(parent, list);
  }
  for (const [, list] of byParent) {
    list.sort((x, y) => x.account_code.localeCompare(y.account_code));
  }
  return byParent;
}

function collectSubtreeCodes(node: StandardAccount, childrenMap: Map<string, StandardAccount[]>, out: string[]) {
  out.push(node.account_code);
  const kids = childrenMap.get(node.account_code) ?? [];
  for (const k of kids) collectSubtreeCodes(k, childrenMap, out);
}

function getCheckState(node: StandardAccount, childrenMap: Map<string, StandardAccount[]>, selected: Set<string>) {
  const codes: string[] = [];
  collectSubtreeCodes(node, childrenMap, codes);
  let checkedCount = 0;
  for (const c of codes) if (selected.has(c)) checkedCount++;
  if (checkedCount === 0) return { checked: false, indeterminate: false };
  if (checkedCount === codes.length) return { checked: true, indeterminate: false };
  return { checked: false, indeterminate: true };
}

function buildTreeNodes(accounts: StandardAccount[]) {
  const byCode = new Map(accounts.map((a) => [a.account_code, a]));
  const childrenByParent = new Map<string, StandardAccount[]>();
  for (const a of accounts) {
    const parent = a.parent_code ?? "";
    const list = childrenByParent.get(parent) ?? [];
    list.push(a);
    childrenByParent.set(parent, list);
  }
  for (const [, list] of childrenByParent) {
    list.sort((x, y) => x.account_code.localeCompare(y.account_code));
  }

  const toNode = (doc: StandardAccount): TreeNode<any> => ({
    doc: {
      ...doc,
      _title: `${doc.account_code} ${doc.account_name}`,
      _meta: `${doc.root_type}${doc.account_type ? ` • ${doc.account_type}` : ""}`,
    },
    children: (childrenByParent.get(doc.account_code) ?? []).map(toNode),
  });

  return (childrenByParent.get("") ?? []).map(toNode);
}

export default function Shell(props: ShellProps) {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter()

  const [form, setForm] = useState({
    organization_name: "",
    abbr: "",
    currency: "฿",
  });

  const [template, setTemplate] = useState<SetupTemplate | null>(null);
  const [selectedAccountCodes, setSelectedAccountCodes] = useState<Set<string>>(new Set());
  const [priceLists, setPriceLists] = useState({ selling: "Standard Selling", buying: "Standard Buying" });

  const childrenMap = useMemo(() => buildChildrenMap(template?.accounts ?? []), [template?.accounts]);
  const treeNodes = useMemo(() => buildTreeNodes(template?.accounts ?? []), [template?.accounts]);

  useEffect(() => {
    let mounted = true;
    if(!router.pathname.startsWith("/desk")) {
      return;
    }
    setOrgLoaded(false);
    zodula
      .get_action("zodula.org.getInfo" as Zodula.ActionPath, {})
      .then((data: { org: OrgInfo | null }) => {
        if (!mounted) return;
        setOrg(data?.org ?? null);
        const o = data?.org ?? null;
        if (o) {
          setForm({
            organization_name: String(o.organization_name ?? ""),
            abbr: String(o.abbr ?? ""),
            currency: String((o as any).currency ?? "฿"),
          });
        }
        if (!isSetupDone(o)) {
          setOpen(true);
          setStep(1);
        }
      })
      .catch((e: any) => {
        if (!mounted) return;
        toast.error("Failed to load organization", e?.message ?? "");
      })
      .finally(() => {
        if (!mounted) return;
        setOrgLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [router.pathname]);

  useEffect(() => {
    let mounted = true;
    if (!open || isSetupDone(org) || template) return;
    zodula
      .get_action("zerp.setup.template" as any, {})
      .then((data: SetupTemplate) => {
        if (!mounted) return;
        setTemplate(data);
        setSelectedAccountCodes(new Set(data?.essential_account_codes ?? []));
        setPriceLists({
          selling: String(data?.default_price_lists?.selling ?? "Standard Selling"),
          buying: String(data?.default_price_lists?.buying ?? "Standard Buying"),
        });
      })
      .catch((e: any) => {
        if (!mounted) return;
        toast.error("Failed to load setup template", e?.message ?? "");
      });
    return () => {
      mounted = false;
    };
  }, [open, org, template]);

  const canNextStep1 = useMemo(() => {
    const name = form.organization_name.trim();
    const abbr = form.abbr.trim();
    return name.length > 0 && abbr.length > 0;
  }, [form.organization_name, form.abbr]);

  const selectedCount = useMemo(() => selectedAccountCodes.size, [selectedAccountCodes]);

  const canNextAccounts = useMemo(() => {
    if (!template) return false;
    return selectedAccountCodes.size > 0;
  }, [template, selectedAccountCodes]);

  const canNextPriceLists = useMemo(() => {
    const s = priceLists.selling.trim();
    const b = priceLists.buying.trim();
    if (!s || !b) return false;
    if (s === b) return false;
    return true;
  }, [priceLists]);

  const toggleNode = (node: StandardAccount, nextChecked: boolean) => {
    const next = new Set(selectedAccountCodes);
    const codes: string[] = [];
    collectSubtreeCodes(node, childrenMap, codes);
    if (nextChecked) {
      for (const c of codes) next.add(c);
    } else {
      for (const c of codes) next.delete(c);
    }
    setSelectedAccountCodes(next);
  };

  const runWizard = async () => {
    setSubmitting(true);
    try {
      const payload = {
        organization: {
          organization_name: form.organization_name.trim(),
          abbr: form.abbr.trim(),
          currency: form.currency.trim(),
        },
        generate_standard_accounts: true,
        standard_account_codes: [...selectedAccountCodes],
        create_standard_price_projects: true,
        standard_price_lists: {
          selling: priceLists.selling.trim(),
          buying: priceLists.buying.trim(),
        },
        mark_setup: true,
      };
      
      const res = (await zodula.action("zerp.setup.wizard" as any, { data: payload })) as any;
      if (res?.error) {
        toast.error("Setup failed", String(res.error));
        return;
      }
      toast.success("Setup completed", `Accounts: ${res?.accounts_created ?? 0}, Price Projects: ${res?.price_projects_created ?? 0}`);
      setOpen(false);
      setOrg((prev) => (prev ? { ...prev, is_setup: 1 } : prev));
      setStep(1);
      window.location.reload();
    } catch (e: any) {
      toast.error("Setup failed", e?.message ?? "");
    } finally {
      setSubmitting(false);
    }
  };

  const showWizard = orgLoaded && open && !isSetupDone(org);

  return (
    <>
      {props.children}

      <Dialog open={showWizard} onClose={() => {}}>
        <div className="zd:fixed zd:inset-0 zd:bg-black/40 zd:backdrop-blur-md" aria-hidden="true" />
        <div className="zd:fixed zd:inset-0 zd:flex zd:items-center zd:justify-center zd:p-4">
          <DialogContent className="zd:w-[92vw] zd:max-w-3xl zd:p-0 zd:overflow-hidden zd:max-h-[92vh] zd:flex zd:flex-col">
            <div className="zd:px-6 zd:py-5 zd:border-b zd:flex zd:items-start zd:justify-between zd:gap-4">
              <div>
                <DialogTitle>Setup Wizard</DialogTitle>
                <DialogDescription>
                  Complete initial setup before using ZERP.
                </DialogDescription>
              </div>
              <div className="zd:text-xs zd:text-muted-foreground zd:mt-1">
                Step {step} / 4
              </div>
            </div>

            <div className="zd:p-6 zd:flex-1 zd:overflow-y-auto">
              {step === 1 && (
                <div className="zd:space-y-4">
                  <div className="zd:text-sm zd:text-muted-foreground">
                    Set organization essential information.
                  </div>
                  <div className="zd:grid zd:grid-cols-1 md:zd:grid-cols-2 zd:gap-3">
                    <div className="zd:space-y-1.5">
                      <div className="zd:text-xs zd:font-medium">Organization Name</div>
                      <Input
                        value={form.organization_name}
                        onChange={(e) => setForm((p) => ({ ...p, organization_name: e.target.value }))}
                        placeholder="Your organization name"
                        autoFocus
                      />
                    </div>
                    <div className="zd:space-y-1.5">
                      <div className="zd:text-xs zd:font-medium">Abbreviation</div>
                      <Input
                        value={form.abbr}
                        onChange={(e) => setForm((p) => ({ ...p, abbr: e.target.value }))}
                        placeholder="ABBR"
                      />
                    </div>
                    <div className="zd:space-y-1.5">
                      <div className="zd:text-xs zd:font-medium">Currency</div>
                      <Input
                        value={form.currency}
                        onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                        placeholder="฿"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="zd:space-y-4">
                  <div className="zd:text-sm zd:text-muted-foreground">
                    Select accounts to generate (tree). We will auto-create any required parent accounts.
                  </div>
                  {!template ? (
                    <div className="zd:text-sm zd:text-muted-foreground">Loading accounts...</div>
                  ) : (
                    <div className="zd:rounded-lg zd:border">
                      <div className="zd:flex zd:items-center zd:justify-between zd:gap-3 zd:px-4 zd:py-3 zd:border-b zd:bg-muted/20">
                        <div className="zd:text-sm">
                          Selected: <span className="zd:font-medium">{selectedCount}</span>
                        </div>
                        <div className="zd:flex zd:items-center zd:gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedAccountCodes(new Set(template.essential_account_codes ?? []))}
                            disabled={submitting}
                          >
                            Essential
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedAccountCodes(new Set(template.accounts.map((a) => a.account_code)))}
                            disabled={submitting}
                          >
                            Select all
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedAccountCodes(new Set())}
                            disabled={submitting}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <TreeView
                        nodes={treeNodes}
                        displayField="_title"
                        displayLabel="Account"
                        getDocId={(doc: any) => String(doc.account_code ?? doc.id ?? "")}
                        columns={[{ key: "_meta", label: "Type" }]}
                        defaultExpanded="all"
                        persistExpanded={false}
                        className="zd:rounded-none zd:border-0 zd:min-h-0"
                        checkbox={{
                          ariaLabel: "Select account",
                          getState: (doc: any) => {
                            const state = getCheckState(doc as StandardAccount, childrenMap, selectedAccountCodes);
                            return { checked: state.checked, indeterminate: state.indeterminate };
                          },
                          onToggle: (doc: any, nextChecked: boolean) => {
                            toggleNode(doc as StandardAccount, nextChecked);
                          },
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="zd:space-y-4">
                  <div className="zd:text-sm zd:text-muted-foreground">
                    Name the standard price lists.
                  </div>
                  <div className="zd:grid zd:grid-cols-1 md:zd:grid-cols-2 zd:gap-3">
                    <div className="zd:space-y-1.5">
                      <div className="zd:text-xs zd:font-medium">Standard Selling Price List</div>
                      <Input
                        value={priceLists.selling}
                        onChange={(e) => setPriceLists((p) => ({ ...p, selling: e.target.value }))}
                        placeholder="Standard Selling"
                        autoFocus
                      />
                    </div>
                    <div className="zd:space-y-1.5">
                      <div className="zd:text-xs zd:font-medium">Standard Buying Price List</div>
                      <Input
                        value={priceLists.buying}
                        onChange={(e) => setPriceLists((p) => ({ ...p, buying: e.target.value }))}
                        placeholder="Standard Buying"
                      />
                    </div>
                  </div>
                  {!canNextPriceLists && (
                    <div className="zd:text-xs zd:text-muted-foreground">
                      Both names are required and must be different.
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="zd:space-y-4">
                  <div className="zd:text-sm zd:text-muted-foreground">
                    Confirm and run setup.
                  </div>
                  <div className="zd:rounded-lg zd:border zd:p-4">
                    <div className="zd:text-xs zd:text-muted-foreground">Organization</div>
                    <div className="zd:mt-1 zd:text-sm">
                      {form.organization_name.trim() || "(not set)"} ({form.abbr.trim() || "—"})
                    </div>
                    <div className="zd:mt-1 zd:text-xs zd:text-muted-foreground">
                      Currency: {form.currency.trim() || "—"}
                    </div>
                    <div className="zd:mt-3 zd:text-xs zd:text-muted-foreground">
                      Accounts to create: {selectedCount}
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
                {step < 4 && (
                  <Button
                    onClick={() => setStep((s) => (s === 4 ? 4 : ((s + 1) as any)))}
                    disabled={
                      submitting ||
                      (step === 1 && !canNextStep1) ||
                      (step === 2 && !canNextAccounts) ||
                      (step === 3 && !canNextPriceLists)
                    }
                  >
                    Next
                  </Button>
                )}
                {step === 4 && (
                  <Button onClick={runWizard} disabled={submitting}>
                    {submitting ? "Running..." : "Run Setup"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </div>
      </Dialog>
    </>
  );
}