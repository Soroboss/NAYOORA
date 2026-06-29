-- Governance & Elections Module
create table if not exists public.elections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check(status in ('draft', 'active', 'closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.election_candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
  position text not null, -- ex: "Président", "Trésorier"
  manifesto text
);

create table if not exists public.election_votes (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  member_profile_id uuid not null references public.member_profiles(id) on delete restrict,
  candidate_id uuid references public.election_candidates(id) on delete set null, -- null = vote blanc
  voted_at timestamptz not null default now(),
  unique(election_id, member_profile_id)
);

create index if not exists idx_elections_org on public.elections(organization_id);
create index if not exists idx_election_candidates_election on public.election_candidates(election_id);
create index if not exists idx_election_votes_election on public.election_votes(election_id);

alter table public.elections enable row level security;
alter table public.election_candidates enable row level security;
alter table public.election_votes enable row level security;

-- Policies for elections
create policy "users read elections" on public.elections for select using(exists(select 1 from public.organization_members om where om.organization_id=public.elections.organization_id and om.user_id=auth.uid()));
create policy "managers write elections" on public.elections for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));

-- Policies for candidates
create policy "users read election_candidates" on public.election_candidates for select using(exists(select 1 from public.elections e join public.organization_members om on e.organization_id=om.organization_id where e.id=public.election_candidates.election_id and om.user_id=auth.uid()));
create policy "managers write election_candidates" on public.election_candidates for all using(exists(select 1 from public.elections e where e.id=public.election_candidates.election_id and public.can_manage_organization(e.organization_id))) with check(exists(select 1 from public.elections e where e.id=public.election_candidates.election_id and public.can_manage_organization(e.organization_id)));

-- Policies for votes
create policy "users read election_votes" on public.election_votes for select using(exists(select 1 from public.elections e join public.organization_members om on e.organization_id=om.organization_id where e.id=public.election_votes.election_id and om.user_id=auth.uid()));
-- Allowing actual members to vote (we will use a service role or bypass via API to protect secrecy if needed, but for now RLS insert)
create policy "members can vote" on public.election_votes for insert with check(exists(select 1 from public.elections e join public.organization_members om on e.organization_id=om.organization_id where e.id=election_id and om.user_id=auth.uid()));
