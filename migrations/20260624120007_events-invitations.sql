-- Invitation tracking stays separate from delivery channels (SMS/WhatsApp are added later).
create table public.event_invitations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  status text not null default 'pending' check(status in('pending','sent','confirmed','declined')), invited_at timestamptz not null default now(), responded_at timestamptz,
  unique(event_id,member_profile_id)
);
create index event_invitations_event_idx on public.event_invitations(organization_id,event_id,status);
alter table public.event_invitations enable row level security;
create policy "members read event invitations" on public.event_invitations for select using(public.is_organization_member(organization_id));
create policy "managers write event invitations" on public.event_invitations for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
