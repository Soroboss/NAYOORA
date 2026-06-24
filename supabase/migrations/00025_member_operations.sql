create table public.member_exports (id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,format text not null default 'csv',filters jsonb not null default '{}',requested_by uuid references auth.users(id),created_at timestamptz not null default now());
alter table public.member_exports enable row level security;
create policy "managers read exports" on public.member_exports for select using(public.can_manage_organization(organization_id));
create policy "managers create exports" on public.member_exports for insert with check(public.can_manage_organization(organization_id));
create index if not exists member_tags_organization_name_idx on public.member_tags(organization_id,name);
create index if not exists member_custom_fields_organization_idx on public.member_custom_fields(organization_id);
