import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";
import { normalizeMember } from "@/lib/members";
import { getPlanLimits } from "@/lib/plan-limits";

const managers = ["organization_admin", "president", "secretaire", "gestionnaire"];

async function context() {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  const { data: membership } = await insforge.from("organization_members").select("organization_id, role").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!membership || !managers.includes(membership.role)) return { error: NextResponse.json({ error: "Droits insuffisants." }, { status: 403 }) };
  return { insforge, user, membership };
}

export async function POST(request: Request) {
  const ctx = await context(); if ("error" in ctx) return ctx.error;
  try {
    const member = normalizeMember(await request.json());
    const limits = await getPlanLimits(ctx.insforge, ctx.membership.organization_id);
    const { count } = await ctx.insforge.from("member_profiles").select("id", { count: "exact", head: true }).eq("organization_id", ctx.membership.organization_id).is("deleted_at", null);
    if (limits.memberLimit !== null && (count ?? 0) >= limits.memberLimit) return NextResponse.json({ error: `Limite de ${limits.memberLimit} membres atteinte pour l’offre ${limits.name}.` }, { status: 402 });
    const { data, error } = await ctx.insforge.from("member_profiles").insert({ organization_id: ctx.membership.organization_id, first_name: member.firstName, last_name: member.lastName, phone: member.phone, email: member.email, address: member.address, member_number: member.memberNumber, birth_date: member.birthDate, created_by: ctx.user.id }).select().single();
    if (error) throw error;
    return NextResponse.json({ member: data }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Création impossible." }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const ctx = await context(); if ("error" in ctx) return ctx.error;
  try {
    const { id, ...input } = await request.json(); if (!id) throw new Error("Membre manquant."); const member = normalizeMember(input);
    const { data, error } = await ctx.insforge.from("member_profiles").update({ first_name: member.firstName, last_name: member.lastName, phone: member.phone, email: member.email, address: member.address, member_number: member.memberNumber, birth_date: member.birthDate, updated_at: new Date().toISOString() }).eq("id", id).eq("organization_id", ctx.membership.organization_id).is("deleted_at", null).select().single();
    if (error) throw error; return NextResponse.json({ member: data });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Mise à jour impossible." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const ctx = await context(); if ("error" in ctx) return ctx.error;
  const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "Membre manquant." }, { status: 400 });
  const { error } = await ctx.insforge.from("member_profiles").update({ status: "inactive", deleted_at: new Date().toISOString() }).eq("id", id).eq("organization_id", ctx.membership.organization_id).is("deleted_at", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
