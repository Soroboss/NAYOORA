-- NAYOORA: foundation multi-tenant. Run in InsForge database import.
create extension if not exists "pgcrypto";

create type public.organization_type as enum ('mutuelle','association','cooperative','syndicat','ong','parti_politique');
create type public.member_role as enum ('organization_admin','president','secretaire','tresorier','gestionnaire','membre');
create type public.member_status as enum ('active','inactive','suspended');
create type public.payment_status as enum ('pending','confirmed','failed','cancelled');

create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null check (char_length(name) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), organization_type public.organization_type not null,
  currency char(3) not null default 'XOF', country_code char(2), created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organization_members (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role public.member_role not null default 'membre',
  status public.member_status not null default 'active', joined_at timestamptz not null default now(), unique(organization_id,user_id)
);
create table public.member_profiles (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  organization_member_id uuid references public.organization_members(id) on delete set null, member_number text,
  first_name text not null, last_name text not null, phone text, email text, address text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique(organization_id,member_number)
);
create table public.contribution_plans (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, amount numeric(14,2) not null check (amount >= 0), frequency text not null check (frequency in ('weekly','monthly','quarterly','yearly','one_off')), active boolean not null default true, created_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  member_profile_id uuid references public.member_profiles(id) on delete set null, contribution_plan_id uuid references public.contribution_plans(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0), currency char(3) not null default 'XOF', status public.payment_status not null default 'pending',
  provider text, provider_reference text, paid_at timestamptz, created_at timestamptz not null default now(), unique(provider,provider_reference)
);
create table public.cash_transactions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  direction text not null check (direction in ('in','out')), category text not null, amount numeric(14,2) not null check (amount > 0),
  occurred_at timestamptz not null default now(), reference text, notes text, created_by uuid references auth.users(id)
);
create table public.events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, description text, location text, starts_at timestamptz not null, ends_at timestamptz, created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id), action text not null, entity_type text not null, entity_id uuid, before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
-- Add loans, solidarity_cases, debts, messages, documents and reports using this same organization_id convention in subsequent migrations.

create index organization_members_user_active_idx on public.organization_members(user_id) where status = 'active';
create index member_profiles_organization_idx on public.member_profiles(organization_id);
create index payments_organization_status_idx on public.payments(organization_id,status);
create index cash_transactions_organization_date_idx on public.cash_transactions(organization_id,occurred_at desc);

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members om where om.organization_id = target_organization_id and om.user_id = auth.uid() and om.status = 'active');
$$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.member_profiles enable row level security;
alter table public.contribution_plans enable row level security;
alter table public.payments enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.events enable row level security;
alter table public.audit_logs enable row level security;

create policy "members read their organizations" on public.organizations for select using (public.is_organization_member(id));
create policy "creators read their new organization" on public.organizations for select using (created_by = auth.uid());
create policy "users create organizations" on public.organizations for insert with check (created_by = auth.uid());
create policy "members read organization memberships" on public.organization_members for select using (public.is_organization_member(organization_id));
create policy "creator adds initial membership" on public.organization_members for insert with check (user_id = auth.uid() and exists (select 1 from public.organizations o where o.id = organization_id and o.created_by = auth.uid()));
create policy "members access profiles" on public.member_profiles for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "members access contribution plans" on public.contribution_plans for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "members access payments" on public.payments for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "members access cash" on public.cash_transactions for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "members access events" on public.events for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
create policy "members read audit logs" on public.audit_logs for select using (public.is_organization_member(organization_id));
