import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient, authCookieOptions } from "@/lib/insforge/server";

export async function GET(request: Request) {
  const insforge = await createClient();
  const redirectTo = new URL("/api/auth/callback", process.env.NEXT_PUBLIC_APP_URL ?? request.url).toString();
  const { data, error } = await insforge.auth.signInWithOAuth({ provider: "google", redirectTo, skipBrowserRedirect: true });
  if (error || !data?.url || !data.codeVerifier) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`, request.url));
  const store = await cookies();
  store.set("insforge_code_verifier", data.codeVerifier, { ...authCookieOptions, maxAge: 600 });
  return NextResponse.redirect(data.url);
}
