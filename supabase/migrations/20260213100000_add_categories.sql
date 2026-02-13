-- Migration: add categories table
-- Purpose: store user-defined categories (expense/income)

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null, -- 'expense' or 'income'
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name, type)
);

create or replace function public.set_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row
execute procedure public.set_updated_at_column();
