import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";

export async function POST(request: Request) {
  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { data: m } = await s.from("organization_members").select("organization_id, role").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
    if (!m || !["organization_admin", "president", "secretaire", "gestionnaire"].includes(m.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { name, account_type, currency } = await request.json();

    const { data, error } = await s.from("cash_accounts").insert({
      organization_id: m.organization_id,
      name,
      account_type,
      currency: currency || "XOF"
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
