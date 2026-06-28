-- NAYOORA Tontine Savings Module
-- Tenant-scoped tables for daily savings collection (Djangi/Carte): products, cards/subscriptions, collections, payouts

create table if not exists public.tontine_savings_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contribution_amount numeric(14,2) not null check (contribution_amount >= 0),
  duration_days integer not null default 31 check (duration_days > 0),
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  currency char(3) not null default 'XOF',
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tontine_savings_cards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.tontine_savings_products(id) on delete restrict,
  member_profile_id uuid references public.member_profiles(id) on delete cascade,
  collector_id uuid references public.organization_members(id) on delete set null,
  start_date date not null default current_date,
  end_date date,
  expected_amount numeric(14,2) not null default 0 check (expected_amount >= 0),
  status text not null default 'active' check (status in ('active','completed','paid','cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tontine_savings_collections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  card_id uuid not null references public.tontine_savings_cards(id) on delete cascade,
  collector_id uuid references public.organization_members(id) on delete set null,
  amount_paid numeric(14,2) not null check (amount_paid >= 0),
  collection_date date not null default current_date,
  status text not null default 'collected' check (status in ('collected','cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.tontine_savings_payouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  card_id uuid not null references public.tontine_savings_cards(id) on delete cascade,
  gross_amount numeric(14,2) not null default 0 check (gross_amount >= 0),
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  net_amount numeric(14,2) not null default 0 check (net_amount >= 0),
  payout_date date not null default current_date,
  status text not null default 'paid' check (status in ('pending','paid','cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_tontine_savings_products_org_id on public.tontine_savings_products(organization_id);
create index if not exists idx_tontine_savings_cards_org_id on public.tontine_savings_cards(organization_id);
create index if not exists idx_tontine_savings_collections_org_id on public.tontine_savings_collections(organization_id);
create index if not exists idx_tontine_savings_payouts_org_id on public.tontine_savings_payouts(organization_id);
create index if not exists idx_tontine_savings_cards_member_id on public.tontine_savings_cards(member_profile_id);
create index if not exists idx_tontine_savings_cards_collector_id on public.tontine_savings_cards(collector_id);
create index if not exists idx_tontine_savings_collections_card_id on public.tontine_savings_collections(card_id);

alter table public.tontine_savings_products enable row level security;
alter table public.tontine_savings_cards enable row level security;
alter table public.tontine_savings_collections enable row level security;
alter table public.tontine_savings_payouts enable row level security;

-- Policies for tontine_savings_products
drop policy if exists "members read tontine_savings_products" on public.tontine_savings_products;
create policy "members read tontine_savings_products" on public.tontine_savings_products
  for select using (public.is_organization_member(organization_id));
drop policy if exists "managers write tontine_savings_products" on public.tontine_savings_products;
create policy "managers write tontine_savings_products" on public.tontine_savings_products
  for all using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

-- Policies for tontine_savings_cards
drop policy if exists "members read tontine_savings_cards" on public.tontine_savings_cards;
create policy "members read tontine_savings_cards" on public.tontine_savings_cards
  for select using (public.is_organization_member(organization_id));
drop policy if exists "managers write tontine_savings_cards" on public.tontine_savings_cards;
create policy "managers write tontine_savings_cards" on public.tontine_savings_cards
  for all using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

-- Policies for tontine_savings_collections
drop policy if exists "members read tontine_savings_collections" on public.tontine_savings_collections;
create policy "members read tontine_savings_collections" on public.tontine_savings_collections
  for select using (public.is_organization_member(organization_id));
drop policy if exists "finance write tontine_savings_collections" on public.tontine_savings_collections;
create policy "finance write tontine_savings_collections" on public.tontine_savings_collections
  for all using (public.can_manage_finance(organization_id))
  with check (public.can_manage_finance(organization_id));

-- Policies for tontine_savings_payouts
drop policy if exists "members read tontine_savings_payouts" on public.tontine_savings_payouts;
create policy "members read tontine_savings_payouts" on public.tontine_savings_payouts
  for select using (public.is_organization_member(organization_id));
drop policy if exists "finance write tontine_savings_payouts" on public.tontine_savings_payouts;
create policy "finance write tontine_savings_payouts" on public.tontine_savings_payouts
  for all using (public.can_manage_finance(organization_id))
  with check (public.can_manage_finance(organization_id));
