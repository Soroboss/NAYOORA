-- NAYOORA: Member Cards Module

create table public.organization_card_settings (
    organization_id uuid primary key references public.organizations(id) on delete cascade,
    is_active boolean not null default false,
    auto_generate boolean not null default false,
    theme text not null default 'corporate-blue',
    primary_color text not null default '#1e40af',
    secondary_color text not null default '#3b82f6',
    text_color text not null default '#111827',
    orientation text not null default 'landscape' check(orientation in ('landscape', 'portrait')),
    corner_style text not null default 'rounded' check(corner_style in ('rounded', 'square')),
    show_qr boolean not null default true,
    show_barcode boolean not null default false,
    show_photo boolean not null default true,
    show_president_signature boolean not null default false,
    show_secretary_signature boolean not null default false,
    president_signature_url text,
    secretary_signature_url text,
    background_image_url text,
    watermark_url text,
    legal_mentions text not null default 'Cette carte demeure la propriété de l''organisation. Elle doit être présentée à toute demande. Toute perte doit être signalée immédiatement.',
    expiration_months smallint not null default 12,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.organization_card_settings enable row level security;

create policy "Admins can manage their organization card settings"
on public.organization_card_settings
for all
to authenticated
using (
  exists (
    select 1 from public.organization_members om
    join public.organization_member_roles omr on om.id = omr.organization_member_id
    join public.roles r on omr.role_id = r.id
    where om.organization_id = organization_card_settings.organization_id
    and om.user_id = auth.uid()
    and r.code = 'admin'
  )
)
with check (
  exists (
    select 1 from public.organization_members om
    join public.organization_member_roles omr on om.id = omr.organization_member_id
    join public.roles r on omr.role_id = r.id
    where om.organization_id = organization_card_settings.organization_id
    and om.user_id = auth.uid()
    and r.code = 'admin'
  )
);

create policy "Public can read active organization card settings for verification"
on public.organization_card_settings
for select
using (is_active = true);


-- Update member_cards
alter table public.member_cards add column front_image_url text;
alter table public.member_cards add column back_image_url text;
alter table public.member_cards add column pdf_url text;
alter table public.member_cards add column theme_snapshot jsonb not null default '{}'::jsonb;
alter table public.member_cards add column version integer not null default 1;


-- RLS for member_cards
create policy "Members can read their own cards"
on public.member_cards
for select
using (
  member_profile_id in (
    select m.id from public.member_profiles m
    join public.organization_members om on m.organization_id = om.organization_id
    where om.user_id = auth.uid()
  )
);

create policy "Public can read cards for QR verification"
on public.member_cards
for select
using (status != 'deleted');


