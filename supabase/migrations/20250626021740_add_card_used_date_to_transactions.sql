ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS card_used_date date;
