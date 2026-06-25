import { NextResponse } from "next/server";
import { activeOrganizationCookie, createClient } from "@/lib/insforge/server";

export async function POST(request: Request) {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const body = await request.json();
  if (!body.organizationId) return NextResponse.json({ error: "Organisation manquante." }, { status: 400 });
  const { data: membership } = await insforge.from("organization_members").select("organization_id").eq("user_id", user.id).eq("organization_id", body.organizationId).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "Accès organisation refusé." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(activeOrganizationCookie, body.organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
