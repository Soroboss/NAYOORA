import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";
import { administratorRoles, getPlanLimits } from "@/lib/plan-limits";

const admins = ["organization_admin", "president"];
const validRoles = ["organization_admin", "president", "secretaire", "tresorier", "gestionnaire", "membre", "auditeur"];
const validAccessLevels = ["viewer", "standard", "finance", "operations", "admin", "owner"];

function permissionsFor(role: string, accessLevel: string) {
  const permissions = {
    members: ["standard", "operations", "admin", "owner"].includes(accessLevel),
    finance: ["finance", "admin", "owner"].includes(accessLevel) || role === "tresorier",
    communication: ["operations", "admin", "owner"].includes(accessLevel) || ["secretaire", "gestionnaire"].includes(role),
    settings: ["admin", "owner"].includes(accessLevel) || ["organization_admin", "president"].includes(role),
    platformSupport: ["admin", "owner"].includes(accessLevel),
  };
  return permissions;
}

export async function POST(request: Request) {
  const insforge = await createClient(); const { data: { user } } = await insforge.auth.getUser();
  const { data: membership } = user ? await insforge.from("organization_members").select("organization_id,role").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle() : { data: null };
  if (!user || !membership || !admins.includes(membership.role)) return NextResponse.json({ error: "Droits administrateur requis." }, { status: 403 });
  try {
    const body = await request.json(); const organizationId = membership.organization_id;
    const limits = await getPlanLimits(insforge, organizationId);
    const administratorCount = async () => { const { count } = await insforge.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active").in("role", administratorRoles); return count ?? 0; };
    const enforceAdministratorLimit = async () => { const count = await administratorCount(); if (limits.adminLimit !== null && count >= limits.adminLimit) throw new Error(`Limite de ${limits.adminLimit} administrateurs atteinte pour l’offre ${limits.name}.`); };
    if (body.action === "card") { if (!body.memberId) throw new Error("Membre requis."); const number = `${body.prefix || "ORG"}-${Date.now().toString().slice(-7)}`; const { data, error } = await insforge.from("member_cards").upsert({ organization_id: organizationId, member_profile_id: body.memberId, card_number: number, status: "active" }, { onConflict: "member_profile_id" }).select().single(); if (error) throw error; return NextResponse.json({ item: data }); }
    if (body.action === "role") { if (!body.membershipId || !validRoles.includes(body.role)) throw new Error("Rôle invalide."); const accessLevel = validAccessLevels.includes(body.accessLevel) ? body.accessLevel : "standard"; const { data: target } = await insforge.from("organization_members").select("role").eq("id", body.membershipId).eq("organization_id", organizationId).maybeSingle(); if (!target) throw new Error("Utilisateur introuvable."); if (!administratorRoles.includes(target.role) && administratorRoles.includes(body.role)) await enforceAdministratorLimit(); const { data, error } = await insforge.from("organization_members").update({ role: body.role, access_level: accessLevel, responsibility: body.responsibility?.trim() || null, permissions: permissionsFor(body.role, accessLevel) }).eq("id", body.membershipId).eq("organization_id", organizationId).select().single(); if (error) throw error; await insforge.from("access_logs").insert({ organization_id: organizationId, user_id: user.id, event_type: "collaborator_access_updated", metadata: { membership_id: body.membershipId, role: body.role, access_level: accessLevel } }); return NextResponse.json({ item: data }); }
    if (body.action === "invite") { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || "")) throw new Error("Email invalide."); const role = validRoles.includes(body.role) ? body.role : "membre"; const accessLevel = validAccessLevels.includes(body.accessLevel) ? body.accessLevel : "standard"; if (administratorRoles.includes(role)) await enforceAdministratorLimit(); const { data, error } = await insforge.from("organization_invites").insert({ organization_id: organizationId, email: body.email.toLowerCase(), role, access_level: accessLevel, responsibility: body.responsibility?.trim() || null, permissions: permissionsFor(role, accessLevel), invited_by: user.id }).select().single(); if (error) throw error; await insforge.from("access_logs").insert({ organization_id: organizationId, user_id: user.id, event_type: "collaborator_invited", metadata: { email: body.email.toLowerCase(), role, access_level: accessLevel } }); return NextResponse.json({ item: data }); }
    if (body.action === "settings") { const { error } = await insforge.from("organizations").update({ name: body.name, phone: body.phone || null, email: body.email || null, country_code: body.country || null, currency: body.currency || "XOF" }).eq("id", organizationId); if (error) throw error; await insforge.from("settings").upsert({ organization_id: organizationId, timezone: body.timezone || "Africa/Abidjan", member_number_prefix: body.prefix || null, data: {} }); return NextResponse.json({ ok: true }); }
    throw new Error("Action inconnue.");
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Opération impossible." }, { status: 400 }); }
}
