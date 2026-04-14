#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_ASSETS="$REPO_ROOT/assets"

mkdir -p "$ROOT_ASSETS"

copied_count=0
missing_count=0
validated_html_count=0
asset_ref_count=0

copied_log=""
missing_log=""

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

find_source_asset() {
  local asset_name="$1"
  local current_html_dir="$2"
  local candidate=""

  if [ -f "$current_html_dir/assets/$asset_name" ]; then
    printf '%s\n' "$current_html_dir/assets/$asset_name"
    return 0
  fi

  candidate="$(find "$REPO_ROOT" -type f -path "*/assets/$asset_name" ! -path "$ROOT_ASSETS/$asset_name" 2>/dev/null | head -n 1 || true)"
  if [ -n "$candidate" ]; then
    printf '%s\n' "$candidate"
    return 0
  fi

  return 1
}

while IFS= read -r -d '' html_file; do
  if should_skip "$html_file"; then
    continue
  fi

  html_dir="$(dirname "$html_file")"
  asset_refs="$(grep -oE '/assets/[^/"'"'"' ?#>]+-[A-Za-z0-9_-]*[0-9][A-Za-z0-9_-]*\.(js|css)' "$html_file" | sort -u || true)"

  if [ -z "$asset_refs" ]; then
    continue
  fi

  validated_html_count=$((validated_html_count + 1))

  while IFS= read -r asset_ref; do
    [ -z "$asset_ref" ] && continue
    asset_ref_count=$((asset_ref_count + 1))
    asset_name="${asset_ref#/assets/}"
    root_target="$ROOT_ASSETS/$asset_name"

    if [ -f "$root_target" ]; then
      continue
    fi

    if source_path="$(find_source_asset "$asset_name" "$html_dir")"; then
      cp -f "$source_path" "$root_target"
      copied_count=$((copied_count + 1))
      copied_log+="\n- $asset_name <= ${source_path#$REPO_ROOT/}"
    else
      missing_count=$((missing_count + 1))
      missing_log+="\nERRO: Asset em falta: /assets/$asset_name referenciado em ${html_file#$REPO_ROOT/}"
    fi
  done <<< "$asset_refs"
done < <(find "$REPO_ROOT" -type f -name 'index.html' -print0)

if [ -n "$copied_log" ]; then
  echo "[post-build-validate] Cópias realizadas:${copied_log}"
fi

if [ -n "$missing_log" ]; then
  while IFS= read -r missing_entry; do
    [ -z "$missing_entry" ] && continue
    echo "$missing_entry" >&2
  done <<< "$missing_log"
  echo "ERRO: Falha na validação pós-build. Existem $missing_count assets hashed referenciados em index.html que continuam em falta na pasta /assets/ raiz." >&2
  exit 1
fi

echo "✓ Todos os $asset_ref_count assets validados com sucesso. $copied_count assets copiados para /assets/."
