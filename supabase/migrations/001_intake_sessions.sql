-- ============================================================
-- Migration: 001_intake_sessions
-- Run this in the Supabase dashboard SQL editor
-- or via: supabase db push (if CLI is configured)
-- ============================================================

CREATE TABLE IF NOT EXISTS intake_sessions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name       text        NOT NULL,
  model_name      text,
  form_data       jsonb       NOT NULL DEFAULT '{}',
  chat_history    jsonb       NOT NULL DEFAULT '[]',
  wizard_step     integer     NOT NULL DEFAULT 1,
  completion_pct  integer     NOT NULL DEFAULT 0,
  report          jsonb,
  status          text        NOT NULL DEFAULT 'in_progress'
                              CHECK (status IN ('in_progress', 'complete')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER intake_sessions_updated_at
  BEFORE UPDATE ON intake_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
