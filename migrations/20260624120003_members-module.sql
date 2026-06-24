-- Member directory, imports and soft deletion for the Phase 1 MVP.
alter table public.member_profiles
  add column if not exists status public.member_status not null default 'active',
  add column if not exists birth_date date,
  add column if not exists joined_on date not null default current_date,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz not null default now();

create table public.member_imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_name text not null, total_rows integer not null default 0 check(total_rows >= 0),
  imported_rows integer not null default 0 check(imported_rows >= 0),
  failed_rows integer not null default 0 check(failed_rows >= 0),
  status text not null default 'processing' check(status in('processing','completed','completed_with_errors','failed')),
  imported_by uuid not null references auth.users(id), created_at timestamptz not null default now(), completed_at timestamptz
);
create table public.member_import_errors (
  id uuid primary key default gen_random_uuid(), import_id uuid not null references public.member_imports(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade, row_number integer not null, message text not null, raw_data jsonb not null default '{}'
);
create index member_profiles_directory_idx on public.member_profiles(organization_id,status,last_name,first_name) where deleted_at is null;
create index member_imports_organization_idx on public.member_imports(organization_id,created_at desc);

alter table public.member_imports enable row level security;
alter table public.member_import_errors enable row level security;
create policy "managers read imports" on public.member_imports for select using(public.can_manage_organization(organization_id));
create policy "managers write imports" on public.member_imports for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create policy "managers read import errors" on public.member_import_errors for select using(public.can_manage_organization(organization_id));
create policy "managers write import errors" on public.member_import_errors for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
