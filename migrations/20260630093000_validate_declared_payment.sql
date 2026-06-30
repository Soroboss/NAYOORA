create or replace function public.validate_declared_contribution_payment(
  p_organization_id uuid,
  p_payment_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments;
  v_contribution public.contributions;
  v_cash_account uuid;
  v_status public.contribution_status;
begin
  if not public.can_manage_finance(p_organization_id) then
    raise exception 'Droits de gestion financière requis';
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id
    and organization_id = p_organization_id
  for update;

  if not found then raise exception 'Paiement introuvable'; end if;
  if v_payment.status <> 'pending' then raise exception 'Ce paiement a déjà été traité'; end if;

  if v_payment.contribution_id is null then
    select * into v_contribution
    from public.contributions
    where organization_id = p_organization_id
      and member_profile_id = v_payment.member_profile_id
      and contribution_plan_id is not distinct from v_payment.contribution_plan_id
      and amount_paid < amount_due
      and status not in ('paid', 'waived')
    order by due_date asc
    limit 1
    for update;
  else
    select * into v_contribution
    from public.contributions
    where id = v_payment.contribution_id
      and organization_id = p_organization_id
    for update;
  end if;

  if not found then raise exception 'Échéance de cotisation introuvable'; end if;
  if v_payment.amount <= 0 then raise exception 'Le montant doit être positif'; end if;
  if v_payment.amount > (v_contribution.amount_due - v_contribution.amount_paid) then
    raise exception 'Le montant dépasse le solde restant de la cotisation';
  end if;

  v_status := case
    when v_contribution.amount_paid + v_payment.amount >= v_contribution.amount_due then 'paid'::public.contribution_status
    else 'partially_paid'::public.contribution_status
  end;

  update public.payments
  set status = 'confirmed',
      contribution_id = v_contribution.id,
      paid_at = now(),
      recorded_by = auth.uid()
  where id = v_payment.id;

  update public.contributions
  set amount_paid = amount_paid + v_payment.amount,
      status = v_status
  where id = v_contribution.id;

  select id into v_cash_account
  from public.cash_accounts
  where organization_id = p_organization_id and active = true
  order by created_at asc
  limit 1;

  insert into public.cash_transactions(
    organization_id, cash_account_id, payment_id, direction, category,
    amount, reference, notes, created_by
  ) values (
    p_organization_id, v_cash_account, v_payment.id, 'in', 'cotisation',
    v_payment.amount, v_payment.provider_reference, 'Paiement déclaré puis validé', auth.uid()
  );

  return v_payment.id;
end;
$$;

revoke all on function public.validate_declared_contribution_payment(uuid, uuid) from public;
grant execute on function public.validate_declared_contribution_payment(uuid, uuid) to authenticated;
