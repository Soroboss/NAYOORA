-- Performance indexes for NGO project operations.
create index if not exists projects_organization_status_idx on public.projects(organization_id,status,starts_at desc);
create index if not exists beneficiaries_organization_project_idx on public.beneficiaries(organization_id,project_id);
create index if not exists donors_organization_idx on public.donors(organization_id,name);
