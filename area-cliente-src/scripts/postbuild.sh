#!/bin/bash
# =============================================================
# Post-build script for area-cliente
# Copies the main index.html to all SPA sub-route folders in the
# build output and syncs the published static area-cliente tree.
# =============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/../dist/public"
MAIN_INDEX="$DIST_DIR/index.html"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PUBLISHED_DIR="$REPO_ROOT/area-cliente"

# All client-side routes that need their own index.html
ROUTES=(perfil dashboard membros planos upgrade sobre vagas)

if [ ! -f "$MAIN_INDEX" ]; then
  echo "❌ Build output not found at $MAIN_INDEX"
  exit 1
fi


echo "📋 Copying index.html to dist/public sub-route folders..."
for route in "${ROUTES[@]}"; do
  mkdir -p "$DIST_DIR/$route"
  cp "$MAIN_INDEX" "$DIST_DIR/$route/index.html"
  echo "  ✓ dist/public/$route/index.html"
done

echo "📦 Syncing published area-cliente assets..."
mkdir -p "$PUBLISHED_DIR/assets"
cp -r "$DIST_DIR/assets/." "$PUBLISHED_DIR/assets/"
cp "$MAIN_INDEX" "$PUBLISHED_DIR/index.html"

echo "📄 Copying published index.html to static area-cliente routes..."
for route in "${ROUTES[@]}"; do
  mkdir -p "$PUBLISHED_DIR/$route"
  cp "$MAIN_INDEX" "$PUBLISHED_DIR/$route/index.html"
  echo "  ✓ area-cliente/$route/index.html"
done

echo "✅ Post-build complete — dist/public and published area-cliente updated."
