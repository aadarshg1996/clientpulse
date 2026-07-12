-- Desired-state schema for clientpulse (Atlas declarative source of truth).
-- Apply with: make db-apply  (atlas schema apply --to file://schema.sql)
-- Conventions (mirrors dyle-salesforce): plural snake_case tables, identity PK
-- `id`, created_at/updated_at timestamptz, FKs named fk_<table>_<col>, indexes
-- named ix_<table>_<cols>. `updated_at` is maintained at the app level
-- (SQLAlchemy onupdate=now()), not by a DB trigger.

-- ---------------------------------------------------------------------------
-- accounts — one row per client account (parent of all other tables)
-- ---------------------------------------------------------------------------
CREATE TABLE accounts (
  id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_uid          text        NOT NULL,
  name                 text        NOT NULL,
  segment              text,
  owner                text,
  arr                  numeric(14, 2),
  sentiment            text,
  contract_term_months integer,
  contract_start_dt    date,
  renewal_dt           date,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_accounts_account_uid UNIQUE (account_uid)
);

-- ---------------------------------------------------------------------------
-- health_scores — weekly health snapshots (time series → trend chart)
-- ---------------------------------------------------------------------------
CREATE TABLE health_scores (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_uid text        NOT NULL,
  snapshot_dt date        NOT NULL,
  score       integer     NOT NULL,
  status      text,
  trend_dir   text,
  confidence  integer,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_health_scores_account
    FOREIGN KEY (account_uid) REFERENCES accounts (account_uid) ON DELETE CASCADE
);

CREATE INDEX ix_health_scores_account_uid ON health_scores (account_uid);

-- ---------------------------------------------------------------------------
-- sla_metrics — monthly SLA target vs actual (→ drawer SLA bars)
-- ---------------------------------------------------------------------------
CREATE TABLE sla_metrics (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_uid  text          NOT NULL,
  period_month date          NOT NULL,
  target_pct   numeric(5, 2) NOT NULL,
  actual_pct   numeric(5, 2) NOT NULL,
  breached     boolean       NOT NULL DEFAULT false,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  updated_at   timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT fk_sla_metrics_account
    FOREIGN KEY (account_uid) REFERENCES accounts (account_uid) ON DELETE CASCADE
);

CREATE INDEX ix_sla_metrics_account_uid ON sla_metrics (account_uid);

-- ---------------------------------------------------------------------------
-- signals — detected risk/health signals with evidence (→ drawer signals)
-- ---------------------------------------------------------------------------
CREATE TABLE signals (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_uid  text        NOT NULL,
  tone         text        NOT NULL,
  label        text        NOT NULL,
  signal_text  text,
  evidence_ref text,
  source_file     text,
  source_file_id  text,
  source_quote    text,
  feedback        text,
  feedback_at     timestamptz,
  detected_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_signals_account
    FOREIGN KEY (account_uid) REFERENCES accounts (account_uid) ON DELETE CASCADE
);

CREATE INDEX ix_signals_account_uid ON signals (account_uid);

-- ---------------------------------------------------------------------------
-- actions — recommended next actions, pending human review/approval
-- ---------------------------------------------------------------------------
CREATE TABLE actions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_uid text        NOT NULL,
  priority    text        NOT NULL,
  title           text        NOT NULL,
  owner           text,
  due_label       text,
  due_date        date,
  rationale       text,
  expected_impact text,
  linked_signal   text,
  status      text        NOT NULL DEFAULT 'recommended',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_actions_account
    FOREIGN KEY (account_uid) REFERENCES accounts (account_uid) ON DELETE CASCADE
);

CREATE INDEX ix_actions_account_uid ON actions (account_uid);

-- ---------------------------------------------------------------------------
-- documents — uploaded source files synced to the OpenAI vector store
-- ---------------------------------------------------------------------------
CREATE TABLE documents (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_uid     text        NOT NULL,
  filename        text        NOT NULL,
  doc_type        text,
  openai_file_id  text,
  vector_store_id text,
  uploaded_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_documents_account
    FOREIGN KEY (account_uid) REFERENCES accounts (account_uid) ON DELETE CASCADE
);

CREATE INDEX ix_documents_account_uid ON documents (account_uid);

-- ---------------------------------------------------------------------------
-- analysis_runs — audit trail for each agent analysis of an account
-- ---------------------------------------------------------------------------
CREATE TABLE analysis_runs (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_uid text        NOT NULL,
  status      text        NOT NULL DEFAULT 'running',
  model           text,
  trace_id        text,
  guardrail_flags text,
  eval_score      integer,
  eval_json       text,
  error           text,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_analysis_runs_account
    FOREIGN KEY (account_uid) REFERENCES accounts (account_uid) ON DELETE CASCADE
);

CREATE INDEX ix_analysis_runs_account_uid ON analysis_runs (account_uid);
