-- GoogleマップURLや画像URLは500文字を超えることがあるため TEXT 化
ALTER TABLE merchants ALTER COLUMN photo1_url TYPE TEXT;
ALTER TABLE merchants ALTER COLUMN photo2_url TYPE TEXT;
ALTER TABLE merchants ALTER COLUMN maps_url   TYPE TEXT;
