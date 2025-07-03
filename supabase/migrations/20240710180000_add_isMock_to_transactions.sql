-- Add isMock column to transactions table
ALTER TABLE transactions
ADD COLUMN isMock boolean DEFAULT false; 

-- カラム一覧を確認
SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions'; 