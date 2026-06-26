-- Create an RPC to safely look up member profiles by phone number
-- SECURITY DEFINER bypasses RLS so unauthenticated users can look up their profiles to log in
CREATE OR REPLACE FUNCTION public.find_member_profiles_by_phone(phone_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', m.id,
      'organization_id', m.organization_id,
      'status', m.status,
      'organizations', json_build_object(
        'name', o.name,
        'organization_type', o.organization_type
      )
    )
  ) INTO result
  FROM public.member_profiles m
  JOIN public.organizations o ON m.organization_id = o.id
  WHERE m.phone = phone_number
    AND m.deleted_at IS NULL
    AND m.status = 'active';

  RETURN COALESCE(result, '[]'::json);
END;
$$;
