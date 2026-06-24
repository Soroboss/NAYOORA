-- Bootstrap the NAYOORA SaaS owner. The insert is idempotent and only applies
-- when the matching InsForge authentication account exists.
insert into public.platform_admins (user_id)
select id from auth.users
where lower(email) = lower('soroboss.bossimpact@gmail.com')
on conflict (user_id) do nothing;
