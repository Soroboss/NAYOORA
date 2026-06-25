-- NAYOORA security hardening
-- Locks SECURITY DEFINER function search paths and removes implicit PUBLIC
-- execution grants. RPC functions that are intentionally called by the app keep
-- explicit role grants only.

alter function public.is_platform_admin() set search_path = public, pg_temp;
revoke execute on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

alter function public.is_organization_member(uuid) set search_path = public, pg_temp;
revoke execute on function public.is_organization_member(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;

alter function public.can_manage_organization(uuid) set search_path = public, pg_temp;
revoke execute on function public.can_manage_organization(uuid) from public;
grant execute on function public.can_manage_organization(uuid) to authenticated;

alter function public.can_manage_finance(uuid) set search_path = public, pg_temp;
revoke execute on function public.can_manage_finance(uuid) from public;
grant execute on function public.can_manage_finance(uuid) to authenticated;

alter function public.accept_organization_invite(uuid) set search_path = public, pg_temp;
revoke execute on function public.accept_organization_invite(uuid) from public;
grant execute on function public.accept_organization_invite(uuid) to authenticated;

alter function public.record_contribution_payment(uuid, uuid, numeric, uuid, text, text, text) set search_path = public, pg_temp;
revoke execute on function public.record_contribution_payment(uuid, uuid, numeric, uuid, text, text, text) from public;
grant execute on function public.record_contribution_payment(uuid, uuid, numeric, uuid, text, text, text) to authenticated;

alter function public.record_loan_repayment(uuid, uuid, numeric, numeric, text) set search_path = public, pg_temp;
revoke execute on function public.record_loan_repayment(uuid, uuid, numeric, numeric, text) from public;
grant execute on function public.record_loan_repayment(uuid, uuid, numeric, numeric, text) to authenticated;

alter function public.disburse_solidarity_case(uuid, uuid, numeric, text) set search_path = public, pg_temp;
revoke execute on function public.disburse_solidarity_case(uuid, uuid, numeric, text) from public;
grant execute on function public.disburse_solidarity_case(uuid, uuid, numeric, text) to authenticated;

alter function public.audit_row_change() set search_path = public, pg_temp;
revoke execute on function public.audit_row_change() from public;

alter function public.refresh_overdue_contributions(uuid) set search_path = public, pg_temp;
revoke execute on function public.refresh_overdue_contributions(uuid) from public;
grant execute on function public.refresh_overdue_contributions(uuid) to authenticated;

alter function public.record_cooperative_sale(uuid, text, numeric, text, numeric, text) set search_path = public, pg_temp;
revoke execute on function public.record_cooperative_sale(uuid, text, numeric, text, numeric, text) from public;
grant execute on function public.record_cooperative_sale(uuid, text, numeric, text, numeric, text) to authenticated;

alter function public.record_member_payout(uuid, uuid, numeric, uuid) set search_path = public, pg_temp;
revoke execute on function public.record_member_payout(uuid, uuid, numeric, uuid) from public;
grant execute on function public.record_member_payout(uuid, uuid, numeric, uuid) to authenticated;

alter function public.verify_member_card(uuid) set search_path = public, pg_temp;
revoke execute on function public.verify_member_card(uuid) from public;
grant execute on function public.verify_member_card(uuid) to anon, authenticated;

drop policy if exists "webhook events are server only" on public.payment_webhook_events;
create policy "webhook events are server only"
  on public.payment_webhook_events
  for all
  to anon, authenticated
  using (false)
  with check (false);
