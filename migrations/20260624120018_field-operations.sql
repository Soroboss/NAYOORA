alter table public.field_actions add column if not exists status text not null default 'planned' check(status in('planned','completed','cancelled'));
create index if not exists field_actions_organization_campaign_idx on public.field_actions(organization_id,campaign_id,occurred_at desc);
