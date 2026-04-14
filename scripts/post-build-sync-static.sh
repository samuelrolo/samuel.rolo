#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$REPO_ROOT/apps/cv-analyser/dist"
DIST_INDEX="$DIST_DIR/index.html"
DIST_ASSETS="$DIST_DIR/assets"
ROOT_ASSETS="$REPO_ROOT/assets"

if [ ! -f "$DIST_INDEX" ]; then
  echo "ERRO: Ficheiro de build não encontrado: $DIST_INDEX" >&2
  exit 1
fi

if [ ! -d "$DIST_ASSETS" ]; then
  echo "ERRO: Pasta de assets do build não encontrada: $DIST_ASSETS" >&2
  exit 1
fi

mkdir -p "$ROOT_ASSETS"
cp -f "$DIST_ASSETS"/* "$ROOT_ASSETS/"

script_tag="$(grep -oE '<script type="module" crossorigin src="/assets/index-[^"]+\.js"></script>' "$DIST_INDEX" | head -n 1 || true)"
css_tag="$(grep -oE '<link rel="stylesheet" crossorigin href="/assets/index-[^"]+\.css">' "$DIST_INDEX" | head -n 1 || true)"
preload_tags="$(grep -oE '<link rel="modulepreload" crossorigin href="/assets/[^"]+\.js">' "$DIST_INDEX" || true)"

if [ -z "$script_tag" ] || [ -z "$css_tag" ]; then
  echo "ERRO: Não foi possível extrair os tags de assets a partir de $DIST_INDEX" >&2
  exit 1
fi

preload_block=""
if [ -n "$preload_tags" ]; then
  preload_block="$(printf '%s\n' "$preload_tags" | sed '/^$/d' | paste -sd '\n' -)"
fi

updated_count=0

should_skip() {
  local path="$1"
  case "$path" in
    "$REPO_ROOT/apps/"*|"$REPO_ROOT/area-cliente-src/"*|"$REPO_ROOT/node_modules/"*|"$REPO_ROOT/_archive/"*|"$REPO_ROOT/archive/"*|"$REPO_ROOT/.git/"*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

while IFS= read -r -d '' html_file; do
  if should_skip "$html_file"; then
    continue
  fi

  if ! grep -qE '/assets/index-[A-Za-z0-9_-]+\.js' "$html_file"; then
    continue
  fi

  export HTML_FILE="$html_file"
  export SCRIPT_TAG="$script_tag"
  export CSS_TAG="$css_tag"
  export PRELOAD_BLOCK="$preload_block"

  python3.11 <<'PY'
import os, re, pathlib
path = pathlib.Path(os.environ['HTML_FILE'])
text = path.read_text(encoding='utf-8')
orig = text
text = re.sub(r'<link rel="modulepreload" crossorigin href="/assets/[^"]+\.js">\s*', '', text)
text = re.sub(r'<script type="module" crossorigin src="/assets/index-[^"]+\.js"></script>', os.environ['SCRIPT_TAG'], text, count=1)
text = re.sub(r'<link rel="stylesheet" crossorigin href="/assets/index-[^"]+\.css">', os.environ['CSS_TAG'], text, count=1)
script = os.environ['SCRIPT_TAG']
preloads = os.environ['PRELOAD_BLOCK'].strip()
replacement = f"{preloads}\n  {script}" if preloads else script
text = text.replace(script, replacement, 1)
if text != orig:
    path.write_text(text, encoding='utf-8')
PY

  updated_count=$((updated_count + 1))
done < <(find "$REPO_ROOT" -type f -name 'index.html' -print0)

echo "[post-build-sync-static] Assets do build copiados para /assets/."
echo "[post-build-sync-static] Ficheiros index.html alinhados com os hashes atuais: $updated_count"
