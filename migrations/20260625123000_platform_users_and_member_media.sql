create table if not exists public.platform_registered_users (
  id uuid primary key,
  email text,
  full_name text,
  phone text,
  avatar_path text,
  created_at timestamptz,
  last_seen_at timestamptz,
  synced_at timestamptz not null default now()
);

alter table public.platform_registered_users enable row level security;

drop policy if exists "platform admins read registered users" on public.platform_registered_users;
create policy "platform admins read registered users"
  on public.platform_registered_users for select
  using (public.is_platform_admin());

create index if not exists platform_registered_users_email_idx
  on public.platform_registered_users(email);

alter table public.member_profiles add column if not exists photo_url text;

-- Initial data sync is intentionally an admin operation because auth.users is
-- not exposed to tenant code. Re-run this from InsForge CLI when needed:
-- insert into public.platform_registered_users(id,email,created_at,synced_at)
-- select id,email,created_at,now() from auth.users
-- on conflict (id) do update set email=excluded.email, synced_at=now();
