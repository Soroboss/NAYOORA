create table public.payment_provider_configs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 provider text not null check(provider in('wave','orange_money','mtn_money','moov_money','cash')), merchant_reference text, enabled boolean not null default false, configuration jsonb not null default '{}', unique(organization_id,provider)
);
create table public.payment_intents (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid references public.member_profiles(id),
 contribution_id uuid references public.contributions(id), provider text not null, amount numeric(14,2) not null check(amount>0), currency char(3) not null default 'XOF', status text not null default 'created' check(status in('created','pending','succeeded','failed','expired','cancelled')), provider_reference text, checkout_url text, expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payment_webhook_events (
 id uuid primary key default gen_random_uuid(), provider text not null, event_id text, payload jsonb not null, received_at timestamptz not null default now(), processed_at timestamptz, processing_error text, unique(provider,event_id)
);
alter table public.payment_provider_configs enable row level security;alter table public.payment_intents enable row level security;alter table public.payment_webhook_events enable row level security;
create policy "finance reads provider configs" on public.payment_provider_configs for select using(public.can_manage_finance(organization_id));
create policy "finance manages provider configs" on public.payment_provider_configs for all using(public.can_manage_finance(organization_id)) with check(public.can_manage_finance(organization_id));
create policy "members read payment intents" on public.payment_intents for select using(public.is_organization_member(organization_id));
create policy "finance manages payment intents" on public.payment_intents for all using(public.can_manage_finance(organization_id)) with check(public.can_manage_finance(organization_id));
