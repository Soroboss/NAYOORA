alter table public.member_payouts add column if not exists cash_transaction_id uuid references public.cash_transactions(id);
create or replace function public.record_member_payout(p_organization_id uuid,p_member_id uuid,p_amount numeric,p_sales_id uuid default null)
returns uuid language plpgsql security definer set search_path=public as $$ declare v_cash uuid;v_tx uuid;v_payout uuid;begin
 if not public.can_manage_finance(p_organization_id) then raise exception 'Finance permission denied';end if;if p_amount<=0 then raise exception 'Amount must be positive';end if;
 select id into v_cash from public.cash_accounts where organization_id=p_organization_id and active=true order by created_at limit 1;
 insert into public.cash_transactions(organization_id,cash_account_id,direction,category,amount,notes,created_by) values(p_organization_id,v_cash,'out','paiement_producteur',p_amount,'Paiement producteur',auth.uid()) returning id into v_tx;
 insert into public.member_payouts(organization_id,member_profile_id,sales_id,amount,status,paid_at,cash_transaction_id) values(p_organization_id,p_member_id,p_sales_id,p_amount,'confirmed',now(),v_tx) returning id into v_payout;return v_payout;end $$;
grant execute on function public.record_member_payout(uuid,uuid,numeric,uuid) to authenticated;
create index if not exists inputs_organization_received_idx on public.inputs(organization_id,received_at desc);
