-- Enable RLS and add row-level security policies for budget_items
-- ポリシーがないと認証ユーザーが項目を取得できず、予算管理画面で項目が表示されない

ALTER TABLE IF EXISTS public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_budget_items"
  ON public.budget_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own_budget_items"
  ON public.budget_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_budget_items"
  ON public.budget_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_budget_items"
  ON public.budget_items FOR DELETE
  USING (auth.uid() = user_id);
