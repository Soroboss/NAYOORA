alter table public.saas_invoices
  add column if not exists plan_id uuid references public.saas_plans(id) on delete set null;

update public.saas_invoices invoice
set plan_id = subscription.plan_id
from public.saas_subscriptions subscription
where invoice.subscription_id = subscription.id
  and invoice.plan_id is null;

create index if not exists saas_invoices_plan_id_idx on public.saas_invoices(plan_id);
