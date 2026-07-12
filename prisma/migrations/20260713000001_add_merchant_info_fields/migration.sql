-- 加盟店情報の拡充: 写真URL、アクセス情報、Googleマップ、店休日、営業時間
ALTER TABLE merchants
  ADD COLUMN photo1_url    VARCHAR(500),
  ADD COLUMN photo2_url    VARCHAR(500),
  ADD COLUMN access_note   VARCHAR(200),
  ADD COLUMN maps_url      VARCHAR(500),
  ADD COLUMN closed_days   VARCHAR(100),
  ADD COLUMN business_hours VARCHAR(100);
