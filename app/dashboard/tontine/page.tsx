import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { TontineManager } from "@/components/tontine-manager";
import { TontineSavingsManager } from "@/components/tontine-savings-manager";

export default async function TontinePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
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
  const canManage = ["organization_admin", "president", "tresorier", "gestionnaire"].includes(membership.role);
  
  const params = await searchParams;
  const currentTab = params.tab || "rotating";

  // Fetch data for rotating tontine
  const [groups, participants, cycles, collections, payouts] = await Promise.all([
    insforge.from("tontine_groups").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    insforge.from("tontine_participants").select("*,phone").eq("organization_id", organizationId).order("payout_rank"),
    insforge.from("tontine_cycles").select("*,beneficiary:tontine_participants(display_name,payout_rank,phone)").eq("organization_id", organizationId).order("cycle_number"),
    insforge.from("tontine_collections").select("*,participant:tontine_participants(display_name,phone),cycle:tontine_cycles(cycle_number)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
    insforge.from("tontine_payouts").select("*,beneficiary:tontine_participants(display_name,phone),cycle:tontine_cycles(cycle_number)").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
  ]);

  // Fetch data for savings tontine
  const [sProducts, sCards, sCollections, sPayouts, orgMembers] = await Promise.all([
    insforge.from("tontine_savings_products").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    insforge.from("tontine_savings_cards").select("*, member:member_profiles(first_name,last_name), product:tontine_savings_products(contribution_amount)").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    insforge.from("tontine_savings_collections").select("*,card:tontine_savings_cards(member:member_profiles(first_name,last_name))").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
    insforge.from("tontine_savings_payouts").select("*,card:tontine_savings_cards(member:member_profiles(first_name,last_name))").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(50),
    insforge.from("member_profiles").select("id, user_id, first_name, last_name").eq("organization_id", organizationId),
  ]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link>
        <div className="org-switch">
          <span>◍</span>
          <div>
            <b>{(membership.organization as any)?.name}</b>
            <small>Tontine</small>
          </div>
        </div>
        <nav>
          <Link href="/dashboard">◈ Vue d'ensemble</Link>
          <Link href="/dashboard/members">· Participants</Link>
          <Link className="active" href="/dashboard/tontine">· Tontine</Link>
          <Link href="/dashboard/finance">· Cotisations & Caisse</Link>
          <Link href="/dashboard/treasury">· Trésorerie</Link>
          <Link href="/dashboard/reports">· Rapports</Link>
          <Link href="/dashboard/organigramme">· Organigramme</Link>
          <Link href="/portal/chat">· Chat interne</Link></nav>
      </aside>
      <section className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Module Tontine</p>
            <h1>Gestion de tontine</h1>
            <p>Gérez l’argent, les bénéficiaires, les encaissements journaliers, et les reversements.</p>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
          <Link 
            href="/dashboard/tontine?tab=rotating" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '6px', 
              backgroundColor: currentTab === 'rotating' ? '#f3f4f6' : 'transparent',
              fontWeight: currentTab === 'rotating' ? '600' : '400',
              color: currentTab === 'rotating' ? '#111827' : '#6b7280'
            }}
          >
            Tontine Rotative
          </Link>
          <Link 
            href="/dashboard/tontine?tab=savings" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '6px', 
              backgroundColor: currentTab === 'savings' ? '#f3f4f6' : 'transparent',
              fontWeight: currentTab === 'savings' ? '600' : '400',
              color: currentTab === 'savings' ? '#111827' : '#6b7280'
            }}
          >
            Collecte & Épargne
          </Link>
        </div>

        {currentTab === 'rotating' && (
          <TontineManager 
            groups={groups.data ?? []} 
            participants={participants.data ?? []} 
            cycles={cycles.data ?? []} 
            collections={collections.data ?? []} 
            payouts={payouts.data ?? []} 
            canManage={canManage} 
          />
        )}

        {currentTab === 'savings' && (
          <TontineSavingsManager 
            products={sProducts.data ?? []} 
            cards={sCards.data ?? []} 
            collections={sCollections.data ?? []} 
            payouts={sPayouts.data ?? []} 
            members={orgMembers.data ?? []}
            canManage={canManage} 
          />
        )}
      </section>
    </main>
  );
}
