-- Create budget_items table for user-defined budget items independent from transaction categories

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

-- trigger to keep updated_at current (reuse existing function if present)
create or replace function public.set_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_budget_items_updated_at on public.budget_items;
create trigger trg_budget_items_updated_at
before update on public.budget_items
for each row
execute procedure public.set_updated_at_column();

-- Note: run this in Supabase SQL editor or via supabase CLI to apply to your database.
