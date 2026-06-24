import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";

export async function POST(request: Request) {
  const { name, organizationType } = await request.json();
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  const slug = `${String(name).toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-5)}`;
  const { data: organization, error } = await insforge.from("organizations").insert({ name, slug, organization_type: organizationType, created_by: user.id }).select("id").single();
  if (error || !organization) return NextResponse.json({ error: error?.message ?? "Création impossible." }, { status: 400 });
  const membership = await insforge.from("organization_members").insert({ organization_id: organization.id, user_id: user.id, role: "organization_admin", status: "active" });
  if (membership.error) return NextResponse.json({ error: membership.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
