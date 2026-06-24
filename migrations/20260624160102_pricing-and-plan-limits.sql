alter table public.saas_plans add column if not exists admin_limit integer;

insert into public.saas_plans (code, name, price_xof, member_limit, admin_limit, features, active)
values
  ('free', 'Gratuit', 0, 15, 3, '["members","collections","messages"]'::jsonb, true),
  ('standard', 'Croissance', 6500, 50, 5, '["members","collections","finance","events","messages","reports"]'::jsonb, true),
  ('unlimited', 'Illimitée', 12700, null, null, '["members","collections","finance","events","messages","reports","documents","governance","automations","mobile_money"]'::jsonb, true)
on conflict (code) do update set name = excluded.name, price_xof = excluded.price_xof, member_limit = excluded.member_limit, admin_limit = excluded.admin_limit, features = excluded.features, active = true;

create policy "authenticated users read active plans" on public.saas_plans for select to authenticated using (active = true);
create policy "organization creators select their subscription" on public.saas_subscriptions for insert to authenticated
with check (exists (select 1 from public.organizations o where o.id = organization_id and o.created_by = auth.uid()));
create policy "members read own subscription" on public.saas_subscriptions for select to authenticated
using (public.is_organization_member(organization_id));
