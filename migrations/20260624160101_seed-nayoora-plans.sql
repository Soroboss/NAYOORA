insert into public.saas_plans (code, name, price_xof, member_limit, features)
values
  ('essentiel', 'Essentiel', 0, 100, '["members","collections","messages"]'::jsonb),
  ('pilotage', 'Pilotage', 15000, 500, '["members","collections","finance","events","messages","reports"]'::jsonb),
  ('complet', 'Complet', 35000, null, '["members","collections","finance","events","messages","reports","documents","governance","automations","mobile_money"]'::jsonb)
on conflict (code) do update set name = excluded.name, price_xof = excluded.price_xof, member_limit = excluded.member_limit, features = excluded.features;
