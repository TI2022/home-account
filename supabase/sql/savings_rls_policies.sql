alter table public.savings enable row level security;

create policy "Users can view their own savings"
on public.savings
for select
using (user_id = auth.uid());

create policy "Users can insert their own savings"
on public.savings
for insert
with check (user_id = auth.uid());

create policy "Users can update their own savings"
on public.savings
for update
using (user_id = auth.uid());