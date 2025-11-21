-- =========================================================
-- Agate CMS - PostgreSQL Şeması (tam sürüm)
-- Çalıştırma notu:
--  - CITEXT ve gen_random_uuid() için extension'lar açılıyor.
--  - Tablelerde updated_at alanı otomatik güncellenir.
--  - Bütçe kalemleri değişince campaign.actual_cost otomatik güncellenir.
-- =========================================================

BEGIN;

-- ---------- EXTENSIONS ----------
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ---------- ENUMS ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
    CREATE TYPE campaign_status AS ENUM ('planned','active','on_hold','completed','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'advert_status') THEN
    CREATE TYPE advert_status   AS ENUM ('backlog','in_progress','ready','scheduled','completed','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_key') THEN
    CREATE TYPE role_key        AS ENUM ('admin','account_manager','creative','analyst');
  END IF;
END$$;

-- ---------- UTILITY: updated_at dokunma trigger'ı ----------
CREATE OR REPLACE FUNCTION trg_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- ---------- ROLES / USERS ----------
CREATE TABLE IF NOT EXISTS roles (
  id   SERIAL PRIMARY KEY,
  key  role_key UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT,
  office TEXT,                               -- ofis/konum (rapor filtreleri için)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS t_users_touch ON users;
CREATE TRIGGER t_users_touch
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id INT  REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ---------- CLIENTS ----------
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  contact_email CITEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS t_clients_touch ON clients;
CREATE TRIGGER t_clients_touch
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

-- müşteri için sorumlu personel listesi (çoklu atanabilir, birincil işaretlenebilir)
CREATE TABLE IF NOT EXISTS client_staff_contacts (
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  staff_id  UUID REFERENCES users(id)   ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, staff_id)
);

-- ---------- CAMPAIGNS ----------
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status campaign_status NOT NULL DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  estimated_budget NUMERIC(14,2) DEFAULT 0,
  actual_cost     NUMERIC(14,2) DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_campaign_dates CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  )
);

DROP TRIGGER IF EXISTS t_campaigns_touch ON campaigns;
CREATE TRIGGER t_campaigns_touch
BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

-- kampanya ekibine atamalar (aynı personel aynı kampanyaya bir kez)
CREATE TABLE IF NOT EXISTS campaign_staff (
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  staff_id    UUID REFERENCES users(id)     ON DELETE RESTRICT,
  role role_key NOT NULL DEFAULT 'creative',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, staff_id)
);

-- ---------- ADVERTS (ve yayın penceresi) ----------
CREATE TABLE IF NOT EXISTS adverts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,                      -- ör: Instagram, TV, Billboard
  status advert_status NOT NULL DEFAULT 'backlog',
  publish_start TIMESTAMPTZ,
  publish_end   TIMESTAMPTZ,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- sorumlu creative
  cost NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_publish_window CHECK (
    publish_end IS NULL OR publish_start IS NULL OR publish_end >= publish_start
  )
);

DROP TRIGGER IF EXISTS t_adverts_touch ON adverts;
CREATE TRIGGER t_adverts_touch
BEFORE UPDATE ON adverts
FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

-- ---------- CONCEPT NOTES ----------
CREATE TABLE IF NOT EXISTS concept_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
  title   TEXT NOT NULL,
  content TEXT NOT NULL,
  tags    TEXT[],
  is_shared BOOLEAN NOT NULL DEFAULT TRUE,    -- paylaşıma açık
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS t_concept_notes_touch ON concept_notes;
CREATE TRIGGER t_concept_notes_touch
BEFORE UPDATE ON concept_notes
FOR EACH ROW EXECUTE FUNCTION trg_touch_updated_at();

-- ---------- BUDGET LINES ----------
CREATE TABLE IF NOT EXISTS budget_lines (
  id BIGSERIAL PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  advert_id   UUID REFERENCES adverts(id) ON DELETE SET NULL,
  item   TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  booked_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- actual_cost hesabı (INSERT/UPDATE/DELETE sonrası)
CREATE OR REPLACE FUNCTION trg_sum_actual_cost() RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id UUID;
BEGIN
  v_campaign_id := COALESCE(NEW.campaign_id, OLD.campaign_id);

  UPDATE campaigns c
     SET actual_cost = COALESCE((
       SELECT SUM(bl.amount) FROM budget_lines bl WHERE bl.campaign_id = v_campaign_id
     ), 0)
   WHERE c.id = v_campaign_id;

  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS t_budget_lines_after ON budget_lines;
CREATE TRIGGER t_budget_lines_after
AFTER INSERT OR UPDATE OR DELETE ON budget_lines
FOR EACH ROW EXECUTE FUNCTION trg_sum_actual_cost();

-- ---------- AI SUGGESTIONS & AUDIT ----------
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  author_user_id  UUID REFERENCES users(id)     ON DELETE SET NULL, -- isteği tetikleyen kullanıcı
  kind TEXT NOT NULL,                 -- ideas | summary | recommendations
  prompt_snapshot JSONB NOT NULL,     -- bağlam + prompt
  result JSONB NOT NULL,              -- model çıktısı (yapılandırılmış)
  accepted BOOLEAN DEFAULT NULL,      -- kullanıcı kabul/ret
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  route TEXT NOT NULL,                -- /ai/ideas, /ai/summary vb.
  campaign_id UUID REFERENCES campaigns(id),
  latency_ms INT,
  status_code INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- REPORTING VIEW ----------
DROP VIEW IF EXISTS vw_campaign_summary;
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

-- ---------- INDEXES ----------
-- Not: CITEXT unique zaten case-insensitive; yine de hızlı arama için ek index faydalı olabilir.
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_campaigns_client ON campaigns (client_id, status);
CREATE INDEX IF NOT EXISTS ix_adverts_campaign_status ON adverts (campaign_id, status);
CREATE INDEX IF NOT EXISTS ix_adverts_publish ON adverts (publish_start, publish_end);
CREATE INDEX IF NOT EXISTS ix_concept_notes_campaign ON concept_notes (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_budget_lines_campaign ON budget_lines (campaign_id, booked_at);
-- JSONB alanları için (AI sonuçlarında arama yapacaksan) örnek GIN index:
-- CREATE INDEX IF NOT EXISTS ix_ai_suggestions_result_gin ON ai_suggestions USING gin (result);

COMMIT;

-- ---------- (İSTEĞE BAĞLI) TOHUM VERİ ÖRNEĞİ ----------
-- INSERT INTO roles(key,name) VALUES ('admin','Admin'), ('account_manager','Account Manager'), ('creative','Creative'), ('analyst','Analyst')
--   ON CONFLICT DO NOTHING;
-- INSERT INTO users(email,password_hash,full_name) VALUES ('admin@agate.local','<bcrypt>','System Admin');