alter table public.cash_accounts
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists cash_accounts_organization_created_idx
  on public.cash_accounts(organization_id, created_at);
