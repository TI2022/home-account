/*
  # Create recurring expenses table

  1. New Tables
    - `recurring_expenses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, expense name)
      - `amount` (integer, amount in cents/yen)
      - `category` (text, expense category)
      - `day_of_month` (integer, day of month for payment)
      - `is_active` (boolean, whether expense is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `recurring_expenses` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  amount integer NOT NULL,
  category text NOT NULL,
  day_of_month integer NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring expenses"
  ON recurring_expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring expenses"
  ON recurring_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses"
  ON recurring_expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses"
  ON recurring_expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);