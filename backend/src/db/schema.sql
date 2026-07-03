-- HireOS Database Schema v2
-- Agentic Hiring Intelligence Platform

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users (Recruiters) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  DEFAULT 'recruiter',
  avatar_initials VARCHAR(10),
  avatar_url    TEXT,
  phone         VARCHAR(50),
  job_title     VARCHAR(255),
  department    VARCHAR(255),
  timezone      VARCHAR(100) DEFAULT 'UTC',
  bio           TEXT,
  joined_on     TIMESTAMPTZ  DEFAULT NOW(),
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Tests ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(255),
  status        VARCHAR(50)  DEFAULT 'draft',
  instructions  TEXT,
  language      VARCHAR(50)  DEFAULT 'python',
  time_limit    INTEGER      DEFAULT 90,   -- minutes
  starter_code  TEXT,
  recruiter_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Test Cases ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID REFERENCES tests(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  input           TEXT,
  expected_output TEXT,
  is_hidden       BOOLEAN     DEFAULT false,
  weight          NUMERIC     DEFAULT 1.0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Candidates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID REFERENCES tests(id) ON DELETE SET NULL,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  role            VARCHAR(255),
  score           INTEGER CHECK (score >= 0 AND score <= 100),
  status          VARCHAR(50)  DEFAULT 'invited',
  last_activity   TIMESTAMPTZ  DEFAULT NOW(),
  score_breakdown JSONB        DEFAULT '{}',
  test_details    JSONB        DEFAULT '{}',
  security_flags  JSONB        DEFAULT '[]',  -- array of security incidents
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Candidate Activity Log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  status       VARCHAR(50),
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Invitations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id          UUID REFERENCES tests(id) ON DELETE CASCADE,
  candidate_id     UUID REFERENCES candidates(id) ON DELETE SET NULL,
  candidate_email  VARCHAR(255) NOT NULL,
  candidate_name   VARCHAR(255) NOT NULL,
  invitation_token UUID UNIQUE  DEFAULT gen_random_uuid(),
  status           VARCHAR(50)  DEFAULT 'pending',
  invited_at       TIMESTAMPTZ  DEFAULT NOW(),
  submitted_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ  DEFAULT (NOW() + INTERVAL '7 days')
);

-- ─── Evaluation Sessions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluation_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id      UUID REFERENCES candidates(id) ON DELETE CASCADE,
  test_id           UUID REFERENCES tests(id) ON DELETE CASCADE,
  invitation_id     UUID REFERENCES invitations(id) ON DELETE SET NULL,
  status            VARCHAR(50)  DEFAULT 'active',
  started_at        TIMESTAMPTZ  DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  telemetry         JSONB        DEFAULT '[]',
  sandbox_files     JSONB        DEFAULT '{}',  -- { filename: content }
  evaluation_result JSONB        DEFAULT '{}',
  provider_results  JSONB        DEFAULT '{}',  -- per-provider scores for audit
  rubric_version    VARCHAR(20)  DEFAULT '1.0.0',
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Security Events ───────────────────────────────────────────────────────
-- Every biometric / integrity event logged independently for full audit trail
CREATE TABLE IF NOT EXISTS security_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  event_type   VARCHAR(100) NOT NULL,
  -- FACE_NOT_DETECTED | MULTIPLE_FACES | TAB_SWITCH | WINDOW_BLUR
  -- COPY_PASTE | RIGHT_CLICK_BLOCKED | DEVTOOLS_OPEN | SCREEN_SHARE_DETECTED
  -- FOCUS_LOST | BIOMETRIC_ANOMALY | CAMERA_DISABLED | SESSION_STARTED
  severity     VARCHAR(20)  DEFAULT 'info',  -- info | warning | critical
  payload      JSONB        DEFAULT '{}',
  ts           TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Sandbox Files (per-session virtual filesystem snapshots) ─────────────
CREATE TABLE IF NOT EXISTS sandbox_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
  files        JSONB        DEFAULT '{}',  -- { filename: { content, language } }
  snapshot_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Idempotent migrations (safe to run every boot) ──────────────────────
-- Add columns introduced after initial table creation
ALTER TABLE tests ADD COLUMN IF NOT EXISTS language     VARCHAR(50)  DEFAULT 'python';
ALTER TABLE tests ADD COLUMN IF NOT EXISTS time_limit   INTEGER      DEFAULT 90;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS starter_code TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ  DEFAULT NOW();

ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS weight    NUMERIC DEFAULT 1.0;

ALTER TABLE evaluation_sessions ADD COLUMN IF NOT EXISTS sandbox_files   JSONB DEFAULT '{}';
ALTER TABLE evaluation_sessions ADD COLUMN IF NOT EXISTS provider_results JSONB DEFAULT '{}';
ALTER TABLE evaluation_sessions ADD COLUMN IF NOT EXISTS rubric_version   VARCHAR(20) DEFAULT '1.0';

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS security_flags JSONB DEFAULT '{}';

-- ─── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tests_recruiter       ON tests(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_test       ON candidates(test_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status     ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_invitations_token     ON invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_test      ON invitations(test_id);
CREATE INDEX IF NOT EXISTS idx_eval_sessions_cand    ON evaluation_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_cand     ON candidate_activity_log(candidate_id);
CREATE INDEX IF NOT EXISTS idx_security_events_sess  ON security_events(session_id);
CREATE INDEX IF NOT EXISTS idx_security_events_cand  ON security_events(candidate_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type  ON security_events(event_type);
