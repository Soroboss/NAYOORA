alter table public.payments add column proof_url text;
alter table public.payments add column rejection_reason text;

insert into storage.buckets (id, name, public) 
values ('payment_proofs', 'payment_proofs', true)
on conflict (id) do nothing;

create policy "Members can upload their own proofs"
on storage.objects for insert
with check (
    bucket_id = 'payment_proofs' 
    and auth.role() = 'authenticated'
);

create policy "Anyone can view proofs"
on storage.objects for select
using (bucket_id = 'payment_proofs');
