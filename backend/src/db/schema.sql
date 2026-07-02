-- HireOS Database Schema
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
  status        VARCHAR(50)  DEFAULT 'draft', -- draft | active | closed
  instructions  TEXT,
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
  -- invited | in_progress | completed | reviewed | hired | rejected
  last_activity   TIMESTAMPTZ  DEFAULT NOW(),
  score_breakdown JSONB        DEFAULT '{}',
  -- { promptQuality, errorRecovery, outputCorrectness, codeQuality, executionEfficiency }
  test_details    JSONB        DEFAULT '{}',
  -- { testTaken, executionTime, language, environment }
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
  status           VARCHAR(50)  DEFAULT 'pending', -- pending | accepted | completed | expired
  invited_at       TIMESTAMPTZ  DEFAULT NOW(),
  submitted_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ  DEFAULT (NOW() + INTERVAL '7 days')
);

-- ─── Evaluation Sessions (LangGraph Engine) ───────────────────────────────
CREATE TABLE IF NOT EXISTS evaluation_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id      UUID REFERENCES candidates(id) ON DELETE CASCADE,
  test_id           UUID REFERENCES tests(id) ON DELETE CASCADE,
  invitation_id     UUID REFERENCES invitations(id) ON DELETE SET NULL,
  status            VARCHAR(50)  DEFAULT 'active', -- active | completed | failed
  started_at        TIMESTAMPTZ  DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  telemetry         JSONB        DEFAULT '[]',
  -- Array of { type, timestamp, payload } events from the candidate's session
  evaluation_result JSONB        DEFAULT '{}',
  -- LangGraph output: { scores, feedback, reasoning, compositeScore }
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tests_recruiter      ON tests(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_test      ON candidates(test_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status    ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_invitations_token    ON invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_test     ON invitations(test_id);
CREATE INDEX IF NOT EXISTS idx_eval_sessions_cand   ON evaluation_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_cand    ON candidate_activity_log(candidate_id);
