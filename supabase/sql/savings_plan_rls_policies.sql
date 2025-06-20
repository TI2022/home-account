-- RLS（Row Level Security）を有効化
alter table public.savings_plan enable row level security;

-- SELECT（取得）用ポリシー
create policy "Users can view their own savings_plan"
on public.savings_plan
for select
using (user_id = auth.uid());

-- INSERT（追加）用ポリシー
create policy "Users can insert their own savings_plan"
on public.savings_plan
for insert
with check (user_id = auth.uid());

-- UPDATE（編集）用ポリシー
create policy "Users can update their own savings_plan"
on public.savings_plan
for update
using (user_id = auth.uid());