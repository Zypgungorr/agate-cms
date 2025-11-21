-- Enum'ları text'e çevirmek için SQL scriptler
-- pgAdmin'de bu scriptleri sırayla çalıştırın

-- ÖNCE VIEW'I DROP ET
DROP VIEW IF EXISTS vw_campaign_summary;

-- 1. roles tablosunu düzelt
ALTER TABLE roles ADD COLUMN key_temp TEXT;
UPDATE roles SET key_temp = key::text;
ALTER TABLE roles DROP COLUMN key;
ALTER TABLE roles RENAME COLUMN key_temp TO key;
ALTER TABLE roles ADD CONSTRAINT roles_key_unique UNIQUE (key);

-- 2. campaign_staff tablosunu düzelt
ALTER TABLE campaign_staff ADD COLUMN role_temp TEXT;
UPDATE campaign_staff SET role_temp = role::text;
ALTER TABLE campaign_staff DROP COLUMN role;
ALTER TABLE campaign_staff RENAME COLUMN role_temp TO role;

-- 3. campaigns tablosunu düzelt
ALTER TABLE campaigns ADD COLUMN status_temp TEXT;
UPDATE campaigns SET status_temp = status::text;
ALTER TABLE campaigns DROP COLUMN status;
ALTER TABLE campaigns RENAME COLUMN status_temp TO status;

-- 4. adverts tablosunu düzelt
ALTER TABLE adverts ADD COLUMN status_temp TEXT;
UPDATE adverts SET status_temp = status::text;
ALTER TABLE adverts DROP COLUMN status;
ALTER TABLE adverts RENAME COLUMN status_temp TO status;

-- 5. VIEW'I YENİDEN OLUŞTUR
CREATE VIEW vw_campaign_summary AS
SELECT
  c.id,
  c.title,
  c.status,
  c.start_date,
  c.end_date,
  c.estimated_budget,
  c.actual_cost,
  (c.actual_cost - c.estimated_budget) AS budget_delta,
  COUNT(a.id) AS advert_count,
  COUNT(a.id) FILTER (WHERE a.status='completed') AS advert_completed,
  COUNT(a.id) FILTER (WHERE a.status IN ('scheduled','ready')) AS advert_pipeline
FROM campaigns c
LEFT JOIN adverts a ON a.campaign_id = c.id
GROUP BY c.id;

-- 6. Kontrol et
SELECT * FROM roles;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('roles', 'campaigns', 'adverts', 'campaign_staff') 
  AND column_name IN ('key', 'status', 'role')
ORDER BY table_name, column_name;
