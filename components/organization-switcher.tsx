"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OrganizationSwitcher({ memberships, activeOrganizationId }: { memberships: any[]; activeOrganizationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function switchOrganization(event: ChangeEvent<HTMLSelectElement>) {
    const organizationId = event.target.value;
    if (!organizationId || organizationId === activeOrganizationId) return;
    setBusy(true);
    await fetch("/api/organization-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    });
    router.refresh();
    setBusy(false);
  }

  if (memberships.length <= 1) return null;
  return <label className="org-switcher"><span>Changer d’organisation</span><select value={activeOrganizationId} onChange={switchOrganization} disabled={busy}>{memberships.map((membership) => <option key={membership.organization_id} value={membership.organization_id}>{membership.organization?.name ?? membership.organization_id}</option>)}</select></label>;
}
