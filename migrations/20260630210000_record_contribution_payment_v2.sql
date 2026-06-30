create or replace function public.record_contribution_payment_v2(
  p_organization_id uuid,
  p_contribution_id uuid,
  p_amount numeric,
  p_provider text,
  p_provider_reference text,
  p_notes text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return public.record_contribution_payment(
    p_organization_id,
    p_contribution_id,
    p_amount,
    null::uuid,
    p_provider,
    p_provider_reference,
    p_notes
  );
end;
$$;

revoke all on function public.record_contribution_payment_v2(uuid, uuid, numeric, text, text, text) from public;
grant execute on function public.record_contribution_payment_v2(uuid, uuid, numeric, text, text, text) to authenticated;
