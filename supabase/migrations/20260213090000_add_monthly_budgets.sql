-- Migration: add monthly_budgets table
-- Purpose: store per-user, per-item, per-month maximum allowed amount

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  year integer not null,
  month integer not null,
  max_amount numeric(12,2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, item_key, year, month)
);

-- trigger to keep updated_at current
create or replace function public.set_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_monthly_budgets_updated_at on public.monthly_budgets;
create trigger trg_monthly_budgets_updated_at
before update on public.monthly_budgets
for each row
execute procedure public.set_updated_at_column();
