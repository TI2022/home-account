-- Enable RLS and add row-level security policies for monthly_budgets

ALTER TABLE IF EXISTS public.monthly_budgets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to SELECT only their own rows
CREATE POLICY "select_own_monthly_budgets"
  ON public.monthly_budgets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to INSERT rows where user_id matches their uid
CREATE POLICY "insert_own_monthly_budgets"
  ON public.monthly_budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to UPDATE their own rows
CREATE POLICY "update_own_monthly_budgets"
  ON public.monthly_budgets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to DELETE their own rows
CREATE POLICY "delete_own_monthly_budgets"
  ON public.monthly_budgets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Note: apply this migration in Supabase SQL editor or via the supabase CLI to make policies active.
