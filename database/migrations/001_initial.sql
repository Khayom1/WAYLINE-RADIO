CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  default_language VARCHAR(2) NOT NULL DEFAULT 'en' CHECK (default_language IN ('tg','ru','en')),
  enabled_languages TEXT[] NOT NULL DEFAULT ARRAY['tg','ru','en'],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(24) NOT NULL CHECK (role IN ('platform_admin','company_admin','editor','viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_memberships (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role VARCHAR(24) NOT NULL CHECK (role IN ('company_admin','editor','viewer')),
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  stream_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  artist VARCHAR(200) NOT NULL,
  composer VARCHAR(200) NOT NULL DEFAULT '',
  album VARCHAR(200) NOT NULL DEFAULT '',
  audio_url TEXT,
  license_type VARCHAR(80) NOT NULL,
  license_source TEXT NOT NULL DEFAULT '',
  license_proof_url TEXT NOT NULL DEFAULT '',
  license_expires_at DATE,
  rights_holder VARCHAR(200) NOT NULL DEFAULT '',
  commercial_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  streaming_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (audio_url IS NULL OR audio_url ~ '^https?://'),
  CHECK (license_proof_url = '' OR license_proof_url ~ '^https?://')
);

CREATE TABLE IF NOT EXISTS information_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  feed_url TEXT NOT NULL CHECK (feed_url ~ '^https://'),
  source_type VARCHAR(24) NOT NULL DEFAULT 'rss' CHECK (source_type IN ('rss','atom')),
  original_language VARCHAR(2) NOT NULL DEFAULT 'en' CHECK (original_language IN ('tg','ru','en')),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, feed_url)
);

CREATE TABLE IF NOT EXISTS information_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID REFERENCES information_sources(id) ON DELETE SET NULL,
  external_id TEXT,
  title_original TEXT NOT NULL,
  body_original TEXT NOT NULL DEFAULT '',
  original_language VARCHAR(2) NOT NULL DEFAULT 'en' CHECK (original_language IN ('tg','ru','en')),
  title_tg TEXT NOT NULL DEFAULT '',
  body_tg TEXT NOT NULL DEFAULT '',
  title_ru TEXT NOT NULL DEFAULT '',
  body_ru TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','queued')),
  audio_files JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_id, external_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title_tg TEXT NOT NULL DEFAULT '',
  body_tg TEXT NOT NULL DEFAULT '',
  title_ru TEXT NOT NULL DEFAULT '',
  body_ru TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','scheduled','published','cancelled')),
  audio_files JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_company ON company_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_tracks_company ON tracks(company_id);
CREATE INDEX IF NOT EXISTS idx_information_company_status ON information_items(company_id, status);
CREATE INDEX IF NOT EXISTS idx_announcements_company_status ON announcements(company_id, status);
CREATE INDEX IF NOT EXISTS idx_sources_enabled ON information_sources(is_enabled);

INSERT INTO companies(name, slug, default_language)
VALUES ('CNU', 'cnu', 'en'), ('ETL', 'etl', 'en')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO stations(company_id, name, slug, description)
SELECT id, name || ' Radio', slug || '-radio', 'Company radio station'
FROM companies WHERE slug IN ('cnu','etl')
ON CONFLICT (company_id) DO NOTHING;

INSERT INTO categories(company_id, name)
SELECT c.id, v.name
FROM companies c
CROSS JOIN (VALUES ('Road & Travel'), ('Country'), ('Pop'), ('Rock'), ('Jazz'), ('Classical'), ('Electronic'), ('Relax')) AS v(name)
WHERE c.slug IN ('cnu','etl')
ON CONFLICT (company_id, name) DO NOTHING;