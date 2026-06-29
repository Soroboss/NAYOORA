alter table public.saas_invoices add column if not exists tenant_id uuid references public.organizations(id) on delete cascade;
update public.saas_invoices set tenant_id = organization_id where tenant_id is null;
alter table public.saas_invoices alter column tenant_id set not null;
create index if not exists saas_invoices_tenant_status_idx on public.saas_invoices(tenant_id, status, created_at desc);

create table if not exists public.saas_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tenant_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.saas_invoices(id) on delete cascade,
  subscription_id uuid references public.saas_subscriptions(id) on delete set null,
  provider text not null check (provider in ('wave','orange_money')),
  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null default 'XOF',
  status text not null default 'created' check (status in ('created','pending','succeeded','failed','cancelled','expired')),
  provider_reference text,
  checkout_url text,
  metadata jsonb not null default '{}',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saas_payment_tenant_matches_organization check (tenant_id = organization_id)
);

create unique index if not exists saas_payment_provider_reference_uidx
  on public.saas_payment_transactions(provider, provider_reference)
  where provider_reference is not null;
create index if not exists saas_payment_tenant_status_idx on public.saas_payment_transactions(tenant_id, status, created_at desc);
create index if not exists saas_payment_invoice_idx on public.saas_payment_transactions(invoice_id, created_at desc);

alter table public.saas_payment_transactions enable row level security;

drop policy if exists "organization creators create invoices" on public.saas_invoices;
create policy "organization creators create invoices" on public.saas_invoices for insert to authenticated
with check (
  tenant_id = organization_id and exists (
    select 1 from public.organizations o where o.id = organization_id and o.created_by = auth.uid()
  )
);

drop policy if exists "tenants read own invoices" on public.saas_invoices;
create policy "tenants read own invoices" on public.saas_invoices for select to authenticated
using (
  public.is_platform_admin() or exists (
    select 1 from public.organizations o where o.id = organization_id and o.created_by = auth.uid()
  ) or public.is_organization_member(organization_id)
);

drop policy if exists "tenants create billing transactions" on public.saas_payment_transactions;
create policy "tenants create billing transactions" on public.saas_payment_transactions for insert to authenticated
with check (
  tenant_id = organization_id and exists (
    select 1 from public.organizations o where o.id = organization_id and o.created_by = auth.uid()
  )
);

drop policy if exists "tenants read billing transactions" on public.saas_payment_transactions;
create policy "tenants read billing transactions" on public.saas_payment_transactions for select to authenticated
using (
  public.is_platform_admin() or exists (
    select 1 from public.organizations o where o.id = organization_id and o.created_by = auth.uid()
  ) or public.is_organization_member(organization_id)
);

drop policy if exists "platform admins manage billing transactions" on public.saas_payment_transactions;
create policy "platform admins manage billing transactions" on public.saas_payment_transactions for all to authenticated
using (public.is_platform_admin()) with check (public.is_platform_admin());
