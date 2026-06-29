-- Migration: Chat system
create table public.chat_conversations (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table public.chat_conversation_participants (
    conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
    member_profile_id uuid not null references public.member_profiles(id) on delete cascade,
    joined_at timestamptz not null default now(),
    primary key (conversation_id, member_profile_id)
);

create table public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
    sender_id uuid not null references public.member_profiles(id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now()
);

-- RLS policies
alter table public.chat_conversations enable row level security;
alter table public.chat_conversation_participants enable row level security;
alter table public.chat_messages enable row level security;

-- Policies for conversations
create policy "Members can view their conversations"
    on public.chat_conversations for select
    using (
        exists (
            select 1 from public.chat_conversation_participants
            where conversation_id = id
            and member_profile_id in (
                select id from public.member_profiles where user_id = auth.uid()
            )
        )
    );

create policy "Members can create conversations"
    on public.chat_conversations for insert
    with check (
        organization_id in (
            select organization_id from public.member_profiles where user_id = auth.uid()
        )
    );

-- Policies for participants
create policy "Members can view participants of their conversations"
    on public.chat_conversation_participants for select
    using (
        conversation_id in (
            select conversation_id from public.chat_conversation_participants
            where member_profile_id in (
                select id from public.member_profiles where user_id = auth.uid()
            )
        )
    );

create policy "Members can add participants to conversations"
    on public.chat_conversation_participants for insert
    with check (
        member_profile_id in (
            select id from public.member_profiles where user_id = auth.uid()
        )
        OR
        conversation_id in (
            select conversation_id from public.chat_conversation_participants
            where member_profile_id in (
                select id from public.member_profiles where user_id = auth.uid()
            )
        )
    );

-- Policies for messages
create policy "Members can view messages in their conversations"
    on public.chat_messages for select
    using (
        conversation_id in (
            select conversation_id from public.chat_conversation_participants
            where member_profile_id in (
                select id from public.member_profiles where user_id = auth.uid()
            )
        )
    );

create policy "Members can insert messages in their conversations"
    on public.chat_messages for insert
    with check (
        sender_id in (
            select id from public.member_profiles where user_id = auth.uid()
        )
        and
        conversation_id in (
            select conversation_id from public.chat_conversation_participants
            where member_profile_id = sender_id
        )
    );

-- Enable Realtime for chat_messages (to be done via UI or separate config)

