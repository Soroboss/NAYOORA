-- Complete commercial data model. Apply after 00001_initial_schema.sql.
-- Every business record is tenant-scoped through organization_id.

create type public.contribution_status as enum ('due','partially_paid','paid','overdue','waived');
create type public.loan_status as enum ('draft','approved','disbursed','repaying','settled','defaulted','cancelled');
create type public.case_status as enum ('open','approved','rejected','disbursed','closed');
create type public.message_channel as enum ('internal','email','sms','whatsapp');
create type public.message_status as enum ('draft','queued','sent','delivered','failed');
create type public.document_visibility as enum ('members','managers','private');
create type public.project_status as enum ('draft','active','paused','completed','cancelled');

-- Platform identity, roles and per-organization configuration.
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade, full_name text, phone text,
  locale text not null default 'fr', avatar_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organization_types (code public.organization_type primary key, label text not null, enabled_modules jsonb not null default '[]', vocabulary jsonb not null default '{}');
insert into public.organization_types(code,label) values ('mutuelle','Mutuelle'),('association','Association'),('cooperative','Coopérative'),('syndicat','Syndicat'),('ong','ONG'),('parti_politique','Parti politique') on conflict do nothing;
create table public.roles (id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id) on delete cascade, code text not null, label text not null, is_system boolean not null default false, unique nulls not distinct(organization_id,code));
create table public.permissions (code text primary key, module text not null, label text not null);
create table public.role_permissions (role_id uuid not null references public.roles(id) on delete cascade, permission_code text not null references public.permissions(code) on delete cascade, primary key(role_id,permission_code));
create table public.organization_member_roles (organization_id uuid not null references public.organizations(id) on delete cascade, organization_member_id uuid not null references public.organization_members(id) on delete cascade, role_id uuid not null references public.roles(id) on delete cascade, primary key(organization_member_id,role_id));
create table public.settings (organization_id uuid primary key references public.organizations(id) on delete cascade, timezone text not null default 'Africa/Abidjan', fiscal_year_start smallint not null default 1 check(fiscal_year_start between 1 and 12), member_number_prefix text, data jsonb not null default '{}', updated_at timestamptz not null default now());

-- Member directory and cards.
create table public.member_tags (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, color text, unique(organization_id,name));
create table public.member_profile_tags (organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id) on delete cascade, tag_id uuid not null references public.member_tags(id) on delete cascade, primary key(member_profile_id,tag_id));
create table public.member_custom_fields (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, label text not null, field_type text not null check(field_type in('text','number','date','select','boolean')), options jsonb not null default '[]', required boolean not null default false, unique(organization_id,label));
create table public.member_custom_field_values (organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id) on delete cascade, field_id uuid not null references public.member_custom_fields(id) on delete cascade, value jsonb, primary key(member_profile_id,field_id));
create table public.member_cards (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid not null unique references public.member_profiles(id) on delete cascade, card_number text not null, qr_token uuid not null default gen_random_uuid(), issued_at timestamptz not null default now(), expires_at timestamptz, status text not null default 'active' check(status in('active','blocked','expired')), unique(organization_id,card_number), unique(qr_token));

-- Contributions, payment collection and cash ledger.
create table public.contributions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id), contribution_plan_id uuid references public.contribution_plans(id), due_date date not null, amount_due numeric(14,2) not null check(amount_due>=0), amount_paid numeric(14,2) not null default 0 check(amount_paid>=0), status public.contribution_status not null default 'due', notes text, created_at timestamptz not null default now(), unique(member_profile_id,contribution_plan_id,due_date));
create table public.payment_methods (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, code text not null, label text not null, provider text, active boolean not null default true, settings jsonb not null default '{}', unique(organization_id,code));
alter table public.payments add column if not exists payment_method_id uuid references public.payment_methods(id), add column if not exists contribution_id uuid references public.contributions(id), add column if not exists recorded_by uuid references auth.users(id), add column if not exists metadata jsonb not null default '{}';
create table public.debts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id), source_type text not null, source_id uuid, amount_original numeric(14,2) not null check(amount_original>0), amount_outstanding numeric(14,2) not null check(amount_outstanding>=0), due_date date, status text not null default 'open' check(status in('open','settled','written_off')), created_at timestamptz not null default now());
create table public.cash_accounts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, account_type text not null check(account_type in('cash','bank','mobile_money')), currency char(3) not null default 'XOF', active boolean not null default true, unique(organization_id,name));
alter table public.cash_transactions add column if not exists cash_account_id uuid references public.cash_accounts(id), add column if not exists payment_id uuid references public.payments(id), add column if not exists status text not null default 'posted' check(status in('draft','posted','reversed'));

-- Loans and solidarity.
create table public.loans (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id), principal numeric(14,2) not null check(principal>0), interest_rate numeric(5,2) not null default 0 check(interest_rate>=0), duration_months smallint not null check(duration_months>0), status public.loan_status not null default 'draft', requested_at timestamptz not null default now(), approved_at timestamptz, disbursed_at timestamptz, due_at date, approved_by uuid references auth.users(id), notes text);
create table public.loan_repayments (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, loan_id uuid not null references public.loans(id) on delete cascade, payment_id uuid references public.payments(id), due_date date, paid_at timestamptz, principal_amount numeric(14,2) not null default 0 check(principal_amount>=0), interest_amount numeric(14,2) not null default 0 check(interest_amount>=0), status public.contribution_status not null default 'due');
create table public.solidarity_cases (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id), case_type text not null check(case_type in('death','illness','marriage','birth','emergency','other')), title text not null, requested_amount numeric(14,2), approved_amount numeric(14,2), status public.case_status not null default 'open', requested_at timestamptz not null default now(), resolved_at timestamptz, evidence_path text, notes text);
create table public.solidarity_contributions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, solidarity_case_id uuid not null references public.solidarity_cases(id) on delete cascade, member_profile_id uuid references public.member_profiles(id), payment_id uuid references public.payments(id), amount numeric(14,2) not null check(amount>0), contributed_at timestamptz not null default now());
create table public.disbursements (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, beneficiary_member_id uuid references public.member_profiles(id), solidarity_case_id uuid references public.solidarity_cases(id), loan_id uuid references public.loans(id), cash_transaction_id uuid references public.cash_transactions(id), amount numeric(14,2) not null check(amount>0), disbursed_at timestamptz not null default now(), approved_by uuid references auth.users(id), notes text);

-- Events, communication and content.
create table public.event_attendance (organization_id uuid not null references public.organizations(id) on delete cascade, event_id uuid not null references public.events(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id) on delete cascade, status text not null default 'invited' check(status in('invited','confirmed','attended','absent','excused')), checked_in_at timestamptz, primary key(event_id,member_profile_id));
create table public.messages (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, channel public.message_channel not null, subject text, body text not null, status public.message_status not null default 'draft', created_by uuid not null references auth.users(id), scheduled_at timestamptz, sent_at timestamptz, provider_batch_id text, created_at timestamptz not null default now());
create table public.message_recipients (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, message_id uuid not null references public.messages(id) on delete cascade, member_profile_id uuid references public.member_profiles(id), destination text not null, status public.message_status not null default 'queued', provider_reference text, delivered_at timestamptz, error_message text);
create table public.documents (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, title text not null, storage_path text not null, mime_type text, size_bytes bigint, visibility public.document_visibility not null default 'members', uploaded_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(organization_id,storage_path));
create table public.reports (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, report_type text not null, title text not null, parameters jsonb not null default '{}', storage_path text, generated_by uuid references auth.users(id), generated_at timestamptz not null default now());

-- Cooperative module.
create table public.plots (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id), name text not null, area_hectares numeric(10,2), crop_type text, location jsonb not null default '{}');
create table public.harvests (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, plot_id uuid not null references public.plots(id), harvested_at date not null, product text not null, quantity numeric(14,3) not null check(quantity>0), unit text not null, quality_grade text);
create table public.sales (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, product text not null, sold_at date not null, quantity numeric(14,3) not null check(quantity>0), unit text not null, unit_price numeric(14,2) not null check(unit_price>=0), buyer_name text, cash_transaction_id uuid references public.cash_transactions(id));
create table public.inputs (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, quantity numeric(14,3) not null check(quantity>=0), unit text, unit_cost numeric(14,2), received_at date not null default current_date, stock_alert_threshold numeric(14,3));
create table public.member_payouts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid not null references public.member_profiles(id), sales_id uuid references public.sales(id), amount numeric(14,2) not null check(amount>0), status public.payment_status not null default 'pending', paid_at timestamptz);

-- NGO module.
create table public.projects (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, code text, name text not null, description text, status public.project_status not null default 'draft', starts_at date, ends_at date, unique(organization_id,code));
create table public.project_budgets (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, category text not null, planned_amount numeric(14,2) not null check(planned_amount>=0), actual_amount numeric(14,2) not null default 0 check(actual_amount>=0), unique(project_id,category));
create table public.beneficiaries (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, project_id uuid references public.projects(id), full_name text not null, phone text, demographic_data jsonb not null default '{}', consent_at timestamptz);
create table public.donors (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, donor_type text not null check(donor_type in('individual','company','institution')), email text, phone text);
create table public.donations (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, donor_id uuid references public.donors(id), project_id uuid references public.projects(id), amount numeric(14,2) not null check(amount>0), donated_at timestamptz not null default now(), payment_id uuid references public.payments(id));
create table public.volunteers (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, member_profile_id uuid references public.member_profiles(id), full_name text not null, phone text, skills jsonb not null default '[]', status text not null default 'active');
create table public.impact_indicators (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, project_id uuid not null references public.projects(id) on delete cascade, name text not null, unit text, target_value numeric, current_value numeric not null default 0, measured_at date);

-- Union and political party modules.
create table public.sectors (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, unique(organization_id,name));
create table public.claims (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, sector_id uuid references public.sectors(id), title text not null, description text, status text not null default 'open' check(status in('open','in_progress','resolved','closed')), opened_at timestamptz not null default now(), closed_at timestamptz);
create table public.claim_updates (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, claim_id uuid not null references public.claims(id) on delete cascade, body text not null, created_by uuid references auth.users(id), created_at timestamptz not null default now());
create table public.federations (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, region text, unique(organization_id,name));
create table public.local_sections (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, federation_id uuid references public.federations(id), name text not null, locality text, unique(organization_id,name));
create table public.campaigns (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, starts_at date, ends_at date, status text not null default 'draft');
create table public.field_actions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, campaign_id uuid references public.campaigns(id), local_section_id uuid references public.local_sections(id), title text not null, occurred_at timestamptz, participants_count integer check(participants_count>=0), report text);

-- Tenant-safe access helpers. Fixed operational roles are enforced first; custom roles extend them at application/API level.
create or replace function public.can_manage_organization(target_organization_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members where organization_id=target_organization_id and user_id=auth.uid() and status='active' and role in ('organization_admin','president','secretaire','tresorier','gestionnaire'));
$$;
create or replace function public.can_manage_finance(target_organization_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.organization_members where organization_id=target_organization_id and user_id=auth.uid() and status='active' and role in ('organization_admin','president','tresorier'));
$$;

-- Replace the permissive bootstrap policies with role-aware policies.
drop policy "members access profiles" on public.member_profiles;
drop policy "members access contribution plans" on public.contribution_plans;
drop policy "members access payments" on public.payments;
drop policy "members access cash" on public.cash_transactions;
drop policy "members access events" on public.events;
drop policy "members read audit logs" on public.audit_logs;
create policy "members read profiles" on public.member_profiles for select using(public.is_organization_member(organization_id));
create policy "managers write profiles" on public.member_profiles for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create policy "members read plans" on public.contribution_plans for select using(public.is_organization_member(organization_id));
create policy "finance writes plans" on public.contribution_plans for all using(public.can_manage_finance(organization_id)) with check(public.can_manage_finance(organization_id));
create policy "members read payments" on public.payments for select using(public.is_organization_member(organization_id));
create policy "finance writes payments" on public.payments for all using(public.can_manage_finance(organization_id)) with check(public.can_manage_finance(organization_id));
create policy "members read cash" on public.cash_transactions for select using(public.is_organization_member(organization_id));
create policy "finance writes cash" on public.cash_transactions for all using(public.can_manage_finance(organization_id)) with check(public.can_manage_finance(organization_id));
create policy "members read events" on public.events for select using(public.is_organization_member(organization_id));
create policy "managers write events" on public.events for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create policy "managers read audit logs" on public.audit_logs for select using(public.can_manage_organization(organization_id));
create policy "managers update organizations" on public.organizations for update using(public.can_manage_organization(id)) with check(public.can_manage_organization(id));
create policy "managers manage memberships" on public.organization_members for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));

-- Apply member read / manager write policies to every tenant table introduced here.
do $$ declare t text; begin
  foreach t in array array['user_profiles','organization_types','roles','permissions','role_permissions','organization_member_roles','settings','member_tags','member_profile_tags','member_custom_fields','member_custom_field_values','member_cards','contributions','payment_methods','debts','cash_accounts','loans','loan_repayments','solidarity_cases','solidarity_contributions','disbursements','event_attendance','messages','message_recipients','documents','reports','plots','harvests','sales','inputs','member_payouts','projects','project_budgets','beneficiaries','donors','donations','volunteers','impact_indicators','sectors','claims','claim_updates','federations','local_sections','campaigns','field_actions'] loop
    if t not in ('user_profiles','organization_types','permissions','role_permissions') then execute format('alter table public.%I enable row level security',t); end if;
  end loop;
end $$;
-- Tables without organization_id receive narrow policies; tenant tables use the same read/write pattern.
alter table public.user_profiles enable row level security;
create policy "users manage their profile" on public.user_profiles for all using(id=auth.uid()) with check(id=auth.uid());
alter table public.organization_types enable row level security;
create policy "types are public to authenticated users" on public.organization_types for select to authenticated using(true);
alter table public.permissions enable row level security;
create policy "permissions are readable" on public.permissions for select to authenticated using(true);
alter table public.role_permissions enable row level security;
create policy "managers read role permissions" on public.role_permissions for select using(exists(select 1 from public.roles r where r.id=role_id and public.can_manage_organization(r.organization_id)));
create policy "managers write role permissions" on public.role_permissions for all using(exists(select 1 from public.roles r where r.id=role_id and public.can_manage_organization(r.organization_id))) with check(exists(select 1 from public.roles r where r.id=role_id and public.can_manage_organization(r.organization_id)));
-- Explicit policies for the common tenant access model; use backend service role for provider webhooks and system administration.
do $$ declare t text; begin
  foreach t in array array['roles','organization_member_roles','settings','member_tags','member_profile_tags','member_custom_fields','member_custom_field_values','member_cards','contributions','payment_methods','debts','cash_accounts','loans','loan_repayments','solidarity_cases','solidarity_contributions','disbursements','event_attendance','messages','message_recipients','documents','reports','plots','harvests','sales','inputs','member_payouts','projects','project_budgets','beneficiaries','donors','donations','volunteers','impact_indicators','sectors','claims','claim_updates','federations','local_sections','campaigns','field_actions'] loop
    execute format('create policy "members read %1$s" on public.%1$I for select using (public.is_organization_member(organization_id))',t);
    execute format('create policy "managers write %1$s" on public.%1$I for all using (public.can_manage_organization(organization_id)) with check (public.can_manage_organization(organization_id))',t);
  end loop;
end $$;

create index on public.contributions(organization_id,status,due_date);
create index on public.loans(organization_id,status);
create index on public.messages(organization_id,status,scheduled_at);
create index on public.audit_logs(organization_id,created_at desc);
