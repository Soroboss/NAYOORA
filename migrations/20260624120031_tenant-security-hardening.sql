-- Tenant hardening. organization_id is the canonical tenant identifier in NAYOORA.
-- Explicit global exceptions: auth.users, user_profiles, permissions, saas_plans and platform_admins.

create table public.organization_role_permissions (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_code text not null references public.permissions(code) on delete cascade,
  primary key (organization_id,role_id,permission_code)
);
alter table public.organization_role_permissions enable row level security;
create policy "admins manage organization permissions" on public.organization_role_permissions for all
  using (public.can_manage_organization(organization_id)) with check (public.can_manage_organization(organization_id));

-- RLS is enforced on every tenant-owned table, including tables added by later modules.
do $$ declare table_name text; begin
  for table_name in select distinct table_name from information_schema.columns where table_schema='public' and column_name='organization_id' loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

-- Every tenant table gets a tenant index. Existing composite indexes remain useful for specialized queries.
do $$ declare rec record; index_name text; begin
  for rec in select distinct table_name from information_schema.columns where table_schema='public' and column_name='organization_id' loop
    index_name := left('idx_' || rec.table_name || '_organization_id', 60);
    if not exists(select 1 from pg_indexes where schemaname='public' and indexname=index_name) then
      execute format('create index %I on public.%I (organization_id)', index_name, rec.table_name);
    end if;
  end loop;
end $$;

-- Cross-tenant foreign-key guard: a child record cannot reference an entity from another organization.
create or replace function public.assert_same_organization() returns trigger language plpgsql security definer set search_path=public as $$
declare foreign_id uuid; valid_reference boolean; begin
  foreign_id := nullif(to_jsonb(new)->>tg_argv[1],'')::uuid;
  if foreign_id is null then return new; end if;
  execute format('select exists(select 1 from public.%I where id=$1 and organization_id=$2)', tg_argv[0]) into valid_reference using foreign_id, new.organization_id;
  if not valid_reference then raise exception 'Cross-tenant reference blocked for %.%', tg_table_name, tg_argv[1]; end if;
  return new;
end $$;

do $$ declare spec text; parts text[]; trigger_name text; begin
  foreach spec in array array[
    'contributions:member_profiles:member_profile_id','contributions:contribution_plans:contribution_plan_id',
    'payments:member_profiles:member_profile_id','payments:contributions:contribution_id','payments:contribution_plans:contribution_plan_id',
    'loans:member_profiles:member_profile_id','loan_repayments:loans:loan_id','solidarity_cases:member_profiles:member_profile_id',
    'solidarity_contributions:solidarity_cases:solidarity_case_id','events:organizations:organization_id',
    'event_attendance:events:event_id','event_attendance:member_profiles:member_profile_id',
    'member_cards:member_profiles:member_profile_id','cash_transactions:cash_accounts:cash_account_id',
    'projects:organizations:organization_id','beneficiaries:projects:project_id','donations:donors:donor_id',
    'plots:member_profiles:member_profile_id','harvests:plots:plot_id','member_payouts:member_profiles:member_profile_id',
    'local_sections:federations:federation_id','field_actions:campaigns:campaign_id','field_actions:local_sections:local_section_id'
  ] loop
    parts := string_to_array(spec,':'); trigger_name := left('tenant_guard_' || parts[1] || '_' || parts[3], 60);
    if not exists(select 1 from pg_trigger where tgname=trigger_name) then
      execute format('create trigger %I before insert or update on public.%I for each row execute function public.assert_same_organization(%L,%L)',trigger_name,parts[1],parts[2],parts[3]);
    end if;
  end loop;
end $$;

-- Comprehensive immutable audit coverage for material tenant records.
do $$ declare table_name text; trigger_name text; begin
  foreach table_name in array array['organization_members','member_profiles','contributions','payments','cash_transactions','loans','loan_repayments','solidarity_cases','events','messages','documents','reports'] loop
    trigger_name := left('audit_' || table_name, 60);
    if not exists(select 1 from pg_trigger where tgname=trigger_name) then
      execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row_change()', trigger_name, table_name);
    end if;
  end loop;
end $$;
