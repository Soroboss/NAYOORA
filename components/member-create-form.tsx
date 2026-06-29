"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/insforge/client";

type FormState = { firstName: string; lastName: string; phone: string; email: string; memberNumber: string; address: string; birthDate: string; photoUrl: string; title: string; reportsTo: string };
const blank: FormState = { firstName: "", lastName: "", phone: "", email: "", memberNumber: "", address: "", birthDate: "", photoUrl: "", title: "", reportsTo: "" };

export function MemberCreateForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const update = (event: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [event.target.name]: event.target.value });

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMessage("Le fichier choisi doit être une image.");
    if (file.size > 2_000_000) return setMessage("Photo trop lourde. Utilisez une image inférieure à 2 Mo.");
    setBusy(true);
    setMessage("Upload de la photo en cours…");
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `organizations/${organizationId}/members/${crypto.randomUUID()}-${safeName}`;
      const bucket = createClient().storage.from("member-photos");
      const { data, error } = await bucket.upload(path, file);
      if (error) throw error;
      setForm((current) => ({ ...current, photoUrl: data?.url ?? bucket.getPublicUrl(path).data?.publicUrl ?? path }));
      setMessage("Photo uploadée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload impossible.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(body.error);
    router.push(`/dashboard/members/${body.member.id}`);
    router.refresh();
  }

  return <form className="member-form member-create-page-form" onSubmit={save}><div className="panel-heading"><div><p className="eyebrow">Nouveau membre</p><h2>Créer une fiche membre</h2></div></div><div className="form-grid"><label>Prénom<input name="firstName" required value={form.firstName} onChange={update}/></label><label>Nom<input name="lastName" required value={form.lastName} onChange={update}/></label><label>Téléphone<input name="phone" value={form.phone} onChange={update}/></label><label>Email<input type="email" name="email" value={form.email} onChange={update}/></label><label>Matricule<input name="memberNumber" value={form.memberNumber} onChange={update} placeholder="Auto si vide"/></label><label>Date de naissance<input type="date" name="birthDate" value={form.birthDate} onChange={update}/></label><label>Fonction<input name="title" value={form.title} onChange={update} placeholder="Ex: Président" /></label><label>ID Supérieur<input name="reportsTo" value={form.reportsTo} onChange={update} placeholder="Optionnel : l'ID de son supérieur" /></label><label>Adresse<input name="address" value={form.address} onChange={update}/></label><label>Photo du membre<input disabled={busy} type="file" accept="image/*" onChange={uploadPhoto}/><small>Upload InsForge Storage, 2 Mo max.</small></label>{form.photoUrl && <span className="member-photo-preview"><img src={form.photoUrl} alt="" /> Photo uploadée</span>}</div>{message && <p className="member-message">{message}</p>}<button disabled={busy} className="button button-dark">{busy ? "Traitement…" : "Créer le membre"}</button></form>;
}
