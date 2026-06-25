import { NextResponse } from "next/server";
import { authCookieOptions } from "@/lib/insforge/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("insforge_access_token", "", { ...authCookieOptions, maxAge: 0 });
  response.cookies.set("insforge_refresh_token", "", { ...authCookieOptions, maxAge: 0 });
  response.cookies.set("insforge_code_verifier", "", { ...authCookieOptions, maxAge: 0 });
  return response;
}
