-- Automations Module
create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_type text not null, -- ex: 'contribution_reminder', 'tontine_reminder', 'birthday_message'
  is_active boolean not null default false,
  days_before_due integer default 0,
  message_template text,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  unique(organization_id, rule_type)
);

create index if not exists idx_automation_rules_org on public.automation_rules(organization_id);

alter table public.automation_rules enable row level security;

-- Policies
create policy "users read automation_rules" on public.automation_rules for select using(exists(select 1 from public.organization_members om where om.organization_id=public.automation_rules.organization_id and om.user_id=auth.uid()));
create policy "managers write automation_rules" on public.automation_rules for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));

-- Add trigger to insert default rules for new organizations (or we can just upsert them in the application)
