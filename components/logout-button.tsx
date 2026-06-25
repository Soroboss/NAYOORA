"use client";

import { useState } from "react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <button className={compact ? "logout-button compact" : "logout-button"} disabled={busy} onClick={logout} type="button">
      {busy ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
