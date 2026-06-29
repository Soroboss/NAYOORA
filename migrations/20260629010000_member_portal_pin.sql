-- Migration pour le portail membre
alter table public.member_profiles add column if not exists pin_hash text;
