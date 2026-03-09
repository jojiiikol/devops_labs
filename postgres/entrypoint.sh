#!/usr/bin/env sh
set -eu

# If you keep DB_* in backend/.env (as the app does), map them to the official
# Postgres image variables so the container auto-creates the user/db.
if [ -z "${POSTGRES_USER:-}" ] && [ -n "${DB_USER:-}" ]; then
  export POSTGRES_USER="$DB_USER"
fi

if [ -z "${POSTGRES_PASSWORD:-}" ] && [ -n "${DB_PASSWORD:-}" ]; then
  export POSTGRES_PASSWORD="$DB_PASSWORD"
fi

if [ -z "${POSTGRES_DB:-}" ] && [ -n "${DB_NAME:-}" ]; then
  export POSTGRES_DB="$DB_NAME"
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"

