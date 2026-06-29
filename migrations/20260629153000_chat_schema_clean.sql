create table public.chat_conversations (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table public.chat_conversation_participants (
    conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
    organization_id uuid not null references public.organizations(id) on delete cascade,
    member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (conversation_id, member_profile_id)
);

create table public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
    sender_id uuid not null references public.member_profiles(id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now()
);

alter table public.chat_conversations enable row level security;
alter table public.chat_conversation_participants enable row level security;
alter table public.chat_messages enable row level security;

create policy "members read chat_conversations" on public.chat_conversations for select using (public.is_organization_member(organization_id));
create policy "members write chat_conversations" on public.chat_conversations for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));

create policy "members read chat_conversation_participants" on public.chat_conversation_participants for select using (public.is_organization_member(organization_id));
create policy "members write chat_conversation_participants" on public.chat_conversation_participants for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));

create policy "members read chat_messages" on public.chat_messages for select using (public.is_organization_member(organization_id));
create policy "members write chat_messages" on public.chat_messages for all using (public.is_organization_member(organization_id)) with check (public.is_organization_member(organization_id));
