#!/bin/bash
# ============================================================
# deploy-cv-analyser.sh
# Build the cv-analyser React app and sync ALL index.html
# files across the repo to prevent blank pages.
#
# Usage: bash scripts/deploy-cv-analyser.sh
# ============================================================

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$REPO_ROOT/apps/cv-analyser"
BUILD_DIR="$APP_DIR/dist"

echo "🔨 Building cv-analyser..."
cd "$APP_DIR"
pnpm exec vite build

echo ""
echo "📦 Syncing assets to all route directories (EXCEPT area-cliente)..."

# ── Copy assets to /cv-analyser/assets (canonical location) ──
rm -rf "$REPO_ROOT/cv-analyser/assets"
cp -r "$BUILD_DIR/assets" "$REPO_ROOT/cv-analyser/assets"

# ── Copy assets to all OTHER route directories that need them ──
# CRITICAL: Do NOT touch area-cliente/, en/area-cliente/, es/area-cliente/
ASSET_DIRS=(
  "assets"
  "bundle/assets"
  "bundle/results/assets"
  "career-intelligence/assets"
  "career-intelligence/results/assets"
  "career-path/assets"
  "career-path/results/assets"
  "en/assets"
  "en/bundle/assets"
  "en/career-intelligence/assets"
  "en/career-intelligence/results/assets"
  "en/career-path/assets"
  "en/career-path/results/assets"
  "en/cv-analyser/assets"
  "en/cv-analyser/results/assets"
  "en/linkedin-roaster/assets"
  "en/linkedin-roaster/results/assets"
  "en/student-pack/assets"
  "en/student-pack/results/assets"
  "es/assets"
  "es/bundle/assets"
  "es/bundle/results/assets"
  "es/career-intelligence/assets"
  "es/career-intelligence/results/assets"
  "es/career-path/assets"
  "es/career-path/results/assets"
  "es/cv-analyser/assets"
  "es/cv-analyser/results/assets"
  "es/linkedin-roaster/assets"
  "es/linkedin-roaster/results/assets"
  "es/pack-estudiante/assets"
  "es/pack-estudiante/results/assets"
  "es/student-pack/assets"
  "es/student-pack/results/assets"
  "estudante/assets"
  "estudante/results/assets"
  "hr-report/assets"
  "interview-scripts/assets"
  "linkedin-roaster/assets"
  "linkedin-roaster/results/assets"
  "pages/assets"
  "student-pack/assets"
  "student-pack/results/assets"
)

mkdir -p \
  "$REPO_ROOT/es/pack-estudiante/assets" \
  "$REPO_ROOT/es/pack-estudiante/results/assets" \
  "$REPO_ROOT/es/pack-estudiante" \
  "$REPO_ROOT/es/pack-estudiante/results"

for dir in "${ASSET_DIRS[@]}"; do
  FULL_DIR="$REPO_ROOT/$dir"
  if [ -d "$(dirname "$FULL_DIR")" ]; then
    rm -rf "$FULL_DIR"
    cp -r "$BUILD_DIR/assets" "$FULL_DIR"
    echo "  ✅ $dir"
  else
    echo "  ⚠️  Skipped (parent dir missing): $dir"
  fi
done

echo ""
echo "📄 Syncing ALL index.html files..."

# Master list of ALL directories that serve the React SPA.
# If you add a new route/page, ADD IT HERE.
#
# ⚠️  DO NOT add static HTML demo/example pages here!
#     The following are STATIC HTML files (not React SPA) and must NEVER be overwritten:
#       - cv-analyser/demo.html (PT demo output)
#       - en/cv-analyser/demo.html (EN demo output)
#       - career-path/example/index.html (PT example output)
#       - en/career-path/example/index.html (EN example output)
# ⚠️  DO NOT add area-cliente directories here!
TARGETS=(
  # Root
  "index.html"
  # PT routes
  "cv-analyser/index.html"
  "cv-analyser/results/index.html"
  "cv-analyser/test/index.html"
  "career-path/index.html"
  "career-path/results/index.html"
  "career-intelligence/index.html"
  "career-intelligence/results/index.html"
  "bundle/index.html"
  "bundle/results/index.html"
  "linkedin-roaster/index.html"
  "linkedin-roaster/results/index.html"
  "estudante/index.html"
  "estudante/results/index.html"
  "student-pack/index.html"
  "student-pack/results/index.html"
  "hr-report/index.html"
  "about/index.html"
  "archive/index.html"
  "conhecimento/index.html"
  "contact/index.html"
  "contactos/index.html"
  "informacao-legal/index.html"
  "politica-cookies/index.html"
  "politica-privacidade/index.html"
  "servicos/index.html"
  "sobre/index.html"
  "termos-condicoes/index.html"
  "tratamento-dados/index.html"
  # EN routes
  "en/index.html"
  "en/cv-analyser/index.html"
  "en/cv-analyser/results/index.html"
  "en/cv-analyser/test/index.html"
  "en/career-path/index.html"
  "en/career-path/results/index.html"
  "en/career-intelligence/index.html"
  "en/career-intelligence/results/index.html"
  "en/bundle/index.html"
  "en/bundle/results/index.html"
  "en/linkedin-roaster/index.html"
  "en/linkedin-roaster/results/index.html"
  "en/student-pack/index.html"
  "en/student-pack/results/index.html"
  "en/pages/knowledge/index.html"
  "en/pages/services/index.html"
  "en/pages/privacy-policy/index.html"
  "en/estudante/index.html"
  "en/about/index.html"
  "en/contact/index.html"
  "en/conhecimento/index.html"
  "en/contactos/index.html"
  "en/cookie-policy/index.html"
  "en/data-processing/index.html"
  "en/informacao-legal/index.html"
  "en/knowledge/index.html"
  "en/legal-information/index.html"
  "en/politica-cookies/index.html"
  "en/politica-privacidade/index.html"
  "en/privacy-policy/index.html"
  "en/services/index.html"
  "en/servicos/index.html"
  "en/sobre/index.html"
  "en/termos-condicoes/index.html"
  "en/terms-and-conditions/index.html"
  "en/tratamento-dados/index.html"
  # ES routes
  "es/index.html"
  "es/cv-analyser/index.html"
  "es/cv-analyser/results/index.html"
  "es/career-path/index.html"
  "es/career-path/results/index.html"
  "es/career-intelligence/index.html"
  "es/career-intelligence/results/index.html"
  "es/bundle/index.html"
  "es/bundle/results/index.html"
  "es/linkedin-roaster/index.html"
  "es/linkedin-roaster/results/index.html"
  "es/pack-estudiante/index.html"
  "es/pack-estudiante/results/index.html"
  "es/student-pack/index.html"
  "es/student-pack/results/index.html"
  "es/pages/knowledge/index.html"
  "es/pages/services/index.html"
  "es/contacto/index.html"
  "es/conhecimento/index.html"
  "es/conocimiento/index.html"
  "es/contactos/index.html"
  "es/informacion-legal/index.html"
  "es/knowledge/index.html"
  "es/politica-cookies/index.html"
  "es/politica-privacidad/index.html"
  "es/services/index.html"
  "es/servicios/index.html"
  "es/servicos/index.html"
  "es/sobre/index.html"
  "es/terminos-condiciones/index.html"
  "es/tratamiento-datos/index.html"
  # Static/info pages (PT)
  "pages/pagamento/index.html"
  "pages/pagamento_sucesso/index.html"
  "pages/payment-confirmation/index.html"
)

SRC="$BUILD_DIR/index.html"
UPDATED=0
SKIPPED=0

for target in "${TARGETS[@]}"; do
  FULL_PATH="$REPO_ROOT/$target"
  if [ -d "$(dirname "$FULL_PATH")" ]; then
    cp "$SRC" "$FULL_PATH"
    echo "  ✅ $target"
    UPDATED=$((UPDATED+1))
  else
    echo "  ⚠️  Skipped (dir missing): $target"
    SKIPPED=$((SKIPPED+1))
  fi
done

echo ""
echo "✅ Done! Updated $UPDATED files, skipped $SKIPPED."
echo ""

# Verify all files have the same hash
CORRECT_HASH=$(grep -o 'assets/index-[^"]*\.js' "$SRC")
ERRORS=0
for f in $(grep -rl "assets/index-" --include="*.html" "$REPO_ROOT" 2>/dev/null | grep -v area-cliente | grep -v node_modules | grep -v .git | grep -v '/example/' | grep -v 'apps/cv-analyser/deploy' | grep -v '/_archive/'); do
  HASH=$(grep -o 'assets/index-[^"]*\.js' "$f" 2>/dev/null | head -1)
  if [ -n "$HASH" ] && [ "$HASH" != "$CORRECT_HASH" ]; then
    echo "  ❌ OUTDATED: $f (has $HASH, expected $CORRECT_HASH)"
    ERRORS=$((ERRORS+1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "⚠️  WARNING: $ERRORS files still have outdated hashes!"
  echo "   Add them to the TARGETS array in this script."
  exit 1
else
  echo "🎉 All files verified - no outdated hashes found."
fi
