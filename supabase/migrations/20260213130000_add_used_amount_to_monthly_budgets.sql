-- Add used_amount column to monthly_budgets to allow manual recording of usage per item

ALTER TABLE public.monthly_budgets
  ADD COLUMN IF NOT EXISTS used_amount numeric(12,2) NOT NULL DEFAULT 0;

-- Note: run this in Supabase SQL editor or via supabase CLI to apply to your database.
