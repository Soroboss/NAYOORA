GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA storage TO postgres, anon, authenticated, service_role;

-- Assurons-nous que le bucket existe. S'il n'existe pas, l'insérer.
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do update set public = true;

-- Droits
drop policy if exists "Photos accessibles à tous" on storage.objects;
create policy "Photos accessibles à tous"
on storage.objects for select
using (bucket_id = 'member-photos');

drop policy if exists "Uploads permis aux membres" on storage.objects;
create policy "Uploads permis aux membres"
on storage.objects for insert
with check (
  bucket_id = 'member-photos' 
  and (storage.foldername(name))[1] = 'organizations'
  and auth.role() = 'authenticated'
);
