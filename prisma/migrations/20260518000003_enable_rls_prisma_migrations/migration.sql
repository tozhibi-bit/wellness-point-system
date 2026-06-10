-- _prisma_migrations テーブルに RLS を有効化
-- postgres (superuser) は自動バイパスするためマイグレーション動作に影響なし
ALTER TABLE _prisma_migrations ENABLE ROW LEVEL SECURITY;
