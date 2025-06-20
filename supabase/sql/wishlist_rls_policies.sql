-- RLS有効化
alter table public.wishlist enable row level security;

-- SELECT（取得）用
create policy "Users can view their own wishlist"
on public.wishlist
for select
using (user_id = auth.uid());

-- INSERT（追加）用
create policy "Users can insert their own wishlist"
on public.wishlist
for insert
with check (user_id = auth.uid());

-- UPDATE（編集）用
create policy "Users can update their own wishlist"
on public.wishlist
for update
using (user_id = auth.uid());

-- DELETE（削除）用
create policy "Users can delete their own wishlist"
on public.wishlist
for delete
using (user_id = auth.uid()); 