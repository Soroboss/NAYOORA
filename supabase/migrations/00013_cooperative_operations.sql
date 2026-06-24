create index if not exists plots_organization_member_idx on public.plots(organization_id,member_profile_id);
create index if not exists harvests_organization_date_idx on public.harvests(organization_id,harvested_at desc);
create index if not exists sales_organization_date_idx on public.sales(organization_id,sold_at desc);
create or replace function public.record_cooperative_sale(p_organization_id uuid,p_product text,p_quantity numeric,p_unit text,p_unit_price numeric,p_buyer text default null)
returns uuid language plpgsql security definer set search_path=public as $$ declare v_sale uuid;v_tx uuid;v_cash uuid;begin
 if not public.can_manage_finance(p_organization_id) then raise exception 'Finance permission denied';end if;if p_quantity<=0 or p_unit_price<0 then raise exception 'Invalid sale values';end if;
 select id into v_cash from public.cash_accounts where organization_id=p_organization_id and active=true order by created_at limit 1;
 insert into public.cash_transactions(organization_id,cash_account_id,direction,category,amount,notes,created_by) values(p_organization_id,v_cash,'in','vente_cooperative',p_quantity*p_unit_price,p_buyer,auth.uid()) returning id into v_tx;
 insert into public.sales(organization_id,product,sold_at,quantity,unit,unit_price,buyer_name,cash_transaction_id) values(p_organization_id,p_product,current_date,p_quantity,p_unit,p_unit_price,p_buyer,v_tx) returning id into v_sale;return v_sale;end $$;
grant execute on function public.record_cooperative_sale(uuid,text,numeric,text,numeric,text) to authenticated;
