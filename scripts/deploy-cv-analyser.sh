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
BUILD_DIR="$APP_DIR/dist/public"

echo "🔨 Building cv-analyser..."
cd "$APP_DIR"
npx vite build

echo ""
echo "📦 Syncing assets..."
rm -rf "$REPO_ROOT/cv-analyser/assets"
cp -r "$BUILD_DIR/assets" "$REPO_ROOT/cv-analyser/assets"

echo ""
echo "📄 Syncing ALL index.html files..."

# Master list of ALL directories that serve the React SPA.
# If you add a new route/page, ADD IT HERE.
TARGETS=(
  "cv-analyser/index.html"
  "cv-analyser/demo.html"
  "cv-analyser/results/index.html"
  "cv-analyser/test/index.html"
  "en/cv-analyser/index.html"
  "en/cv-analyser/demo.html"
  "en/cv-analyser/results/index.html"
  "en/cv-analyser/test/index.html"
  "career-path/index.html"
  "career-path/results/index.html"
  "career-path/example/index.html"
  "en/career-path/index.html"
  "en/career-path/results/index.html"
  "bundle/index.html"
  "bundle/results/index.html"
  "en/bundle/index.html"
  "en/bundle/results/index.html"
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
for f in $(grep -rl "cv-analyser/assets" --include="*.html" "$REPO_ROOT" 2>/dev/null); do
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
