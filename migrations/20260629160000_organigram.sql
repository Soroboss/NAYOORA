alter table public.member_profiles add column title text;
alter table public.member_profiles add column reports_to uuid references public.member_profiles(id) on delete set null;
