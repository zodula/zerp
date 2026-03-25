import React, { useEffect, useState } from "react";
import { zodula } from "@/zodula/client";
import { toast } from "@/zodula/ui/components/ui/toast";
import { useRouter } from "@/zodula/ui";
import SetupWizard, { type OrgInfo } from "@/zerp/ui/components/setup-wizard/SetupWizard";

interface ShellProps {
  children: React.ReactNode;
}

function isSetupDone(org: OrgInfo | null | undefined) {
  return Number((org as any)?.is_setup ?? 0) === 1;
}

export default function Shell(props: ShellProps) {
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [orgLoaded, setOrgLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    if (!router.pathname.startsWith("/desk")) {
      setOrgLoaded(false);
      setOrg(null);
      return;
    }
    setOrgLoaded(false);
    zodula
      .get_action("zodula.org.getInfo" as Zodula.ActionPath, {})
      .then((data: { org: OrgInfo | null }) => {
        if (!mounted) return;
        setOrg(data?.org ?? null);
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

  const isDesk = router.pathname.startsWith("/desk");
  const shouldOpen = isDesk && orgLoaded && !isSetupDone(org);

  return (
    <>
      {props.children}
      <SetupWizard
        shouldOpen={shouldOpen}
        org={org}
        onSetupComplete={() => {
          setOrg((prev) => (prev ? { ...prev, is_setup: 1 } : prev));
        }}
      />
    </>
  );
}