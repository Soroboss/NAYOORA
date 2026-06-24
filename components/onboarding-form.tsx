"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { organizationTypes } from "@/lib/organization-config";
import type { OrganizationType } from "@/lib/types";

export function OnboardingForm() {
  const router = useRouter(); const [selected, setSelected] = useState<OrganizationType>("mutuelle"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(""); const name = String(new FormData(e.currentTarget).get("name"));
    const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, organizationType: selected }) });
    const payload = await response.json(); if (!response.ok) { setError(payload.error ?? "Impossible de créer l'organisation."); setLoading(false); return; }
    router.push("/dashboard"); router.refresh();
  }
  return <form className="onboarding-form" onSubmit={submit}><label>Nom de votre organisation<input name="name" required minLength={3} placeholder="Ex. Mutuelle des enseignants d'Abidjan" /></label><fieldset><legend>Quel type d'organisation gérez-vous ?</legend><div className="type-choices">{(Object.keys(organizationTypes) as OrganizationType[]).map((type) => { const item = organizationTypes[type]; return <button type="button" aria-pressed={selected === type} onClick={() => setSelected(type)} className={`type-choice ${selected === type ? "selected" : ""}`} key={type}><span>{item.icon}</span><b>{item.label}</b><small>{item.description}</small></button>; })}</div></fieldset>{error && <p className="form-error">{error}</p>}<button className="button button-dark" disabled={loading}>{loading ? "Création…" : "Créer mon espace"} <span>→</span></button></form>;
}
