-- Add contribution_plan_id to disbursements for plan payouts
alter table public.disbursements 
add column if not exists contribution_plan_id uuid references public.contribution_plans(id);

-- Add notes to contribution_plans to insert other informations
alter table public.contribution_plans
add column if not exists notes text;

