CREATE OR REPLACE FUNCTION public.get_member_pin_hash(member_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pin_hash FROM public.member_profiles WHERE id = member_id;
$$;

CREATE OR REPLACE FUNCTION public.update_member_pin_hash(target_member_id uuid, new_pin_hash text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.member_profiles SET pin_hash = new_pin_hash WHERE id = target_member_id;
$$;
