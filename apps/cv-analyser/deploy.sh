#!/bin/bash
# ============================================================
# deploy.sh — Build CV Analyser and deploy to Vercel (monorepo)
# ============================================================
# This script:
# 1. Builds the React app (npm run build)
# 2. Cleans and copies new assets to ALL 4 SPA directories
# 3. Copies index.html to all directories
# 4. Commits and pushes the monorepo for Vercel auto-deploy
# 5. Verifies all 8 routes return HTTP 200
#
# Usage: ./deploy.sh [commit message]
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/dist"
# Navigate to the monorepo root (two levels up from apps/cv-analyser/)
DEPLOY_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMMIT_MSG="${1:-deploy: update CV Analyser assets}"

# All SPA directories that share the same build output
SPA_DIRS=(
  "cv-analyser" "en/cv-analyser" "career-path" "en/career-path" "career-intelligence" "en/career-intelligence"
  "bundle" "en/bundle" "linkedin-roaster" "en/linkedin-roaster" "estudante" "student-pack" "en/student-pack"
  "es" "es/cv-analyser" "es/career-path" "es/career-intelligence" "es/bundle" "es/linkedin-roaster"
  "es/student-pack" "es/pack-estudiante" "es/pages/knowledge" "es/pages/services" "en/pages/knowledge" "en/pages/services"
  "sobre" "about" "en/about" "en/sobre" "es/sobre"
  "contactos" "contact" "en/contact" "en/contactos" "es/contacto"
  "politica-privacidade" "politica-cookies" "informacao-legal" "termos-condicoes" "tratamento-dados"
  "en/politica-privacidade" "en/politica-cookies" "en/informacao-legal" "en/termos-condicoes" "en/tratamento-dados"
  "es/politica-cookies"
)

# All critical routes to verify after deploy
ROUTES=(
  "https://www.share2inspire.pt/cv-analyser"
  "https://www.share2inspire.pt/cv-analyser/results"
  "https://www.share2inspire.pt/career-path"
  "https://www.share2inspire.pt/career-path/results"
  "https://www.share2inspire.pt/career-intelligence"
  "https://www.share2inspire.pt/estudante"
  "https://www.share2inspire.pt/student-pack"
  "https://www.share2inspire.pt/en/student-pack"
  "https://www.share2inspire.pt/es/pack-estudiante"
  "https://www.share2inspire.pt/es/student-pack"
  "https://www.share2inspire.pt/en/cv-analyser"
  "https://www.share2inspire.pt/en/cv-analyser/results"
  "https://www.share2inspire.pt/en/career-path"
  "https://www.share2inspire.pt/en/career-path/results"
  "https://www.share2inspire.pt/en/career-intelligence"
  "https://www.share2inspire.pt/sobre"
  "https://www.share2inspire.pt/en/about"
  "https://www.share2inspire.pt/es/sobre"
  "https://www.share2inspire.pt/contactos"
  "https://www.share2inspire.pt/en/contact"
  "https://www.share2inspire.pt/es/contacto"
  "https://www.share2inspire.pt/politica-privacidade"
  "https://www.share2inspire.pt/en/politica-privacidade"
  "https://www.share2inspire.pt/es/politica-cookies"
  "https://www.share2inspire.pt/termos-condicoes"
  "https://www.share2inspire.pt/tratamento-dados"
)

echo "═══════════════════════════════════════"
echo "  CV Analyser — Build & Deploy"
echo "═══════════════════════════════════════"
echo "  Source:  $SCRIPT_DIR"
echo "  Deploy:  $DEPLOY_DIR"
echo "═══════════════════════════════════════"

# ── Step 1: Build ──
echo ""
echo "▸ [1/5] Building React app..."
cd "$SCRIPT_DIR"
npm run build 2>&1 | tail -3

if [ ! -d "$BUILD_DIR/assets" ]; then
  echo "✗ Build failed — no assets directory found"
  exit 1
fi

NEW_JS=$(ls "$BUILD_DIR/assets/" | grep '^index-.*\.js$' | head -1)
NEW_CSS=$(ls "$BUILD_DIR/assets/" | grep '^index-.*\.css$' | head -1)
echo "  JS:  $NEW_JS"
echo "  CSS: $NEW_CSS"
echo "✓ Build complete"

# ── Step 2: Sync root assets + all SPA directories ──
echo ""
echo "▸ [2/5] Syncing assets to deploy directory..."

# ⚠️  Static HTML files that must NEVER be overwritten:
#   - cv-analyser/demo.html, en/cv-analyser/demo.html
#   - career-path/example/index.html, en/career-path/example/index.html

# IMPORTANT:
# The generated index.html references assets with absolute URLs (/assets/...)
# so every SPA entrypoint depends on the shared root assets directory.
rm -rf "$DEPLOY_DIR/assets/"
mkdir -p "$DEPLOY_DIR/assets/"
cp -r "$BUILD_DIR/assets/"* "$DEPLOY_DIR/assets/"
echo "  ✓ root assets/"

for dir in "${SPA_DIRS[@]}"; do
  TARGET="$DEPLOY_DIR/$dir"

  # Clean old assets completely
  rm -rf "$TARGET/assets/"
  mkdir -p "$TARGET/assets/"

  # Copy new assets + index.html (SPA entry point only)
  cp -r "$BUILD_DIR/assets/"* "$TARGET/assets/"
  cp "$BUILD_DIR/index.html" "$TARGET/index.html"

  # Also copy to results/ subfolder if it exists
  if [ -d "$TARGET/results" ]; then
    cp "$BUILD_DIR/index.html" "$TARGET/results/index.html"
  fi

  # Copy to test/ subfolder if it exists
  if [ -d "$TARGET/test" ]; then
    cp "$BUILD_DIR/index.html" "$TARGET/test/index.html"
  fi

  # Copy to bundle dirs
  BUNDLE_DIR="$DEPLOY_DIR/$(echo $dir | sed 's/cv-analyser/bundle/; s/career-path/bundle/')"
  if [ -d "$BUNDLE_DIR" ] && [ "$BUNDLE_DIR" != "$TARGET" ]; then
    cp "$BUILD_DIR/index.html" "$BUNDLE_DIR/index.html"
    if [ -d "$BUNDLE_DIR/results" ]; then
      cp "$BUILD_DIR/index.html" "$BUNDLE_DIR/results/index.html"
    fi
  fi

  echo "  ✓ $dir"
done

echo "✓ All directories synced"
echo "  ℹ️  Static demo/example files preserved (not overwritten)"

# ── Step 3: Verify local hashes ──
echo ""
echo "▸ [3/5] Verifying local index.html hashes..."
ALL_LOCAL_OK=true

if [ ! -f "$DEPLOY_DIR/assets/$NEW_JS" ]; then
  echo "  ✗ root assets/$NEW_JS — MISSING!"
  ALL_LOCAL_OK=false
else
  echo "  ✓ root assets/$NEW_JS"
fi

if [ ! -f "$DEPLOY_DIR/assets/$NEW_CSS" ]; then
  echo "  ✗ root assets/$NEW_CSS — MISSING!"
  ALL_LOCAL_OK=false
else
  echo "  ✓ root assets/$NEW_CSS"
fi

for dir in "${SPA_DIRS[@]}"; do
  TARGET="$DEPLOY_DIR/$dir/index.html"
  if grep -q "$NEW_JS" "$TARGET" 2>/dev/null; then
    echo "  ✓ $dir/index.html"
  else
    echo "  ✗ $dir/index.html — WRONG HASH!"
    ALL_LOCAL_OK=false
  fi
done

if [ "$ALL_LOCAL_OK" = false ]; then
  echo "✗ Local verification failed!"
  exit 1
fi

# ── Step 4: Deploy to Vercel (git push monorepo) ──
echo ""
echo "▸ [4/5] Deploying to Vercel..."
cd "$DEPLOY_DIR"
git add .
if git diff --cached --quiet; then
  echo "  (nothing to commit)"
else
  git commit -m "$COMMIT_MSG"
  git push 2>&1 | tail -3
fi
echo "✓ Deployed to Vercel"

# ── Step 5: Verify all routes ──
echo ""
echo "▸ [5/5] Verifying routes (waiting 12s for Vercel deploy)..."
sleep 12

ALL_OK=true
for url in "${ROUTES[@]}"; do
  STATUS=$(curl -sI -o /dev/null -w "%{http_code}" "$url")
  if [ "$STATUS" = "200" ]; then
    echo "  ✓ $url"
  else
    echo "  ✗ $url ($STATUS)"
    ALL_OK=false
  fi
done

echo ""
if [ "$ALL_OK" = true ]; then
  echo "═══════════════════════════════════════"
  echo "  ✓ ALL ROUTES OK — Deploy complete!"
  echo "═══════════════════════════════════════"
else
  echo "═══════════════════════════════════════"
  echo "  ⚠ Some routes failed — check above"
  echo "═══════════════════════════════════════"
fi
