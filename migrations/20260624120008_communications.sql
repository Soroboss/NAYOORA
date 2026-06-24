-- Delivery is queued here; provider workers/webhooks will transition recipient status later.
create table public.notification_inbox (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  organization_member_id uuid not null references public.organization_members(id) on delete cascade, title text not null, body text not null,
  message_id uuid references public.messages(id) on delete set null, read_at timestamptz, created_at timestamptz not null default now()
);
create index notification_inbox_member_idx on public.notification_inbox(organization_member_id,read_at,created_at desc);
alter table public.notification_inbox enable row level security;
create policy "users read their notifications" on public.notification_inbox for select using(exists(select 1 from public.organization_members om where om.id=organization_member_id and om.user_id=auth.uid()));
create policy "managers create notifications" on public.notification_inbox for insert with check(public.can_manage_organization(organization_id));
create policy "users mark their notifications read" on public.notification_inbox for update using(exists(select 1 from public.organization_members om where om.id=organization_member_id and om.user_id=auth.uid())) with check(exists(select 1 from public.organization_members om where om.id=organization_member_id and om.user_id=auth.uid()));
create index messages_organization_channel_idx on public.messages(organization_id,channel,status,created_at desc);
