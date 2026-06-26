-- Ajouter logo et description à l'organisation
alter table public.organizations add column if not exists logo_url text;
alter table public.organizations add column if not exists description text;
