-- Model Intake Portal — Supabase schema
-- Run this in your Supabase SQL Editor to create the required table.

CREATE TABLE IF NOT EXISTS intake_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name       TEXT NOT NULL,
  model_name      TEXT,
  form_data       JSONB NOT NULL DEFAULT '{}',
  chat_history    JSONB NOT NULL DEFAULT '[]',
  wizard_step     INTEGER NOT NULL DEFAULT 1,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  report          JSONB,
  status          TEXT NOT NULL DEFAULT 'in_progress',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing sessions by recency
CREATE INDEX IF NOT EXISTS idx_intake_sessions_updated
  ON intake_sessions (updated_at DESC);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON intake_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row-level security (allow all for anon key — tighten for production)
ALTER TABLE intake_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON intake_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);
