-- Fix the find_member_profiles_by_phone RPC to handle phone numbers with or without country codes
CREATE OR REPLACE FUNCTION public.find_member_profiles_by_phone(phone_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  normalized_input text;
BEGIN
  -- Garder uniquement les chiffres
  normalized_input := regexp_replace(phone_number, '\D', '', 'g');
  
  -- Si vide ou trop court (ex: moins de 6 chiffres, pour éviter les faux positifs), on arrête
  IF length(normalized_input) < 6 THEN
    RETURN '[]'::json;
  END IF;

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
  WHERE m.deleted_at IS NULL
    AND m.status = 'active'
    AND m.phone IS NOT NULL
    AND (
      -- Exactement identiques après nettoyage
      regexp_replace(m.phone, '\D', '', 'g') = normalized_input
      OR
      -- Ou les 8 derniers chiffres sont identiques (gère le +225 vs local)
      (
        length(regexp_replace(m.phone, '\D', '', 'g')) >= 8 
        AND length(normalized_input) >= 8 
        AND RIGHT(regexp_replace(m.phone, '\D', '', 'g'), 8) = RIGHT(normalized_input, 8)
      )
    );

  RETURN COALESCE(result, '[]'::json);
END;
$$;
