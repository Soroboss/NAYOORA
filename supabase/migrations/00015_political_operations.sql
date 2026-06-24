create index if not exists federations_organization_region_idx on public.federations(organization_id,region);
create index if not exists local_sections_organization_federation_idx on public.local_sections(organization_id,federation_id);
create index if not exists campaigns_organization_status_idx on public.campaigns(organization_id,status,starts_at desc);
