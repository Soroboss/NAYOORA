import { NextRequest, NextResponse } from "next/server";
import { createClient, authCookieOptions } from "@/lib/insforge/server";

export async function POST(request: NextRequest) {
  const { mode, email, password, name, otp } = await request.json();
  const insforge = await createClient();
  if (mode === "verify") {
    const result = await insforge.auth.verifyEmail({ email, otp });
    if (result.error || !result.data?.accessToken) return NextResponse.json({ error: result.error?.message ?? "Code invalide ou expiré." }, { status: 400 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set("insforge_access_token", result.data.accessToken, { ...authCookieOptions, maxAge: 60 * 15 });
    if (result.data.refreshToken) response.cookies.set("insforge_refresh_token", result.data.refreshToken, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 7 });
    return response;
  }
  const result = mode === "signup"
    ? await insforge.auth.signUp({ email, password, name: String(name ?? "").trim() || undefined, redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login` })
    : await insforge.auth.signInWithPassword({ email, password });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  if (mode === "signup" && result.data?.requireEmailVerification) return NextResponse.json({ verificationRequired: true });
  if (!result.data?.accessToken || !result.data?.refreshToken) return NextResponse.json({ error: "Session indisponible. Vérifiez votre adresse email." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("insforge_access_token", result.data.accessToken, { ...authCookieOptions, maxAge: 60 * 15 });
  response.cookies.set("insforge_refresh_token", result.data.refreshToken, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 7 });
  return response;
}
