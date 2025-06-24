-- 定期支出テーブルに支払い月日の配列(payment_schedule)カラムを追加
ALTER TABLE recurring_expenses
ADD COLUMN IF NOT EXISTS payment_schedule JSONB;
 
-- 既存データのdescriptionに配列が入っている場合は、descriptionをNULLにし、payment_scheduleに移す（必要なら）
-- ここでは自動変換は行わず、手動で移行する場合は別途SQLを実行してください。 