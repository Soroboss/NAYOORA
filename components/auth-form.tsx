"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const organizationChoices = [
  ["mutuelle", "Mutuelle", "Cotisations, solidarité et services membres"],
  ["association", "Association", "Adhérents, activités et communication"],
  ["cooperative", "Coopérative", "Production, ventes et paiements"],
  ["tontine", "Tontine", "Tours, encaissements, bénéficiaires et reversements"],
  ["ong", "ONG", "Projets, bénéficiaires et impact"],
  ["syndicat", "Syndicat", "Adhérents et mobilisation"],
  ["parti_politique", "Parti politique", "Sections, campagnes et terrain"],
] as const;

const serviceChoices = [
  ["free", "Gratuit · 0 FCFA", "3 administrateurs · 15 membres"],
  ["standard", "Croissance · 6 500 FCFA", "5 administrateurs · 50 membres"],
  ["unlimited", "Illimitée · 12 700 FCFA", "Administrateurs et membres illimités"],
] as const;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [organizationType, setOrganizationType] = useState<(typeof organizationChoices)[number][0]>("association"); const [service, setService] = useState<(typeof serviceChoices)[number][0]>("standard");
  const [verificationEmail, setVerificationEmail] = useState("");
  const isSignup = mode === "signup";
  useEffect(() => {
    if (!isSignup) return;
    const offer = new URLSearchParams(window.location.search).get("offer");
    if (offer === "free" || offer === "standard" || offer === "unlimited") setService(offer);
  }, [isSignup]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const data = new FormData(event.currentTarget);
    const email = String(data.get("email")); const password = String(data.get("password")); const name = String(data.get("name") ?? "");
    if (isSignup) sessionStorage.setItem("nayoora-onboarding", JSON.stringify({ name, organizationType, service }));
    const result = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: isSignup ? "signup" : "login", email, password, name }) });
    const payload = await result.json(); setLoading(false);
    if (!result.ok) return setError(payload.error ?? "Connexion impossible.");
    if (payload.verificationRequired) { setVerificationEmail(email); return; }
    router.push(payload.redirectTo ?? (isSignup ? "/onboarding" : "/dashboard")); router.refresh();
  }
  function signInWithGoogle() { setError(""); setLoading(true); window.location.assign("/api/auth/google"); }
  async function verify(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(""); const otp = String(new FormData(event.currentTarget).get("otp")); const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "verify", email: verificationEmail, otp }) }); const payload = await response.json(); setLoading(false); if (!response.ok) return setError(payload.error ?? "Code invalide."); router.push(payload.redirectTo ?? "/onboarding"); router.refresh(); }
  return <main className={`auth-page ${isSignup ? "signup-page" : ""}`}>
    <Link href="/" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
    <section className="auth-card">
      {verificationEmail ? <>
        <p className="eyebrow">Vérification email</p>
        <h1>Confirmez votre adresse.</h1>
        <p>Un code à six chiffres a été envoyé à <b>{verificationEmail}</b>.</p>
        <form onSubmit={verify}>
          <label>Code de vérification<input required name="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" autoComplete="one-time-code" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-dark full" disabled={loading}>{loading ? "Vérification…" : "Valider mon compte"}</button>
        </form>
      </> : <>
        <p className="eyebrow">{isSignup ? "Bienvenue dans NAYOORA" : "Ravi de vous revoir"}</p>
        <h1>{isSignup ? "Créez votre espace" : "Connectez-vous"}</h1>
        <p>{isSignup ? "Dites-nous ce que vous souhaitez gérer. Nous préparerons un espace utile dès le premier jour." : "Accédez à votre espace de gestion."}</p>
        <button type="button" className="google-button" onClick={signInWithGoogle} disabled={loading}><span aria-hidden="true">G</span> Continuer avec Google</button>
        <div className="auth-separator"><span>ou avec votre email</span></div>
        <form onSubmit={submit}>
          {isSignup && <label>Votre nom complet<input required name="name" placeholder="Ex. Aïcha Koné" autoComplete="name" /></label>}
          {isSignup && <fieldset className="signup-choices"><legend>Quel type d’organisation créez-vous ?</legend><div>{organizationChoices.map(([value, label, description]) => <button type="button" key={value} className={organizationType === value ? "selected" : ""} onClick={() => setOrganizationType(value)}><b>{label}</b><small>{description}</small></button>)}</div></fieldset>}
          {isSignup && <label className="offer-select">Offre choisie<select value={service} onChange={(event) => setService(event.target.value as (typeof serviceChoices)[number][0])}>{serviceChoices.map(([value, label, description]) => <option key={value} value={value}>{label} — {description}</option>)}</select><small>Vous pourrez changer d’offre à tout moment.</small></label>}
          <label>Email<input required type="email" name="email" placeholder="vous@organisation.org" autoComplete="email" /></label>
          <label>Mot de passe<input required minLength={8} type="password" name="password" placeholder="8 caractères minimum" autoComplete={isSignup ? "new-password" : "current-password"} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-dark full" disabled={loading}>{loading ? "Patientez…" : isSignup ? "Créer mon compte" : "Se connecter"}</button>
        </form>
        {isSignup && <p className="auth-note">Les offres payantes démarrent en essai ; le paiement sera activé avant leur renouvellement.</p>}
        <p className="form-footer">{isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"} <Link href={isSignup ? "/login" : "/offres"}>{isSignup ? "Connexion" : "Voir les offres"}</Link></p>
      </>}
    </section>
  </main>;
}
