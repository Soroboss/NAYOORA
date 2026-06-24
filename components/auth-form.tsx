"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createInsforgeClient } from "@/lib/insforge/client";
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
  async function signInWithGoogle() {
    setError("");
    const insforge = createInsforgeClient();
    if (!insforge) {
      setError("La connexion Google sera disponible dès que la clé publique InsForge sera ajoutée aux variables d’environnement.");
      return;
    }
    setLoading(true);
    const { error: oauthError } = await insforge.auth.signInWithOAuth({
      provider: "google",
      redirectTo: `${window.location.origin}/login`,
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }
  return <main className="auth-page"><Link href="/" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><section className="auth-card"><p className="eyebrow">{isSignup ? "Bienvenue dans NAYOORA" : "Ravi de vous revoir"}</p><h1>{isSignup ? "Créez votre espace" : "Connectez-vous"}</h1><p>{isSignup ? "Lancez votre organisation en quelques minutes." : "Accédez à votre organisation en toute sécurité."}</p><button type="button" className="google-button" onClick={signInWithGoogle} disabled={loading}><span aria-hidden="true">G</span> Continuer avec Google</button><div className="auth-separator"><span>ou avec votre email</span></div><form onSubmit={submit}><label>Email<input required type="email" name="email" placeholder="vous@organisation.org" autoComplete="email" /></label><label>Mot de passe<input required minLength={8} type="password" name="password" placeholder="8 caractères minimum" autoComplete={isSignup ? "new-password" : "current-password"} /></label>{error && <p className="form-error">{error}</p>}<button className="button button-dark full" disabled={loading}>{loading ? "Patientez…" : isSignup ? "Créer mon compte" : "Se connecter"}</button></form>{isSignup && <p className="auth-note">En créant votre compte, vous pourrez ensuite configurer votre organisation et inviter votre équipe.</p>}<p className="form-footer">{isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Connexion" : "Créer un espace"}</Link></p></section></main>;
}
