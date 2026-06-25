-- NAYOORA Tontine module
-- Tenant-scoped tables for rotating savings groups: rules, participants,
-- collection periods, beneficiary order, payouts and commissions.

alter type public.organization_type add value if not exists 'tontine';

create table if not exists public.tontine_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contribution_amount numeric(14,2) not null check (contribution_amount >= 0),
  frequency text not null default 'monthly' check (frequency in ('weekly','biweekly','monthly','custom')),
  commission_type text not null default 'fixed' check (commission_type in ('none','fixed','percentage')),
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  currency char(3) not null default 'XOF',
  start_date date,
  status text not null default 'draft' check (status in ('draft','active','paused','completed','cancelled')),
  rules jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tontine_participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tontine_group_id uuid not null references public.tontine_groups(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete set null,
  display_name text not null,
  phone text,
  email text,
  payout_rank integer not null check (payout_rank > 0),
  contribution_multiplier numeric(8,2) not null default 1 check (contribution_multiplier > 0),
  status text not null default 'active' check (status in ('active','paused','completed','excluded')),
  joined_at timestamptz not null default now(),
  unique (tontine_group_id, payout_rank)
);

create table if not exists public.tontine_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tontine_group_id uuid not null references public.tontine_groups(id) on delete cascade,
  cycle_number integer not null check (cycle_number > 0),
  starts_on date,
  ends_on date,
  collection_due_on date,
  payout_on date,
  beneficiary_participant_id uuid references public.tontine_participants(id) on delete set null,
  expected_amount numeric(14,2) not null default 0 check (expected_amount >= 0),
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  status text not null default 'planned' check (status in ('planned','collecting','ready_to_pay','paid','closed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  unique (tontine_group_id, cycle_number)
);

create table if not exists public.tontine_collections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tontine_group_id uuid not null references public.tontine_groups(id) on delete cascade,
  tontine_cycle_id uuid not null references public.tontine_cycles(id) on delete cascade,
  participant_id uuid not null references public.tontine_participants(id) on delete cascade,
  amount_due numeric(14,2) not null default 0 check (amount_due >= 0),
  amount_paid numeric(14,2) not null default 0 check (amount_paid >= 0),
  commission_paid numeric(14,2) not null default 0 check (commission_paid >= 0),
  payment_method text,
  status text not null default 'pending' check (status in ('pending','partial','paid','late','waived')),
  paid_at timestamptz,
  created_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.tontine_payouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tontine_group_id uuid not null references public.tontine_groups(id) on delete cascade,
  tontine_cycle_id uuid not null references public.tontine_cycles(id) on delete cascade,
  beneficiary_participant_id uuid not null references public.tontine_participants(id) on delete restrict,
  gross_amount numeric(14,2) not null default 0 check (gross_amount >= 0),
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  net_amount numeric(14,2) not null default 0 check (net_amount >= 0),
  status text not null default 'scheduled' check (status in ('scheduled','approved','paid','cancelled')),
  scheduled_at timestamptz,
  paid_at timestamptz,
  created_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.tontine_commissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tontine_group_id uuid not null references public.tontine_groups(id) on delete cascade,
  tontine_cycle_id uuid references public.tontine_cycles(id) on delete set null,
  source_type text not null default 'collection' check (source_type in ('collection','payout','manual')),
  source_id uuid,
  amount numeric(14,2) not null check (amount >= 0),
  status text not null default 'collected' check (status in ('expected','collected','waived')),
  collected_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tontine_groups_organization_id on public.tontine_groups(organization_id);
create index if not exists idx_tontine_participants_organization_id on public.tontine_participants(organization_id);
create index if not exists idx_tontine_participants_group_id on public.tontine_participants(tontine_group_id);
create index if not exists idx_tontine_cycles_organization_id on public.tontine_cycles(organization_id);
create index if not exists idx_tontine_cycles_group_id on public.tontine_cycles(tontine_group_id);
create index if not exists idx_tontine_collections_organization_id on public.tontine_collections(organization_id);
create index if not exists idx_tontine_collections_cycle_id on public.tontine_collections(tontine_cycle_id);
create index if not exists idx_tontine_collections_participant_id on public.tontine_collections(participant_id);
create index if not exists idx_tontine_payouts_organization_id on public.tontine_payouts(organization_id);
create index if not exists idx_tontine_payouts_cycle_id on public.tontine_payouts(tontine_cycle_id);
create index if not exists idx_tontine_commissions_organization_id on public.tontine_commissions(organization_id);
create index if not exists idx_tontine_commissions_group_id on public.tontine_commissions(tontine_group_id);

alter table public.tontine_groups enable row level security;
alter table public.tontine_participants enable row level security;
alter table public.tontine_cycles enable row level security;
alter table public.tontine_collections enable row level security;
alter table public.tontine_payouts enable row level security;
alter table public.tontine_commissions enable row level security;

drop policy if exists "members read tontine_groups" on public.tontine_groups;
create policy "members read tontine_groups" on public.tontine_groups
  for select using (public.is_organization_member(organization_id));
drop policy if exists "managers write tontine_groups" on public.tontine_groups;
create policy "managers write tontine_groups" on public.tontine_groups
  for all using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

drop policy if exists "members read tontine_participants" on public.tontine_participants;
create policy "members read tontine_participants" on public.tontine_participants
  for select using (public.is_organization_member(organization_id));
drop policy if exists "managers write tontine_participants" on public.tontine_participants;
create policy "managers write tontine_participants" on public.tontine_participants
  for all using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

drop policy if exists "members read tontine_cycles" on public.tontine_cycles;
create policy "members read tontine_cycles" on public.tontine_cycles
  for select using (public.is_organization_member(organization_id));
drop policy if exists "managers write tontine_cycles" on public.tontine_cycles;
create policy "managers write tontine_cycles" on public.tontine_cycles
  for all using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

drop policy if exists "members read tontine_collections" on public.tontine_collections;
create policy "members read tontine_collections" on public.tontine_collections
  for select using (public.is_organization_member(organization_id));
drop policy if exists "finance write tontine_collections" on public.tontine_collections;
create policy "finance write tontine_collections" on public.tontine_collections
  for all using (public.can_manage_finance(organization_id))
  with check (public.can_manage_finance(organization_id));

drop policy if exists "members read tontine_payouts" on public.tontine_payouts;
create policy "members read tontine_payouts" on public.tontine_payouts
  for select using (public.is_organization_member(organization_id));
drop policy if exists "finance write tontine_payouts" on public.tontine_payouts;
create policy "finance write tontine_payouts" on public.tontine_payouts
  for all using (public.can_manage_finance(organization_id))
  with check (public.can_manage_finance(organization_id));

drop policy if exists "members read tontine_commissions" on public.tontine_commissions;
create policy "members read tontine_commissions" on public.tontine_commissions
  for select using (public.is_organization_member(organization_id));
drop policy if exists "finance write tontine_commissions" on public.tontine_commissions;
create policy "finance write tontine_commissions" on public.tontine_commissions
  for all using (public.can_manage_finance(organization_id))
  with check (public.can_manage_finance(organization_id));
