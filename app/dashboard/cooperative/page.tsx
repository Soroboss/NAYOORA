import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { CooperativeManager } from "@/components/cooperative-manager";

export default async function CooperativePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const insforge = await createClient();
  const { data: { user } } = await insforge.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: membership } = await insforge
    .from("organization_members")
    .select("organization_id,role,organization:organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
    
  if (!membership) redirect("/onboarding");
  const organizationId = membership.organization_id;
  const canManage = ["organization_admin", "president", "secretaire", "gestionnaire", "tresorier"].includes(membership.role);
  
  const params = await searchParams;
  const currentTab = params.tab || "harvests";

  const [members, plots, harvests, sales, inputs] = await Promise.all([
    insforge.from("member_profiles").select("id,first_name,last_name").eq("organization_id", organizationId).is("deleted_at", null).eq("status", "active").order("last_name"),
    insforge.from("plots").select("id,name,area_hectares,crop_type,member:member_profiles(first_name,last_name)").eq("organization_id", organizationId),
    insforge.from("harvests").select("id,product,quantity,unit,harvested_at,plot:plots(name)").eq("organization_id", organizationId).order("harvested_at", { ascending: false }).limit(20),
    insforge.from("sales").select("id,product,quantity,unit,unit_price,buyer_name,sold_at").eq("organization_id", organizationId).order("sold_at", { ascending: false }).limit(20),
    insforge.from("inputs").select("id,name,quantity,unit,unit_cost,received_at").eq("organization_id", organizationId).order("received_at", { ascending: false }).limit(20)
  ]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch">
          <span>🌾</span>
          <div>
            <b>{(membership.organization as any)?.name}</b>
            <small>Coopérative</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Producteurs</Link>
          <Link className="active" href="/dashboard/cooperative">· Récoltes & Intrants</Link>
          <Link href="/dashboard/finance">· Caisse</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav>
      </aside>

      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Agriculture</p>
            <h1>Gestion de la Coopérative</h1>
            <p>Suivez les parcelles, les pesées de vos producteurs et gérez la distribution d'intrants.</p>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
          <Link 
            href="/dashboard/cooperative?tab=harvests" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '6px', 
              backgroundColor: currentTab === 'harvests' ? '#f3f4f6' : 'transparent',
              fontWeight: currentTab === 'harvests' ? '600' : '400',
              color: currentTab === 'harvests' ? '#111827' : '#6b7280',
              textDecoration: "none"
            }}
          >
            Récoltes & Ventes
          </Link>
          <Link 
            href="/dashboard/cooperative?tab=inputs" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '6px', 
              backgroundColor: currentTab === 'inputs' ? '#f3f4f6' : 'transparent',
              fontWeight: currentTab === 'inputs' ? '600' : '400',
              color: currentTab === 'inputs' ? '#111827' : '#6b7280',
              textDecoration: "none"
            }}
          >
            Magasin (Intrants)
          </Link>
        </div>

        <CooperativeManager 
          tab={currentTab}
          members={members.data || []} 
          plots={plots.data || []} 
          harvests={harvests.data || []} 
          sales={sales.data || []} 
          inputs={inputs.data || []}
          canManage={canManage}
          organizationId={organizationId}
        />
      </section>
    </main>
  );
}
