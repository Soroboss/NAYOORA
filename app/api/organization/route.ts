import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";

const roles = ["organization_admin", "president"];

export async function POST(request: Request) {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  const { data: membership } = user
    ? await insforge.from("organization_members").select("organization_id,role").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle()
    : { data: null };
  if (!user || !membership || !roles.includes(membership.role)) return NextResponse.json({ error: "Droits administrateur requis." }, { status: 403 });

  try {
    const body = await request.json();
    const organizationId = membership.organization_id;

    if (body.action === "profile") {
      if (!body.name?.trim()) throw new Error("Nom requis.");
      const { error } = await insforge.from("organizations").update({
        name: body.name.trim(),
        phone: body.phone || null,
        email: body.email || null,
        country_code: body.country || null,
        currency: body.currency || "XOF",
      }).eq("id", organizationId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.action === "module") {
      if (!body.code) throw new Error("Module requis.");
      const { error } = await insforge.from("organization_modules").upsert({
        organization_id: organizationId,
        module_code: body.code,
        active: body.active === "true" || body.active === true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "organization_id,module_code" });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.action === "operations") {
      const { data: existing } = await insforge.from("settings").select("data").eq("organization_id", organizationId).maybeSingle();
      const current = existing?.data ?? {};
      const data = {
        ...current,
        default_payment_method: body.paymentMethod || "cash",
        channels: {
          ...(current.channels ?? {}),
          email: body.emailEnabled === "true" || body.emailEnabled === true,
          whatsapp: body.whatsappEnabled === "true" || body.whatsappEnabled === true,
          whatsapp_sender: body.whatsappSender || null,
        },
        payments: {
          ...(current.payments ?? {}),
          mobile_money: body.mobileMoneyEnabled === "true" || body.mobileMoneyEnabled === true,
          merchant_reference: body.merchantReference || null,
        },
      };
      const { error } = await insforge.from("settings").upsert({
        organization_id: organizationId,
        timezone: body.timezone || "Africa/Abidjan",
        fiscal_year_start: Number(body.fiscalYear || 1),
        member_number_prefix: body.prefix || null,
        data,
      });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    throw new Error("Action inconnue.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Opération impossible." }, { status: 400 });
  }
}
