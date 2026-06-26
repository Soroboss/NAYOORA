create policy "Photos accessibles à tous"
on storage.objects for select
using (bucket_id = 'member-photos');

create policy "Uploads permis aux membres"
on storage.objects for insert
with check (
  bucket_id = 'member-photos' 
  and (storage.foldername(name))[1] = 'organizations'
  and auth.role() = 'authenticated'
);
