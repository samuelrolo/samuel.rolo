#!/bin/bash
# sync-asset-hashes.sh
# Automatically syncs asset hash references across all sub-route HTML files
# after cv-analyser is rebuilt.
#
# Usage: bash scripts/sync-asset-hashes.sh
#
# The cv-analyser/index.html is the source of truth for asset hashes.
# All other directories (career-path, career-intelligence, bundle, linkedin-roaster,
# and their EN counterparts) reference the same assets from /cv-analyser/assets/.

# set -e  # disabled: arithmetic (( )) returns 1 when incrementing from 0

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$REPO_ROOT/cv-analyser/index.html"

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: Source file not found: $SOURCE"
  exit 1
fi

# Extract current hashes from cv-analyser/index.html
NEW_JS=$(grep -oP 'index-[A-Za-z0-9_-]+\.js' "$SOURCE" | head -1)
NEW_CSS=$(grep -oP 'index-[A-Za-z0-9_-]+\.css' "$SOURCE" | head -1)
NEW_RADIX=$(grep -oP 'vendor-radix-[A-Za-z0-9_-]+\.js' "$SOURCE" | head -1)
NEW_MOTION=$(grep -oP 'vendor-motion-[A-Za-z0-9_-]+\.js' "$SOURCE" | head -1)

echo "Source hashes from cv-analyser/index.html:"
echo "  JS:     $NEW_JS"
echo "  CSS:    $NEW_CSS"
echo "  Radix:  $NEW_RADIX"
echo "  Motion: $NEW_MOTION"
echo ""

# List of all HTML files that reference cv-analyser assets
TARGET_FILES=(
  "career-path/index.html"
  "career-path/results/index.html"
  "career-intelligence/index.html"
  "career-intelligence/results/index.html"
  "bundle/index.html"
  "bundle/results/index.html"
  "linkedin-roaster/index.html"
  "cv-analyser/results/index.html"
  "cv-analyser/test/index.html"
  "en/cv-analyser/index.html"
  "en/cv-analyser/results/index.html"
  "en/cv-analyser/test/index.html"
  "en/career-path/index.html"
  "en/career-path/results/index.html"
  "en/career-intelligence/index.html"
  "en/career-intelligence/results/index.html"
  "en/bundle/index.html"
  "en/bundle/results/index.html"
)

UPDATED=0
SKIPPED=0

for target in "${TARGET_FILES[@]}"; do
  FULL_PATH="$REPO_ROOT/$target"
  if [ ! -f "$FULL_PATH" ]; then
    echo "  SKIP (not found): $target"
    ((SKIPPED++))
    continue
  fi

  # Replace any index-*.js hash with the new one
  sed -i -E "s/index-[A-Za-z0-9_-]+\.js/$NEW_JS/g" "$FULL_PATH"
  # Replace any index-*.css hash with the new one
  sed -i -E "s/index-[A-Za-z0-9_-]+\.css/$NEW_CSS/g" "$FULL_PATH"

  # Replace vendor hashes if they exist in the file
  if [ -n "$NEW_RADIX" ]; then
    sed -i -E "s/vendor-radix-[A-Za-z0-9_-]+\.js/$NEW_RADIX/g" "$FULL_PATH"
  fi
  if [ -n "$NEW_MOTION" ]; then
    sed -i -E "s/vendor-motion-[A-Za-z0-9_-]+\.js/$NEW_MOTION/g" "$FULL_PATH"
  fi

  echo "  UPDATED: $target"
  ((UPDATED++))
done

echo ""
echo "Done! Updated $UPDATED files, skipped $SKIPPED files."
echo ""
echo "Next steps:"
echo "  git add -A && git commit -m 'chore: sync asset hashes after rebuild' && git push"
