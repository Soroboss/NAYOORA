import { NextResponse } from "next/server";
import { normalizeMember } from "@/lib/members";
import { getPlanLimits } from "@/lib/plan-limits";
import { canManageMembers, getCurrentOrganizationContext } from "@/lib/current-organization";

export async function POST(request: Request) {
  const { insforge, user, membership } = await getCurrentOrganizationContext();
  if (!membership || !canManageMembers(membership.role)) {
    return NextResponse.json({ error: "Droits insuffisants." }, { status: 403 });
  }

  try {
    const { members } = await request.json();
    if (!Array.isArray(members) || members.length === 0) {
      throw new Error("Aucun membre fourni.");
    }

    const orgId = membership.organization_id;

    // Check limits
    const limits = await getPlanLimits(insforge, orgId);
    const { count } = await insforge.from("member_profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("deleted_at", null);
    
    if (limits.memberLimit !== null && (count ?? 0) + members.length > limits.memberLimit) {
      return NextResponse.json({ 
        error: `L'import de ces ${members.length} membres dépasse votre limite actuelle de ${limits.memberLimit}. Veuillez passer à une offre supérieure.`, 
        code: "PLAN_LIMIT_REACHED" 
      }, { status: 402 });
    }

    // Get org name to generate prefixes for member numbers
    const { data: org } = await insforge.from("organizations").select("name").eq("id", orgId).maybeSingle();
    let prefix = "NA";
    if (org?.name) {
      const words = org.name.trim().split(/\s+/);
      if (words.length > 1) {
        prefix = (words[0][0] + words[1][0]).toUpperCase();
      } else if (words.length === 1 && words[0].length >= 2) {
        prefix = org.name.substring(0, 2).toUpperCase();
      }
    }

    let currentCount = count ?? 0;
    const inserts = members.map(m => {
      currentCount++;
      const norm = normalizeMember(m);
      const suffix = norm.lastName && norm.lastName.length > 0 ? norm.lastName[0].toUpperCase() : "A";
      const generatedNumber = `${prefix}-${String(currentCount).padStart(5, "0")}${suffix}`;
      
      return {
        organization_id: orgId,
        first_name: norm.firstName,
        last_name: norm.lastName,
        phone: norm.phone,
        email: norm.email,
        member_number: norm.memberNumber || generatedNumber,
        status: m.status || "active",
        created_by: user.id
      };
    });

    const { error } = await insforge.from("member_profiles").insert(inserts);
    if (error) throw error;

    return NextResponse.json({ message: `${inserts.length} membres importés avec succès.`, count: inserts.length }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur lors de l'importation." }, { status: 400 });
  }
}
