create table public.mobilizations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 sector_id uuid references public.sectors(id) on delete set null, title text not null, description text, scheduled_at timestamptz, location text,
 status text not null default 'planned' check(status in('planned','active','completed','cancelled')), created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create index mobilizations_organization_date_idx on public.mobilizations(organization_id,scheduled_at desc);
alter table public.mobilizations enable row level security;
create policy "members read mobilizations" on public.mobilizations for select using(public.is_organization_member(organization_id));
create policy "managers write mobilizations" on public.mobilizations for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create index if not exists claims_organization_status_idx on public.claims(organization_id,status,opened_at desc);
