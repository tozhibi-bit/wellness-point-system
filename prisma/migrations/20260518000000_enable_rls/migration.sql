-- ============================================================
-- RLS (Row Level Security) 有効化
-- アプリは Prisma (postgres ユーザー) 経由でのみ DB にアクセスするため、
-- postgres は superuser として RLS を自動バイパスする。
-- anon / authenticated ロールからの直接アクセスをブロックするために有効化。
-- ============================================================

-- companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- super_admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- merchants
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- merchant_contracts
ALTER TABLE merchant_contracts ENABLE ROW LEVEL SECURITY;

-- services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- monthly_point_grants
ALTER TABLE monthly_point_grants ENABLE ROW LEVEL SECURITY;

-- transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
