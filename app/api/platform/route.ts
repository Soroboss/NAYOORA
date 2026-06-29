import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";

const requestTypes = ["support", "billing", "upgrade", "technical", "security", "data", "incident", "other"];
const priorities = ["low", "normal", "high", "urgent"];
const requestStatuses = ["open", "in_progress", "waiting_tenant", "resolved", "closed"];
const noteTypes = ["follow_up", "risk", "success", "billing", "security", "internal"];
const severities = ["info", "success", "warning", "critical"];
const subscriptionStatuses = ["trialing", "active", "past_due", "cancelled"];
const invoiceStatuses = ["draft", "open", "paid", "void"];

export async function POST(request: Request) {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  const { data: admin } = user
    ? await insforge.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle()
    : { data: null };

  if (!user || !admin) return NextResponse.json({ error: "Accès Super Admin requis." }, { status: 403 });

  try {
    const body = await request.json();

    if (body.action === "plan") {
      if (!body.code || !body.name) throw new Error("Code et nom du plan requis.");
      const { error } = await insforge.from("saas_plans").insert({
        code: clean(body.code),
        name: clean(body.name),
        price_xof: Number(body.price || 0),
        member_limit: body.limit ? Number(body.limit) : null,
        admin_limit: body.adminLimit ? Number(body.adminLimit) : null,
        features: String(body.features || "").split(",").map((item) => item.trim()).filter(Boolean),
      });
      if (error) throw error;
      await recordActivity(insforge, user.id, null, "plan_created", "success", `Plan créé: ${body.name}`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "planUpdate") {
      if (!body.planId || !body.name) throw new Error("Plan et nom requis.");
      const { error } = await insforge.from("saas_plans").update({
        name: clean(body.name),
        price_xof: Number(body.price || 0),
        member_limit: body.limit ? Number(body.limit) : null,
        admin_limit: body.adminLimit ? Number(body.adminLimit) : null,
        active: body.active === "true" || body.active === true,
      }).eq("id", body.planId);
      if (error) throw error;
      await recordActivity(insforge, user.id, null, "plan_updated", "success", `Plan modifié: ${body.name}`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "subscription") {
      if (!body.organizationId || !body.planId) throw new Error("Organisation et plan requis.");
      const status = subscriptionStatuses.includes(body.status) ? body.status : "trialing";
      const { error } = await insforge.from("saas_subscriptions").upsert({
        organization_id: body.organizationId,
        plan_id: body.planId,
        status,
        ends_at: body.endsAt || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "organization_id" });
      if (error) throw error;
      await recordActivity(insforge, user.id, body.organizationId, "subscription_updated", "success", `Abonnement mis à jour: ${status}`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "invoice") {
      if (!body.organizationId || Number(body.amount) < 0) throw new Error("Organisation et montant requis.");
      const status = invoiceStatuses.includes(body.status) ? body.status : "open";
      const { data: subscription } = await insforge.from("saas_subscriptions").select("id").eq("organization_id", body.organizationId).maybeSingle();
      const { error } = await insforge.from("saas_invoices").insert({
        organization_id: body.organizationId,
        tenant_id: body.organizationId,
        subscription_id: subscription?.id ?? null,
        amount: Number(body.amount),
        status,
        due_at: body.dueAt || null,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      });
      if (error) throw error;
      await recordActivity(insforge, user.id, body.organizationId, "invoice_created", status === "paid" ? "success" : "info", `Facture ${status}: ${Number(body.amount).toLocaleString("fr-FR")} XOF`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "billingPayment") {
      if (!body.transactionId) throw new Error("Transaction requise.");
      const { data: transaction, error: transactionError } = await insforge.from("saas_payment_transactions").select("id,organization_id,invoice_id,subscription_id,status").eq("id", body.transactionId).maybeSingle();
      if (transactionError || !transaction) throw transactionError || new Error("Transaction introuvable.");
      if (transaction.status !== "succeeded") {
        const now = new Date().toISOString();
        const { error } = await insforge.from("saas_payment_transactions").update({ status: "succeeded", paid_at: now, updated_at: now }).eq("id", transaction.id);
        if (error) throw error;
        await insforge.from("saas_invoices").update({ status: "paid", paid_at: now }).eq("id", transaction.invoice_id);
        if (transaction.subscription_id) await insforge.from("saas_subscriptions").update({ status: "active", starts_at: now, updated_at: now }).eq("id", transaction.subscription_id);
        await recordActivity(insforge, user.id, transaction.organization_id, "billing_payment_confirmed", "success", "Paiement d’abonnement confirmé manuellement");
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "request") {
      if (!body.title) throw new Error("Titre de requête requis.");
      const priority = priorities.includes(body.priority) ? body.priority : "normal";
      const requestType = requestTypes.includes(body.requestType) ? body.requestType : "support";
      const { error } = await insforge.from("platform_requests").insert({
        organization_id: body.organizationId || null,
        created_by: user.id,
        request_type: requestType,
        priority,
        title: clean(body.title),
        description: body.description || null,
        due_at: body.dueAt || null,
      });
      if (error) throw error;
      await recordActivity(insforge, user.id, body.organizationId || null, "request_created", priority === "urgent" ? "warning" : "info", `Requête créée: ${body.title}`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "requestStatus") {
      if (!body.requestId || !requestStatuses.includes(body.status)) throw new Error("Statut invalide.");
      const { data, error } = await insforge.from("platform_requests").update({
        status: body.status,
        resolution: body.resolution || null,
        resolved_at: ["resolved", "closed"].includes(body.status) ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq("id", body.requestId).select("organization_id,title").single();
      if (error) throw error;
      await recordActivity(insforge, user.id, data?.organization_id ?? null, "request_updated", "success", `Requête mise à jour: ${data?.title ?? body.requestId}`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "note") {
      if (!body.organizationId || !body.title) throw new Error("Organisation et titre requis.");
      const noteType = noteTypes.includes(body.noteType) ? body.noteType : "follow_up";
      const { error } = await insforge.from("platform_tenant_notes").insert({
        organization_id: body.organizationId,
        author_id: user.id,
        note_type: noteType,
        title: clean(body.title),
        body: body.body || null,
        next_action: body.nextAction || null,
        next_action_at: body.nextActionAt || null,
      });
      if (error) throw error;
      await recordActivity(insforge, user.id, body.organizationId, "tenant_note", "info", `Note tenant: ${body.title}`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "activity") {
      if (!body.eventType || !body.title) throw new Error("Type et titre requis.");
      const severity = severities.includes(body.severity) ? body.severity : "info";
      await recordActivity(insforge, user.id, body.organizationId || null, clean(body.eventType), severity, clean(body.title));
      return NextResponse.json({ ok: true });
    }

    if (body.action === "setting") {
      if (!body.key || !body.value) throw new Error("Clé et valeur JSON requises.");
      let value: unknown;
      try {
        value = JSON.parse(body.value);
      } catch {
        throw new Error("La valeur doit être un JSON valide.");
      }
      const { error } = await insforge.from("platform_settings").upsert({
        key: clean(body.key),
        value,
        description: body.description || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
      await recordActivity(insforge, user.id, null, "setting_updated", "info", `Paramètre mis à jour: ${body.key}`);
      return NextResponse.json({ ok: true });
    }

    throw new Error("Action inconnue.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Opération impossible." }, { status: 400 });
  }
}

async function recordActivity(insforge: any, actorId: string, organizationId: string | null, eventType: string, severity: string, title: string) {
  await insforge.from("platform_activity_events").insert({
    organization_id: organizationId,
    actor_id: actorId,
    event_type: eventType,
    severity,
    title,
    metadata: {},
  });
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}
