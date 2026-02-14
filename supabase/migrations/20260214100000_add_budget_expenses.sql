-- Budget expenses: per-budget spending entries (what + amount)
-- used_amount on monthly_budgets will be recalculated from sum of these

create table if not exists public.budget_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null references public.monthly_budgets(id) on delete cascade,
  memo text not null default '',
  amount numeric(12,2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_budget_expenses_budget_id on public.budget_expenses(budget_id);
create index if not exists idx_budget_expenses_user_id on public.budget_expenses(user_id);

drop trigger if exists trg_budget_expenses_updated_at on public.budget_expenses;
create trigger trg_budget_expenses_updated_at
before update on public.budget_expenses
for each row
execute procedure public.set_updated_at_column();

-- RLS
alter table public.budget_expenses enable row level security;

create policy "select_own_budget_expenses"
  on public.budget_expenses for select
  using (auth.uid() = user_id);

create policy "insert_own_budget_expenses"
  on public.budget_expenses for insert
  with check (auth.uid() = user_id);

create policy "update_own_budget_expenses"
  on public.budget_expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete_own_budget_expenses"
  on public.budget_expenses for delete
  using (auth.uid() = user_id);
