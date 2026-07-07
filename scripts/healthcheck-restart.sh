#!/usr/bin/env bash
# Healthcheck + auto-restart para la app Node en cPanel. Pensado para correr
# desde un cron job (ver README-DEPLOYMENT.md, Paso 8).
#
# En cPanel, el proceso Node no se administra con PM2: lo administra Phusion
# Passenger (a través de "Setup Node.js App"), que ya reinicia el proceso si
# se cae. El único mecanismo soportado para forzar un reinicio manual es
# "tocar" el archivo tmp/restart.txt dentro de la carpeta de la app. Este
# script reemplaza al "cron job que reinicia PM2 si falla" solicitado
# originalmente, adaptado a como funciona realmente Passenger en cPanel.

set -euo pipefail

APP_DIR="${APP_DIR:?Define APP_DIR, ej: /home/usuario/api.incolpex.com}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:?Define HEALTHCHECK_URL, ej: https://api.incolpex.com/}"

mkdir -p "$APP_DIR/tmp"
LOG_FILE="$APP_DIR/tmp/healthcheck.log"

if curl -fsS --max-time 10 "$HEALTHCHECK_URL" > /dev/null; then
  echo "$(date -Iseconds) - healthcheck OK" >> "$LOG_FILE"
else
  echo "$(date -Iseconds) - healthcheck FALLÓ, forzando restart de la app" >> "$LOG_FILE"
  touch "$APP_DIR/tmp/restart.txt"
fi
