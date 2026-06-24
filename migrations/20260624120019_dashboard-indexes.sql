create index if not exists audit_logs_organization_created_idx on public.audit_logs(organization_id,created_at desc);
create index if not exists member_profiles_organization_status_idx on public.member_profiles(organization_id,status) where deleted_at is null;
