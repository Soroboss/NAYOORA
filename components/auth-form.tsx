"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); const data = new FormData(event.currentTarget); const supabase = createClient();
    const email = String(data.get("email")); const password = String(data.get("password"));
    const result = isSignup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false); if (result.error) return setError(result.error.message);
    if (isSignup && !result.data.session) { setError("Vérifiez votre boîte email pour confirmer votre adresse, puis connectez-vous."); return; }
    router.push(isSignup ? "/onboarding" : "/dashboard"); router.refresh();
  }
  return <main className="auth-page"><Link href="/" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><section className="auth-card"><p className="eyebrow">{isSignup ? "Bienvenue" : "Ravi de vous revoir"}</p><h1>{isSignup ? "Créez votre espace" : "Connectez-vous"}</h1><p>{isSignup ? "Commencez par votre compte administrateur." : "Accédez à votre organisation."}</p><form onSubmit={submit}><label>Email<input required type="email" name="email" placeholder="vous@organisation.org" /></label><label>Mot de passe<input required minLength={8} type="password" name="password" placeholder="8 caractères minimum" /></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark full" disabled={loading}>{loading ? "Patientez…" : isSignup ? "Créer mon compte" : "Se connecter"}</button></form><p className="form-footer">{isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Connexion" : "Créer un espace"}</Link></p></section></main>;
}
