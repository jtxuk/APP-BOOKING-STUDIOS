#!/usr/bin/env bash
set -euo pipefail

if [[ -d "/home/reservasmillenia/www" ]]; then
  APP_ROOT="/home/reservasmillenia/www"
elif [[ -d "/home/millenia/www/app-reservas" ]]; then
  APP_ROOT="/home/millenia/www/app-reservas"
else
  echo "ERROR: no se encontro APP_ROOT valido" >&2
  exit 1
fi
FRONTEND_DIR="$APP_ROOT/frontend"
DIST_DIR="$FRONTEND_DIR/dist"
LOCK_FILE="$APP_ROOT/.deploy_frontend.lock"
LOG_FILE="$APP_ROOT/frontend/deploy_web_atomic.log"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Otro deploy esta en curso. Saliendo."
  exit 1
fi

{
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando build web"

  cd "$FRONTEND_DIR"
  npx expo export --platform web --output-dir dist

  if [[ ! -f "$DIST_DIR/index.html" ]]; then
    echo "ERROR: dist/index.html no existe"
    exit 1
  fi

  if [[ ! -d "$DIST_DIR/_expo/static/js/web" ]]; then
    echo "ERROR: dist/_expo/static/js/web no existe"
    exit 1
  fi

  if ! ls "$DIST_DIR/_expo/static/js/web"/AppEntry-*.js >/dev/null 2>&1; then
    echo "ERROR: no se encontro AppEntry-*.js en dist"
    exit 1
  fi

  TMP_DIR="$APP_ROOT/.deploy_tmp_$(date +%s)"
  mkdir -p "$TMP_DIR"

  cp -r "$DIST_DIR/_expo" "$TMP_DIR/_expo"
  cp "$DIST_DIR/index.html" "$TMP_DIR/index.html"
  cp "$DIST_DIR/metadata.json" "$TMP_DIR/metadata.json"

  rm -rf "$APP_ROOT/_expo"
  mv "$TMP_DIR/_expo" "$APP_ROOT/_expo"
  cp "$TMP_DIR/index.html" "$APP_ROOT/index.html"
  cp "$TMP_DIR/metadata.json" "$APP_ROOT/metadata.json"

  rm -rf "$TMP_DIR"

  HASH_IN_INDEX=$(grep -o 'AppEntry-[a-f0-9]\+' "$APP_ROOT/index.html" | head -1 || true)
  HASH_FILE=$(basename "$(ls -1 "$APP_ROOT/_expo/static/js/web"/AppEntry-*.js | head -1)" .js)

  if [[ -z "$HASH_IN_INDEX" || "$HASH_IN_INDEX" != "$HASH_FILE" ]]; then
    echo "ERROR: hash desincronizado index=$HASH_IN_INDEX file=$HASH_FILE"
    exit 1
  fi

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy OK ($HASH_FILE)"
} | tee -a "$LOG_FILE"
