"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const data = new FormData(event.currentTarget);
    const email = String(data.get("email")); const password = String(data.get("password"));
    const result = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: isSignup ? "signup" : "login", email, password }) });
    const payload = await result.json(); setLoading(false);
    if (!result.ok) return setError(payload.error ?? "Connexion impossible.");
    if (payload.verificationRequired) { setError("Vérifiez votre boîte email pour confirmer votre adresse, puis connectez-vous."); return; }
    router.push(isSignup ? "/onboarding" : "/dashboard"); router.refresh();
  }
  async function signInWithGoogle() {
    setError("");
    setLoading(true);
    window.location.assign("/api/auth/google");
  }
  return <main className="auth-page"><Link href="/" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><section className="auth-card"><p className="eyebrow">{isSignup ? "Bienvenue dans NAYOORA" : "Ravi de vous revoir"}</p><h1>{isSignup ? "Créez votre espace" : "Connectez-vous"}</h1><p>{isSignup ? "Lancez votre organisation en quelques minutes." : "Accédez à votre organisation en toute sécurité."}</p><button type="button" className="google-button" onClick={signInWithGoogle} disabled={loading}><span aria-hidden="true">G</span> Continuer avec Google</button><div className="auth-separator"><span>ou avec votre email</span></div><form onSubmit={submit}><label>Email<input required type="email" name="email" placeholder="vous@organisation.org" autoComplete="email" /></label><label>Mot de passe<input required minLength={8} type="password" name="password" placeholder="8 caractères minimum" autoComplete={isSignup ? "new-password" : "current-password"} /></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark full" disabled={loading}>{loading ? "Patientez…" : isSignup ? "Créer mon compte" : "Se connecter"}</button></form>{isSignup && <p className="auth-note">En créant votre compte, vous pourrez ensuite configurer votre organisation et inviter votre équipe.</p>}<p className="form-footer">{isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Connexion" : "Créer un espace"}</Link></p></section></main>;
}
