-- Administration primitives: card issuance, invitations and organization settings.
alter table public.organizations add column if not exists phone text, add column if not exists email text, add column if not exists logo_path text;
create table public.organization_invites (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 email text not null, role public.member_role not null default 'membre', token uuid not null default gen_random_uuid(), status text not null default 'pending' check(status in('pending','accepted','expired','revoked')),
 invited_by uuid not null references auth.users(id), expires_at timestamptz not null default now()+interval '7 days', created_at timestamptz not null default now(), unique(organization_id,email,status)
);
create index organization_invites_org_idx on public.organization_invites(organization_id,status,created_at desc);
alter table public.organization_invites enable row level security;
create policy "admins read invites" on public.organization_invites for select using(public.can_manage_organization(organization_id));
create policy "admins write invites" on public.organization_invites for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
