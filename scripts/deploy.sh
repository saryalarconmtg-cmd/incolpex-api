#!/usr/bin/env bash
# Script de despliegue/actualización para cPanel hosting (api.incolpex.com).
#
# Se ejecuta por SSH DENTRO de la cuenta de cPanel, no en tu máquina local.
# Asume que ya existe:
#   - El subdominio creado (Paso 1 de README-DEPLOYMENT.md)
#   - La app Node.js creada en cPanel > Setup Node.js App (Paso 4), que es quien
#     crea el entorno virtual de Node y administra el proceso con Passenger.
#
# Los pasos de creación de subdominio y base de datos se intentan automatizar
# aquí vía `uapi` (disponible por SSH en la mayoría de cuentas cPanel), pero si
# tu proveedor los deshabilita, haz esos pasos desde la interfaz gráfica como
# se describe en README-DEPLOYMENT.md y luego corre este script solo para
# clonar/actualizar código, instalar dependencias y reiniciar la app.

set -euo pipefail

# ── Configuración (ajustar con tus datos reales antes de ejecutar) ──────────
CPANEL_USER="${CPANEL_USER:?Define CPANEL_USER, ej: export CPANEL_USER=incolpex}"
DOMINIO_PRINCIPAL="${DOMINIO_PRINCIPAL:-incolpex.com}"
SUBDOMINIO="${SUBDOMINIO:-api}"
APP_DIR="${APP_DIR:-$HOME/${SUBDOMINIO}.${DOMINIO_PRINCIPAL}}"
REPO_URL="${REPO_URL:-https://github.com/saryalarconmtg-cmd/incolpex-api.git}"
NODE_VERSION="${NODE_VERSION:-18}"
DB_NAME="${DB_NAME:-${CPANEL_USER}_incolpex}"
DB_USER="${DB_USER:-${CPANEL_USER}_incolpex}"
DB_PASS="${DB_PASS:-}"

echo "==> Paso 1: crear subdominio ${SUBDOMINIO}.${DOMINIO_PRINCIPAL}"
uapi SubDomain addsubdomain domain="$SUBDOMINIO" rootdomain="$DOMINIO_PRINCIPAL" \
  dir="public_html/${SUBDOMINIO}.${DOMINIO_PRINCIPAL}" \
  || echo "  (uapi no disponible o el subdominio ya existe; créalo desde cPanel > Dominios si hace falta)"

if [ -n "$DB_PASS" ]; then
  echo "==> Paso 2: crear base de datos MySQL '$DB_NAME'"
  uapi Mysql create_database name="$DB_NAME" \
    || echo "  (la base de datos ya existe o uapi no está disponible)"
  uapi Mysql create_user name="$DB_USER" password="$DB_PASS" \
    || echo "  (el usuario ya existe)"
  uapi Mysql set_privileges_on_database user="$DB_USER" database="$DB_NAME" privileges=ALL \
    || echo "  (no se pudieron asignar privilegios automáticamente; hazlo desde cPanel > MySQL Databases)"
else
  echo "==> Paso 2: omitido (define DB_PASS para crear la base de datos automáticamente)"
  echo "  Créala manualmente desde cPanel > MySQL Database Wizard si aún no existe."
fi

echo "==> Paso 3: clonar o actualizar el repositorio en ${APP_DIR}"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "==> Paso 4: instalar dependencias dentro del entorno virtual de Node de cPanel"
NODEVENV_ACTIVATE="$HOME/nodevenv/${SUBDOMINIO}.${DOMINIO_PRINCIPAL}/${NODE_VERSION}/bin/activate"
if [ -f "$NODEVENV_ACTIVATE" ]; then
  # shellcheck disable=SC1090
  source "$NODEVENV_ACTIVATE"
  (cd "$APP_DIR" && npm install --production)
  deactivate
else
  echo "  No se encontró el entorno virtual de Node en: $NODEVENV_ACTIVATE"
  echo "  Crea la app primero desde cPanel > Setup Node.js App (README-DEPLOYMENT.md, Paso 4)"
  echo "  y vuelve a ejecutar este script."
  exit 1
fi

echo "==> Paso 5: verificar archivo .env"
if [ ! -f "$APP_DIR/.env" ]; then
  echo "  No existe ${APP_DIR}/.env"
  echo "  Copia .env.production a .env dentro de ${APP_DIR} y completa las credenciales reales."
  exit 1
fi

echo "==> Paso 6: aplicar migraciones (crear tablas si no existen)"
node "$APP_DIR/src/migrations/001_create_tables.js"

echo "==> Paso 7: reiniciar la app (Passenger) y verificar que responde"
mkdir -p "$APP_DIR/tmp"
touch "$APP_DIR/tmp/restart.txt"
sleep 5
if curl -fsS "https://${SUBDOMINIO}.${DOMINIO_PRINCIPAL}/" > /dev/null; then
  echo "✓ Deploy completado, la API responde en https://${SUBDOMINIO}.${DOMINIO_PRINCIPAL}/"
else
  echo "⚠ La app no respondió tras el restart. Revisa los logs en cPanel > Setup Node.js App."
fi
