create table public.card_templates (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null unique references public.organizations(id) on delete cascade,
 primary_color text not null default '#183B32', accent_color text not null default '#D8EE62', background_color text not null default '#FFFFFF', footer_text text, updated_at timestamptz not null default now()
);
alter table public.card_templates enable row level security;
create policy "members read card template" on public.card_templates for select using(public.is_organization_member(organization_id));
create policy "admins write card template" on public.card_templates for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create or replace function public.verify_member_card(p_token uuid)
returns table(organization_name text,member_name text,card_number text,status text,expires_at timestamptz) language sql stable security definer set search_path=public as $$
 select o.name,concat(mp.first_name,' ',mp.last_name),mc.card_number,mc.status,mc.expires_at from public.member_cards mc join public.organizations o on o.id=mc.organization_id join public.member_profiles mp on mp.id=mc.member_profile_id where mc.qr_token=p_token;
$$;
grant execute on function public.verify_member_card(uuid) to anon,authenticated;
