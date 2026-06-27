-- Ajout des colonnes pour le système de génération de cartes asynchrone
ALTER TABLE public.member_cards
ADD COLUMN IF NOT EXISTS generation_status text default 'pending' check(generation_status in ('pending', 'generating', 'generated', 'failed')),
ADD COLUMN IF NOT EXISTS qr_code_url text,
ADD COLUMN IF NOT EXISTS error_log jsonb;
