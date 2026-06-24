-- Atomic payment recording: payment, contribution balance and cash ledger must move together.
create or replace function public.record_contribution_payment(
  p_organization_id uuid, p_contribution_id uuid, p_amount numeric, p_payment_method_id uuid default null,
  p_provider text default null, p_provider_reference text default null, p_notes text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_contribution public.contributions; v_payment_id uuid; v_cash_account uuid; v_status public.contribution_status;
begin
  if not public.can_manage_finance(p_organization_id) then raise exception 'Finance permission denied'; end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  select * into v_contribution from public.contributions where id=p_contribution_id and organization_id=p_organization_id for update;
  if not found then raise exception 'Contribution not found'; end if;
  if p_amount > (v_contribution.amount_due-v_contribution.amount_paid) then raise exception 'Amount exceeds outstanding balance'; end if;
  select id into v_cash_account from public.cash_accounts where organization_id=p_organization_id and active=true order by created_at limit 1;
  v_status := case when v_contribution.amount_paid+p_amount >= v_contribution.amount_due then 'paid' else 'partially_paid' end;
  insert into public.payments(organization_id,member_profile_id,contribution_plan_id,contribution_id,payment_method_id,amount,currency,status,provider,provider_reference,paid_at,recorded_by,metadata)
  values(p_organization_id,v_contribution.member_profile_id,v_contribution.contribution_plan_id,p_contribution_id,p_payment_method_id,p_amount,'XOF','confirmed',p_provider,p_provider_reference,now(),auth.uid(),jsonb_build_object('notes',p_notes)) returning id into v_payment_id;
  update public.contributions set amount_paid=amount_paid+p_amount,status=v_status where id=p_contribution_id;
  insert into public.cash_transactions(organization_id,cash_account_id,payment_id,direction,category,amount,reference,notes,created_by)
  values(p_organization_id,v_cash_account,v_payment_id,'in','cotisation',p_amount,p_provider_reference,p_notes,auth.uid());
  return v_payment_id;
end $$;

grant execute on function public.record_contribution_payment(uuid,uuid,numeric,uuid,text,text,text) to authenticated;
create index if not exists contributions_member_due_idx on public.contributions(organization_id,member_profile_id,due_date desc);
