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
BUILD_DIR="$SCRIPT_DIR/dist/public"
# Navigate to the monorepo root (two levels up from apps/cv-analyser/)
DEPLOY_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMMIT_MSG="${1:-deploy: update CV Analyser assets}"

# All 6 SPA directories that share the same build output
SPA_DIRS=("cv-analyser" "en/cv-analyser" "career-path" "en/career-path" "career-intelligence" "en/career-intelligence" "bundle" "en/bundle" "linkedin-roaster" "en/linkedin-roaster" "estudante" "student-pack" "en/student-pack" "es" "es/cv-analyser" "es/career-path" "es/career-intelligence" "es/bundle" "es/linkedin-roaster" "es/student-pack" "es/pages/knowledge" "es/pages/services" "en/pages/knowledge" "en/pages/services")

# All 12 routes to verify after deploy
ROUTES=(
  "https://www.share2inspire.pt/cv-analyser"
  "https://www.share2inspire.pt/cv-analyser/results"
  "https://www.share2inspire.pt/career-path"
  "https://www.share2inspire.pt/career-path/results"
  "https://www.share2inspire.pt/career-intelligence"
  "https://www.share2inspire.pt/estudante"
  "https://www.share2inspire.pt/student-pack"
  "https://www.share2inspire.pt/en/cv-analyser"
  "https://www.share2inspire.pt/en/cv-analyser/results"
  "https://www.share2inspire.pt/en/career-path"
  "https://www.share2inspire.pt/en/career-path/results"
  "https://www.share2inspire.pt/en/career-intelligence"
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

# ── Step 2: Sync to all 4 directories ──
echo ""
echo "▸ [2/5] Syncing assets to deploy directory..."

# ⚠️  Static HTML files that must NEVER be overwritten:
#   - cv-analyser/demo.html, en/cv-analyser/demo.html
#   - career-path/example/index.html, en/career-path/example/index.html

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
