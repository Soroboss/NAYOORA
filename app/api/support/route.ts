import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";

const roles = ["organization_admin", "president", "secretaire", "tresorier", "gestionnaire"];
const requestTypes = ["support", "billing", "upgrade", "technical", "security", "data", "incident", "other"];
const priorities = ["low", "normal", "high", "urgent"];

export async function POST(request: Request) {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  const { data: membership } = user
    ? await insforge.from("organization_members").select("organization_id,role").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle()
    : { data: null };
  if (!user || !membership || !roles.includes(membership.role)) return NextResponse.json({ error: "Droits de gestion requis." }, { status: 403 });

  try {
    const body = await request.json();
    if (!body.title) throw new Error("Titre requis.");
    const { data, error } = await insforge.from("platform_requests").insert({
      organization_id: membership.organization_id,
      created_by: user.id,
      request_type: requestTypes.includes(body.requestType) ? body.requestType : "support",
      priority: priorities.includes(body.priority) ? body.priority : "normal",
      title: String(body.title).trim(),
      description: body.description || null,
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Requête impossible." }, { status: 400 });
  }
}
