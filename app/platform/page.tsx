import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { PlatformManager } from "@/components/platform-manager";

export default async function Platform() {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) redirect("/login");

  const { data: admin } = await insforge.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/dashboard");

  const [
    plans,
    organizations,
    subscriptions,
    invoices,
    requests,
    notes,
    activity,
    settings,
    members,
    logs,
  ] = await Promise.all([
    insforge.from("saas_plans").select("*").order("price_xof"),
    insforge.from("organizations").select("id,name,slug,organization_type,currency,country_code,email,phone,created_at,updated_at").order("created_at", { ascending: false }),
    insforge.from("saas_subscriptions").select("id,organization_id,plan_id,status,starts_at,ends_at,updated_at,plan:saas_plans(id,name,code,price_xof,member_limit,admin_limit),organization:organizations(id,name)").order("updated_at", { ascending: false }),
    insforge.from("saas_invoices").select("id,organization_id,subscription_id,amount,currency,status,due_at,paid_at,created_at,organization:organizations(id,name)").order("created_at", { ascending: false }).limit(80),
    insforge.from("platform_requests").select("id,organization_id,request_type,priority,status,title,description,due_at,resolved_at,created_at,updated_at,organization:organizations(id,name)").order("created_at", { ascending: false }).limit(80),
    insforge.from("platform_tenant_notes").select("id,organization_id,note_type,title,body,next_action,next_action_at,created_at,organization:organizations(id,name)").order("created_at", { ascending: false }).limit(80),
    insforge.from("platform_activity_events").select("id,organization_id,event_type,severity,title,metadata,created_at,organization:organizations(id,name)").order("created_at", { ascending: false }).limit(120),
    insforge.from("platform_settings").select("key,value,description,updated_at").order("key"),
    insforge.from("organization_members").select("id,organization_id,role,status,created_at").eq("status", "active").limit(500),
    insforge.from("audit_logs").select("id,organization_id,action,entity_type,entity_id,created_at,organization:organizations(id,name)").order("created_at", { ascending: false }).limit(80),
  ]);

  return (
    <main className="platform-shell">
      <header>
        <span className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</span>
        <div>
          <p>Console propriétaire SaaS</p>
          <small>{user.email}</small>
        </div>
      </header>
      <PlatformManager
        plans={plans.data ?? []}
        organizations={organizations.data ?? []}
        subscriptions={subscriptions.data ?? []}
        invoices={invoices.data ?? []}
        requests={requests.data ?? []}
        notes={notes.data ?? []}
        activity={activity.data ?? []}
        settings={settings.data ?? []}
        members={members.data ?? []}
        logs={logs.data ?? []}
      />
    </main>
  );
}
