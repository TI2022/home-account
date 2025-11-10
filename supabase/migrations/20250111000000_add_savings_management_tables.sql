-- 積立管理機能用のテーブルを作成

-- 個人テーブル
CREATE TABLE IF NOT EXISTS persons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 積立口座テーブル
CREATE TABLE IF NOT EXISTS savings_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount BIGINT,
    current_balance BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 積立取引テーブル
CREATE TABLE IF NOT EXISTS savings_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES savings_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount BIGINT NOT NULL CHECK (amount > 0),
    memo TEXT NOT NULL DEFAULT '',
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_accounts_person_id ON savings_accounts(person_id);
CREATE INDEX IF NOT EXISTS idx_savings_accounts_user_id ON savings_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_account_id ON savings_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_date ON savings_transactions(date);

-- RLS (Row Level Security) ポリシーを設定
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;

-- 個人テーブルのRLSポリシー
CREATE POLICY "Users can only see their own persons" ON persons
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own persons" ON persons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own persons" ON persons
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own persons" ON persons
    FOR DELETE USING (auth.uid() = user_id);

-- 積立口座テーブルのRLSポリシー
CREATE POLICY "Users can only see their own savings_accounts" ON savings_accounts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own savings_accounts" ON savings_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own savings_accounts" ON savings_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own savings_accounts" ON savings_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- 積立取引テーブルのRLSポリシー
CREATE POLICY "Users can only see their own savings_transactions" ON savings_transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own savings_transactions" ON savings_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own savings_transactions" ON savings_transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own savings_transactions" ON savings_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at トリガーを設定
CREATE TRIGGER update_persons_updated_at
    BEFORE UPDATE ON persons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_accounts_updated_at
    BEFORE UPDATE ON savings_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_transactions_updated_at
    BEFORE UPDATE ON savings_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();