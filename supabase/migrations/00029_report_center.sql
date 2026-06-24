create index if not exists reports_organization_type_generated_idx on public.reports(organization_id,report_type,generated_at desc);
