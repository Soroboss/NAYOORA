-- Per-organization module flags support a single adaptive SaaS without separate products.
create table public.organization_modules (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 module_code text not null, active boolean not null default true, configuration jsonb not null default '{}', updated_at timestamptz not null default now(), unique(organization_id,module_code)
);
create index organization_modules_org_idx on public.organization_modules(organization_id,active);
alter table public.organization_modules enable row level security;
create policy "members read modules" on public.organization_modules for select using(public.is_organization_member(organization_id));
create policy "admins manage modules" on public.organization_modules for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
