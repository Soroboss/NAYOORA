"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { organizationTypes } from "@/lib/organization-config";
import type { OrganizationType } from "@/lib/types";

const services = [
  ["free", "Gratuit · 0 FCFA", "3 administrateurs · 15 membres"],
  ["standard", "Croissance · 6 500 FCFA", "5 administrateurs · 50 membres"],
  ["unlimited", "Illimitée · 12 700 FCFA", "Tout illimité"],
] as const;

export function OnboardingForm() {
  const router = useRouter(); const [selected, setSelected] = useState<OrganizationType>("mutuelle"); const [service, setService] = useState<(typeof services)[number][0]>("standard"); const [name, setName] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { const saved = sessionStorage.getItem("nayoora-onboarding"); if (!saved) return; try { const value = JSON.parse(saved); setSelected(value.organizationType ?? "mutuelle"); setService(value.service ?? "standard"); } catch {} }, []);
  async function submit() { if (name.trim().length < 3) return setError("Indiquez le nom de votre organisation."); setLoading(true); setError(""); const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, organizationType: selected, service }) }); const payload = await response.json(); if (!response.ok) { setError(payload.error ?? "Impossible de créer l'organisation."); setLoading(false); return; } sessionStorage.removeItem("nayoora-onboarding"); router.push("/dashboard"); router.refresh(); }
  return <div className="onboarding-form"><label>Nom de votre organisation<input value={name} onChange={(event) => setName(event.target.value)} required minLength={3} placeholder="Ex. Mutuelle des enseignants d'Abidjan" /></label><fieldset><legend>1. Quel type d'organisation gérez-vous ?</legend><div className="type-choices">{(Object.keys(organizationTypes) as OrganizationType[]).map((type) => { const item = organizationTypes[type]; return <button type="button" aria-pressed={selected === type} onClick={() => setSelected(type)} className={`type-choice ${selected === type ? "selected" : ""}`} key={type}><span>{item.icon}</span><b>{item.label}</b><small>{item.description}</small></button>; })}</div></fieldset><fieldset className="onboarding-services"><legend>2. Choisissez votre offre</legend><div>{services.map(([value, label, description]) => <button type="button" key={value} className={service === value ? "selected" : ""} onClick={() => setService(value)}><b>{label}</b><small>{description}</small></button>)}</div></fieldset>{error && <p className="form-error">{error}</p>}<button type="button" onClick={submit} className="button button-dark" disabled={loading}>{loading ? "Création…" : "Créer mon espace"} <span>→</span></button></div>;
}
