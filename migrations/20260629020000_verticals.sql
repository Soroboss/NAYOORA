-- RLS Policies for Cooperative tables
alter table public.plots enable row level security;
alter table public.harvests enable row level security;
alter table public.sales enable row level security;
alter table public.inputs enable row level security;

create policy "users read plots" on public.plots for select using(exists(select 1 from public.organization_members om where om.organization_id=public.plots.organization_id and om.user_id=auth.uid()));
create policy "users read harvests" on public.harvests for select using(exists(select 1 from public.organization_members om where om.organization_id=public.harvests.organization_id and om.user_id=auth.uid()));
create policy "users read sales" on public.sales for select using(exists(select 1 from public.organization_members om where om.organization_id=public.sales.organization_id and om.user_id=auth.uid()));
create policy "users read inputs" on public.inputs for select using(exists(select 1 from public.organization_members om where om.organization_id=public.inputs.organization_id and om.user_id=auth.uid()));

create policy "managers write coop" on public.plots for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create policy "managers write harvests" on public.harvests for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create policy "managers write sales" on public.sales for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create policy "managers write inputs" on public.inputs for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));

-- RLS Policies for Political tables
alter table public.federations enable row level security;
alter table public.local_sections enable row level security;
alter table public.campaigns enable row level security;
alter table public.field_actions enable row level security;

create policy "users read federations" on public.federations for select using(exists(select 1 from public.organization_members om where om.organization_id=public.federations.organization_id and om.user_id=auth.uid()));
create policy "users read local_sections" on public.local_sections for select using(exists(select 1 from public.organization_members om where om.organization_id=public.local_sections.organization_id and om.user_id=auth.uid()));
create policy "users read campaigns" on public.campaigns for select using(exists(select 1 from public.organization_members om where om.organization_id=public.campaigns.organization_id and om.user_id=auth.uid()));
create policy "users read field_actions" on public.field_actions for select using(exists(select 1 from public.organization_members om where om.organization_id=public.field_actions.organization_id and om.user_id=auth.uid()));

create policy "managers write politics" on public.federations for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create policy "managers write local_sections" on public.local_sections for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create policy "managers write campaigns" on public.campaigns for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
create policy "managers write field_actions" on public.field_actions for all using(public.can_manage_organization(organization_id)) with check(public.can_manage_organization(organization_id));
