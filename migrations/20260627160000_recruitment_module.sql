-- Create registration_forms table
create table if not exists public.registration_forms (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    title text not null default 'Formulaire d''adhésion',
    description text,
    is_active boolean not null default false,
    require_approval boolean not null default true,
    fields jsonb not null default '[]'::jsonb,
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(organization_id)
);

alter table public.registration_forms enable row level security;

create policy "Admins can manage registration forms"
on public.registration_forms for all to authenticated
using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = registration_forms.organization_id
    and om.user_id = auth.uid()
    and om.role in ('organization_admin', 'president')
  )
)
with check (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = registration_forms.organization_id
    and om.user_id = auth.uid()
    and om.role in ('organization_admin', 'president')
  )
);

create policy "Public can read active registration forms"
on public.registration_forms for select
using (is_active = true);


-- Create registration_requests table
create table if not exists public.registration_requests (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    form_id uuid references public.registration_forms(id) on delete cascade not null,
    data jsonb not null,
    status text not null default 'pending' check(status in ('pending', 'approved', 'rejected')),
    submitted_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by uuid references auth.users(id)
);

alter table public.registration_requests enable row level security;

create policy "Admins can read registration requests"
on public.registration_requests for select to authenticated
using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = registration_requests.organization_id
    and om.user_id = auth.uid()
    and om.role in ('organization_admin', 'president')
  )
);

create policy "Admins can update registration requests"
on public.registration_requests for update to authenticated
using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = registration_requests.organization_id
    and om.user_id = auth.uid()
    and om.role in ('organization_admin', 'president')
  )
)
with check (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = registration_requests.organization_id
    and om.user_id = auth.uid()
    and om.role in ('organization_admin', 'president')
  )
);

create policy "Public can insert registration requests"
on public.registration_requests for insert
with check (
  exists (
    select 1 from public.registration_forms rf
    where rf.id = registration_requests.form_id
    and rf.is_active = true
  )
);
