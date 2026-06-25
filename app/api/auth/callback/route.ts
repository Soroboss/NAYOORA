import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient, authCookieOptions } from "@/lib/insforge/server";
import { getAuthDestination } from "@/lib/auth-destination";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const store = await cookies();
  const verifier = store.get("insforge_code_verifier")?.value;
  if (!code || !verifier) return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  const insforge = await createClient();
  const { data, error } = await insforge.auth.exchangeOAuthCode(code, verifier);
  if (error || !data?.accessToken || !data?.refreshToken) return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  const redirectTo = await getAuthDestination(data.accessToken);
  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.set("insforge_access_token", data.accessToken, { ...authCookieOptions, maxAge: 60 * 15 });
  response.cookies.set("insforge_refresh_token", data.refreshToken, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 7 });
  response.cookies.delete("insforge_code_verifier");
  return response;
}
