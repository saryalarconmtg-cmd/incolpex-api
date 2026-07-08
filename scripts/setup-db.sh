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
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-incolpex_dev}"
export MYSQL_PWD="${DB_PASS:-}"

echo "Creando base de datos '$DB_NAME' en $DB_HOST:$DB_PORT (usuario: $DB_USER)..."

mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
  -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "Base de datos '$DB_NAME' lista (creada o ya existente)."

echo "Aplicando migraciones..."
node "$PROJECT_ROOT/src/migrations/001_create_tables.js"

echo "Listo. Ejecuta 'npm run seed' para agregar datos de prueba."
