import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";

export async function POST(request: Request) {
  const { name, organizationType, service = "pilotage" } = await request.json();
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  const slug = `${String(name).toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-5)}`;
  const { data: organization, error } = await insforge.from("organizations").insert({ name, slug, organization_type: organizationType, created_by: user.id }).select("id").single();
  if (error || !organization) return NextResponse.json({ error: error?.message ?? "Création impossible." }, { status: 400 });
  const membership = await insforge.from("organization_members").insert({ organization_id: organization.id, user_id: user.id, role: "organization_admin", status: "active" });
  if (membership.error) return NextResponse.json({ error: membership.error.message }, { status: 400 });
  const moduleSets: Record<string, string[]> = { essentiel: ["members", "collections", "messages"], pilotage: ["members", "collections", "finance", "events", "messages", "reports"], complet: ["members", "collections", "finance", "events", "messages", "reports", "documents", "governance", "automations", "mobile_money"] };
  const modules = moduleSets[service] ?? moduleSets.pilotage;
  const moduleResult = await insforge.from("organization_modules").insert(modules.map((module_code) => ({ organization_id: organization.id, module_code, active: true })));
  if (moduleResult.error) return NextResponse.json({ error: moduleResult.error.message }, { status: 400 });
  await insforge.from("settings").insert({ organization_id: organization.id, data: { service } });
  return NextResponse.json({ ok: true });
}
