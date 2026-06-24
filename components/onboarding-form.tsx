"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { organizationTypes } from "@/lib/organization-config";
import type { OrganizationType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function OnboardingForm() {
  const router = useRouter(); const [selected, setSelected] = useState<OrganizationType>("mutuelle"); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(""); const name = String(new FormData(e.currentTarget).get("name")); const supabase = createClient();
    const { data: user } = await supabase.auth.getUser(); if (!user.user) { router.push("/login"); return; }
    const slug = `${name.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Math.random().toString(36).slice(2, 7)}`;
    const { data: organization, error: orgError } = await supabase.from("organizations").insert({ name, slug, organization_type: selected, created_by: user.user.id }).select("id").single();
    if (orgError || !organization) { setError(orgError?.message ?? "Impossible de créer l'organisation."); setLoading(false); return; }
    const { error: memberError } = await supabase.from("organization_members").insert({ organization_id: organization.id, user_id: user.user.id, role: "organization_admin", status: "active" });
    if (memberError) { setError(memberError.message); setLoading(false); return; }
    router.push("/dashboard"); router.refresh();
  }
  return <form className="onboarding-form" onSubmit={submit}><label>Nom de votre organisation<input name="name" required minLength={3} placeholder="Ex. Mutuelle des enseignants d'Abidjan" /></label><fieldset><legend>Quel type d'organisation gérez-vous ?</legend><div className="type-choices">{(Object.keys(organizationTypes) as OrganizationType[]).map((type) => { const item = organizationTypes[type]; return <button type="button" aria-pressed={selected === type} onClick={() => setSelected(type)} className={`type-choice ${selected === type ? "selected" : ""}`} key={type}><span>{item.icon}</span><b>{item.label}</b><small>{item.description}</small></button>; })}</div></fieldset>{error && <p className="form-error">{error}</p>}<button className="button button-dark" disabled={loading}>{loading ? "Création…" : "Créer mon espace"} <span>→</span></button></form>;
}
