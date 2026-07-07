#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env"
  set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-incolpex_dev}"
export PGPASSWORD="${DB_PASS:-postgres}"

echo "Creando base de datos '$DB_NAME' en $DB_HOST:$DB_PORT (usuario: $DB_USER)..."

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d '|' -f 1 | grep -qw "$DB_NAME"; then
  echo "La base de datos '$DB_NAME' ya existe, se omite la creación."
else
  createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
  echo "Base de datos '$DB_NAME' creada."
fi

echo "Aplicando migraciones..."
node "$PROJECT_ROOT/src/migrations/001_create_tables.js"

echo "Listo. Ejecuta 'npm run seed' para agregar datos de prueba."
