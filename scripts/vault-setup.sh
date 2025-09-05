#!/bin/bash
# HashiCorp Vault セットアップ例

# Vault サーバー起動（開発モード）
vault server -dev &

# 環境変数設定
export VAULT_ADDR='http://127.0.0.1:8200'

# 秘密情報の保存
vault kv put secret/myapp \
  supabase_url="https://project.supabase.co" \
  supabase_key="your_key_here"

# 秘密情報の取得
vault kv get -field=supabase_url secret/myapp