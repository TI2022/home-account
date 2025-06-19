/*
  # 定期収入テーブルの作成

  1. New Tables
    - `recurring_income`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, 収入名)
      - `amount` (integer, 金額)
      - `category` (text, カテゴリ)
      - `day_of_month` (integer, 毎月の支払日)
      - `is_active` (boolean, 有効/無効)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `recurring_income` table
    - Add policies for authenticated users to manage their own recurring income
*/

CREATE TABLE IF NOT EXISTS public.recurring_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  amount integer NOT NULL,
  category text NOT NULL,
  day_of_month integer NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.recurring_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recurring income"
  ON public.recurring_income FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring income"
  ON public.recurring_income FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring income"
  ON public.recurring_income FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring income"
  ON public.recurring_income FOR DELETE
  USING (auth.uid() = user_id);