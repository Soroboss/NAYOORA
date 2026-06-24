-- Recompute overdue statuses before collection reports; paid and waived items are immutable.
create or replace function public.refresh_overdue_contributions(p_organization_id uuid)
returns integer language plpgsql security definer set search_path=public as $$ declare v_count integer; begin
 if not public.can_manage_finance(p_organization_id) then raise exception 'Finance permission denied'; end if;
 update public.contributions set status='overdue' where organization_id=p_organization_id and due_date<current_date and amount_paid<amount_due and status in('due','partially_paid'); get diagnostics v_count=row_count; return v_count; end $$;
grant execute on function public.refresh_overdue_contributions(uuid) to authenticated;
create index if not exists contributions_overdue_idx on public.contributions(organization_id,due_date) where status='overdue';
