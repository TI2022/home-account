-- Copy monthly budget settings: add missing rows only
-- Purpose:
-- - Copy (item_key, max_amount) from a source month to a target month
-- - Only inserts rows that do not exist in the target month yet
-- - Always sets used_amount = 0 for inserted rows
-- - Never updates existing target rows (safe / non-destructive)

create or replace function public.copy_budget_settings_add_missing(
  from_year int,
  from_month int,
  to_year int,
  to_month int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count int := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if from_year = to_year and from_month = to_month then
    return 0;
  end if;

  insert into public.monthly_budgets (user_id, item_key, year, month, max_amount, used_amount)
  select
    auth.uid(),
    src.item_key,
    to_year,
    to_month,
    src.max_amount,
    0
  from public.monthly_budgets as src
  where src.user_id = auth.uid()
    and src.year = from_year
    and src.month = from_month
    and not exists (
      select 1
      from public.monthly_budgets as dst
      where dst.user_id = auth.uid()
        and dst.item_key = src.item_key
        and dst.year = to_year
        and dst.month = to_month
    );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.copy_budget_settings_add_missing(int, int, int, int) from public;
grant execute on function public.copy_budget_settings_add_missing(int, int, int, int) to authenticated;

