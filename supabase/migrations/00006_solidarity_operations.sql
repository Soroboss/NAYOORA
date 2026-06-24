-- A solidarity disbursement updates the case and cash ledger as one operation.
create or replace function public.disburse_solidarity_case(p_organization_id uuid,p_case_id uuid,p_amount numeric,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_case public.solidarity_cases; v_cash uuid; v_tx uuid; v_disbursement uuid;
begin
  if not public.can_manage_finance(p_organization_id) then raise exception 'Finance permission denied'; end if;
  if p_amount<=0 then raise exception 'Amount must be positive'; end if;
  select * into v_case from public.solidarity_cases where id=p_case_id and organization_id=p_organization_id for update;
  if not found or v_case.status not in ('open','approved') then raise exception 'Case is not disbursable'; end if;
  if v_case.approved_amount is not null and p_amount>v_case.approved_amount then raise exception 'Amount exceeds approved aid'; end if;
  select id into v_cash from public.cash_accounts where organization_id=p_organization_id and active=true order by created_at limit 1;
  insert into public.cash_transactions(organization_id,cash_account_id,direction,category,amount,notes,created_by) values(p_organization_id,v_cash,'out','solidarite',p_amount,p_notes,auth.uid()) returning id into v_tx;
  insert into public.disbursements(organization_id,beneficiary_member_id,solidarity_case_id,cash_transaction_id,amount,approved_by,notes) values(p_organization_id,v_case.member_profile_id,p_case_id,v_tx,p_amount,auth.uid(),p_notes) returning id into v_disbursement;
  update public.solidarity_cases set status='disbursed',approved_amount=coalesce(approved_amount,p_amount),resolved_at=now() where id=p_case_id;
  return v_disbursement;
end $$;
grant execute on function public.disburse_solidarity_case(uuid,uuid,numeric,text) to authenticated;
create index if not exists solidarity_cases_organization_status_idx on public.solidarity_cases(organization_id,status,requested_at desc);
