-- websiteUrl を NULL 許容に変更
ALTER TABLE merchants ALTER COLUMN website_url DROP NOT NULL;
