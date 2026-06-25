-- SaaS platform operations cockpit.
-- These records are not tenant-user data; they are platform-owner data used to
-- supervise tenants, support requests, incidents, lifecycle and global settings.

create table if not exists public.platform_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  created_by uuid,
  assigned_to uuid,
  request_type text not null default 'support'
    check (request_type in ('support','billing','upgrade','technical','security','data','incident','other')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  status text not null default 'open'
    check (status in ('open','in_progress','waiting_tenant','resolved','closed')),
  title text not null,
  description text,
  resolution text,
  due_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_tenant_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid,
  note_type text not null default 'follow_up'
    check (note_type in ('follow_up','risk','success','billing','security','internal')),
  title text not null,
  body text,
  next_action text,
  next_action_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid,
  event_type text not null,
  severity text not null default 'info'
    check (severity in ('info','success','warning','critical')),
  title text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}',
  description text,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

create index if not exists platform_requests_organization_id_idx on public.platform_requests(organization_id);
create index if not exists platform_requests_status_priority_idx on public.platform_requests(status, priority, created_at desc);
create index if not exists platform_tenant_notes_organization_id_idx on public.platform_tenant_notes(organization_id);
create index if not exists platform_tenant_notes_next_action_idx on public.platform_tenant_notes(next_action_at) where next_action_at is not null;
create index if not exists platform_activity_events_organization_id_idx on public.platform_activity_events(organization_id);
create index if not exists platform_activity_events_created_at_idx on public.platform_activity_events(created_at desc);

alter table public.platform_requests enable row level security;
alter table public.platform_tenant_notes enable row level security;
alter table public.platform_activity_events enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "platform admins manage requests" on public.platform_requests;
create policy "platform admins manage requests" on public.platform_requests for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists "platform admins manage tenant notes" on public.platform_tenant_notes;
create policy "platform admins manage tenant notes" on public.platform_tenant_notes for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists "platform admins manage activity events" on public.platform_activity_events;
create policy "platform admins manage activity events" on public.platform_activity_events for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists "platform admins manage settings" on public.platform_settings;
create policy "platform admins manage settings" on public.platform_settings for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());

insert into public.platform_settings(key, value, description)
values
  ('brand', '{"name":"NAYOORA","slogan":"Gérez. Connectez. Développez.","support_email":"support@nayoora.com"}', 'Identité publique de la plateforme'),
  ('tenant_health', '{"trial_warning_days":7,"overdue_invoice_days":5,"inactive_tenant_days":30}', 'Seuils de suivi des tenants'),
  ('security', '{"require_email_verification":true,"platform_console_private":true,"activity_retention_days":365}', 'Paramètres de sécurité SaaS')
on conflict (key) do nothing;
