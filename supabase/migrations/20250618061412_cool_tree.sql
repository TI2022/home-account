/*
  # Enhanced recurring expenses with payment months

  1. Schema Changes
    - Add `payment_months` column to store specific months for payments (JSON array)
    - Add `payment_frequency` to specify if it's monthly, quarterly, yearly, etc.
    - Add `next_payment_date` for better tracking

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints

  3. Features
    - Support for specific month payments (e.g., tax payments)
    - Flexible payment frequency options
    - Better payment tracking
*/

-- Add new columns to recurring_expenses table
DO $$
BEGIN
  -- Add payment_months column (JSON array of month numbers 1-12)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses' AND column_name = 'payment_months'
  ) THEN
    ALTER TABLE recurring_expenses ADD COLUMN payment_months jsonb DEFAULT '[1,2,3,4,5,6,7,8,9,10,11,12]'::jsonb;
  END IF;

  -- Add payment_frequency column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses' AND column_name = 'payment_frequency'
  ) THEN
    ALTER TABLE recurring_expenses ADD COLUMN payment_frequency text DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'yearly', 'custom'));
  END IF;

  -- Add next_payment_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses' AND column_name = 'next_payment_date'
  ) THEN
    ALTER TABLE recurring_expenses ADD COLUMN next_payment_date date;
  END IF;

  -- Add description column for better categorization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses' AND column_name = 'description'
  ) THEN
    ALTER TABLE recurring_expenses ADD COLUMN description text;
  END IF;
END $$;