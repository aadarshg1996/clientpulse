#!/usr/bin/env bash
# Create the local Postgres database named in .env (idempotent).
# Atlas manages objects *inside* the database; it does not create the database
# itself, so this bootstrap runs once against the maintenance `postgres` db.
set -euo pipefail

# Explicit env vars win over .env (so callers can target a different DB).
_OVERRIDE_DB="${POSTGRES_DB:-}"

# Load .env if present (POSTGRES_* vars).
ENV_FILE="${ENV_FILE:-.env}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

DB="${_OVERRIDE_DB:-${POSTGRES_DB:-clientpulse}}"
HOST="${POSTGRES_HOST:-127.0.0.1}"
PORT="${POSTGRES_PORT:-5432}"
USER="${POSTGRES_USER:-$(whoami)}"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"

# Does the database already exist?
exists="$(psql -h "$HOST" -p "$PORT" -U "$USER" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '${DB}'")"

if [[ "$exists" == "1" ]]; then
  echo "Database '${DB}' already exists — nothing to do."
  exit 0
fi

# CREATE DATABASE cannot run in a transaction block; psql one-shot is fine.
psql -h "$HOST" -p "$PORT" -U "$USER" -d postgres -c "CREATE DATABASE \"${DB}\""
echo "Created database '${DB}'."
