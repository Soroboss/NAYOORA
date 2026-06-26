-- NAYOORA: Registration Forms and Requests
create table public.registration_forms (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    title text not null default 'Formulaire d''inscription',
    description text,
    fields jsonb not null default '[]',
    is_active boolean not null default true,
    require_approval boolean not null default true,
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(organization_id) -- one form per organization for now
);

create table public.registration_requests (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    registration_form_id uuid references public.registration_forms(id) on delete set null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    data jsonb not null default '{}',
    submitted_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by uuid references auth.users(id),
    rejection_reason text,
    member_profile_id uuid references public.member_profiles(id)
);

alter table public.registration_forms enable row level security;
alter table public.registration_requests enable row level security;

-- Admins can manage their organization's forms
create policy "admins manage registration forms" on public.registration_forms 
    for all using (public.is_organization_member(organization_id)) 
    with check (public.is_organization_member(organization_id));

-- Public can view active forms
create policy "public reads active forms" on public.registration_forms 
    for select using (is_active = true);

-- Admins can manage their organization's requests
create policy "admins manage registration requests" on public.registration_requests 
    for all using (public.is_organization_member(organization_id)) 
    with check (public.is_organization_member(organization_id));

-- Public can insert requests (we use RPC for safety to avoid exposing insert directly, but we can also use RLS)
create policy "public inserts registration requests" on public.registration_requests 
    for insert with check (
        status = 'pending' 
        and exists (
            select 1 from public.registration_forms f 
            where f.id = registration_form_id 
            and f.organization_id = organization_id 
            and f.is_active = true
        )
    );
