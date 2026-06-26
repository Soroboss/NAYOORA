create or replace function public.verify_member_card(p_token uuid)
returns table(organization_name text, member_name text, photo_url text, card_number text, status text, expires_at timestamptz) language sql stable security definer set search_path=public as $$
 select o.name, concat(mp.first_name,' ',mp.last_name), mp.photo_url, mc.card_number, mc.status, mc.expires_at 
 from public.member_cards mc 
 join public.organizations o on o.id=mc.organization_id 
 join public.member_profiles mp on mp.id=mc.member_profile_id 
 where mc.qr_token=p_token;
$$;
