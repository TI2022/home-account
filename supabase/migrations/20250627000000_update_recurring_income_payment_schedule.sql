/*
  # Update recurring_income table to use payment_schedule structure

  1. Changes
    - Remove `day_of_month` column
    - Add `payment_frequency` column (monthly, quarterly, yearly, custom)
    - Add `payment_schedule` column (JSON array of {month: number, day: number})
    - Add `next_payment_date` column (optional)
    - Add `description` column (optional)
*/

-- Add new columns
ALTER TABLE public.recurring_income
ADD COLUMN IF NOT EXISTS payment_frequency text DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'yearly', 'custom')),
ADD COLUMN IF NOT EXISTS payment_schedule jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS next_payment_date date,
ADD COLUMN IF NOT EXISTS description text;

-- Migrate existing day_of_month data to payment_schedule
UPDATE public.recurring_income
SET payment_schedule = jsonb_build_array(
  jsonb_build_object('month', 1, 'day', day_of_month)
)
WHERE day_of_month IS NOT NULL;

-- Remove old column
ALTER TABLE public.recurring_income
DROP COLUMN IF EXISTS day_of_month; 