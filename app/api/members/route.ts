import { NextResponse } from "next/server";
import { normalizeMember } from "@/lib/members";
import { getPlanLimits } from "@/lib/plan-limits";
import { canManageMembers, getCurrentOrganizationContext } from "@/lib/current-organization";

const validOfficeRoles = ["member", "president", "vice_president", "secretaire", "tresorier", "commissaire"];
const validStatuses = ["active", "inactive", "suspended"];

async function context() {
  const { insforge, user, membership } = await getCurrentOrganizationContext();
  if (!membership || !canManageMembers(membership.role)) return { error: NextResponse.json({ error: "Droits insuffisants." }, { status: 403 }) };
  return { insforge, user, membership };
}

export async function POST(request: Request) {
  const ctx = await context(); if ("error" in ctx) return ctx.error;
  try {
    const member = normalizeMember(await request.json());
    const limits = await getPlanLimits(ctx.insforge, ctx.membership.organization_id);
    const { count } = await ctx.insforge.from("member_profiles").select("id", { count: "exact", head: true }).eq("organization_id", ctx.membership.organization_id).is("deleted_at", null);
    if (limits.memberLimit !== null && (count ?? 0) >= limits.memberLimit) return NextResponse.json({ error: `Limite de ${limits.memberLimit} membres atteinte pour l’offre ${limits.name}.` }, { status: 402 });
    const memberNumber = member.memberNumber || await nextMemberNumber(ctx.insforge, ctx.membership.organization_id, count ?? 0, member.lastName || member.firstName);
    const { data, error } = await ctx.insforge.from("member_profiles").insert({ organization_id: ctx.membership.organization_id, first_name: member.firstName, last_name: member.lastName, phone: member.phone, email: member.email, address: member.address, member_number: memberNumber, birth_date: member.birthDate, photo_url: member.photoUrl, created_by: ctx.user.id }).select().single();
    if (error) throw error;
    return NextResponse.json({ member: data }, { status: 201 });
  } catch (error: any) { 
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Création impossible." }, { status: 400 }); 
  }
}

export async function PATCH(request: Request) {
  const ctx = await context(); if ("error" in ctx) return ctx.error;
  try {
    const { id, action, ...input } = await request.json(); if (!id) throw new Error("Membre manquant.");
    if (action === "office") {
      const officeRole = validOfficeRoles.includes(input.officeRole) ? input.officeRole : "member";
      const status = validStatuses.includes(input.status) ? input.status : "active";
      if (officeRole !== "member") await ctx.insforge.from("member_profiles").update({ is_current_officer: false }).eq("organization_id", ctx.membership.organization_id).eq("office_role", officeRole);
      const { data, error } = await ctx.insforge.from("member_profiles").update({ status, office_role: officeRole, office_title: input.officeTitle?.trim() || null, role_started_on: input.roleStartedOn || null, elected_until: input.electedUntil || null, is_current_officer: officeRole !== "member", updated_at: new Date().toISOString() }).eq("id", id).eq("organization_id", ctx.membership.organization_id).is("deleted_at", null).select().single();
      if (error) throw error;
      await ctx.insforge.from("access_logs").insert({ organization_id: ctx.membership.organization_id, user_id: ctx.user.id, event_type: "member_office_updated", metadata: { member_id: id, office_role: officeRole, status } });
      return NextResponse.json({ member: data });
    }
    const member = normalizeMember(input);
    const { data, error } = await ctx.insforge.from("member_profiles").update({ first_name: member.firstName, last_name: member.lastName, phone: member.phone, email: member.email, address: member.address, member_number: member.memberNumber, birth_date: member.birthDate, photo_url: member.photoUrl, title: member.title, reports_to: member.reportsTo, updated_at: new Date().toISOString() }).eq("id", id).eq("organization_id", ctx.membership.organization_id).is("deleted_at", null).select().single();
    if (error) throw error; return NextResponse.json({ member: data });
  } catch (error: any) { 
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Mise à jour impossible." }, { status: 400 }); 
  }
}

async function nextMemberNumber(insforge: any, organizationId: string, currentCount: number, memberName: string) {
  const { data: org } = await insforge.from("organizations").select("name").eq("id", organizationId).maybeSingle();
  let prefix = "NA";
  if (org?.name) {
    const words = org.name.trim().split(/\s+/);
    if (words.length > 1) {
      prefix = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      prefix = org.name.substring(0, 2).toUpperCase();
    }
  }
  const suffix = memberName && memberName.length > 0 ? memberName[0].toUpperCase() : "A";
  return `${prefix}-${String(currentCount + 1).padStart(5, "0")}${suffix}`;
}

export async function DELETE(request: Request) {
  const ctx = await context(); if ("error" in ctx) return ctx.error;
  const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "Membre manquant." }, { status: 400 });
  const { error } = await ctx.insforge.from("member_profiles").update({ status: "inactive", deleted_at: new Date().toISOString() }).eq("id", id).eq("organization_id", ctx.membership.organization_id).is("deleted_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
