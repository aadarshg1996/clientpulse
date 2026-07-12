# Atlas project config for clientpulse (declarative flow).
# Desired state lives in schema.sql; Atlas diffs it against the target DB.
#
# Usage:
#   make db-apply   # atlas schema apply --env local
#   make db-diff    # atlas schema diff  --env local  (dry run, shows the plan)
#
# Atlas needs a scratch "dev" database to normalize the desired schema. We point
# it at a throwaway database on the same local Postgres instance.

variable "url" {
  type    = string
  default = getenv("DATABASE_URL")
}

variable "dev_url" {
  type    = string
  default = getenv("ATLAS_DEV_URL")
}

env "local" {
  src = "file://schema.sql"
  url = var.url
  dev = var.dev_url
}
