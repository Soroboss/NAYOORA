-- Loan repayments are posted atomically to avoid a loan balance diverging from cash.
create or replace function public.record_loan_repayment(
  p_organization_id uuid, p_loan_id uuid, p_principal_amount numeric, p_interest_amount numeric default 0, p_notes text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_loan public.loans; v_id uuid; v_repaid numeric; v_cash_account uuid;
begin
  if not public.can_manage_finance(p_organization_id) then raise exception 'Finance permission denied'; end if;
  if p_principal_amount < 0 or p_interest_amount < 0 or p_principal_amount+p_interest_amount <= 0 then raise exception 'Invalid repayment amount'; end if;
  select * into v_loan from public.loans where id=p_loan_id and organization_id=p_organization_id for update;
  if not found or v_loan.status not in ('disbursed','repaying') then raise exception 'Loan is not repayable'; end if;
  select coalesce(sum(principal_amount),0)+p_principal_amount into v_repaid from public.loan_repayments where loan_id=p_loan_id and status='paid';
  if v_repaid > v_loan.principal then raise exception 'Principal repayment exceeds balance'; end if;
  insert into public.loan_repayments(organization_id,loan_id,paid_at,principal_amount,interest_amount,status) values(p_organization_id,p_loan_id,now(),p_principal_amount,p_interest_amount,'paid') returning id into v_id;
  select id into v_cash_account from public.cash_accounts where organization_id=p_organization_id and active=true order by created_at limit 1;
  insert into public.cash_transactions(organization_id,cash_account_id,direction,category,amount,notes,created_by) values(p_organization_id,v_cash_account,'in','remboursement_pret',p_principal_amount+p_interest_amount,p_notes,auth.uid());
  update public.loans set status=case when v_repaid=v_loan.principal then 'settled' else 'repaying' end where id=p_loan_id;
  return v_id;
end $$;
grant execute on function public.record_loan_repayment(uuid,uuid,numeric,numeric,text) to authenticated;
create index if not exists loans_member_status_idx on public.loans(organization_id,member_profile_id,status);
