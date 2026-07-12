-- 企業ごとに補助率(%)を設定できるようにする。デフォルト50%
ALTER TABLE companies ADD COLUMN subsidy_pct INTEGER NOT NULL DEFAULT 50;
