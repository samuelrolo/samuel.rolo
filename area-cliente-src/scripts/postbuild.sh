#!/bin/bash
# =============================================================
# Post-build script for area-cliente
# Copies the main index.html to all SPA sub-route folders
# so Vercel serves the correct bundle for every route.
# =============================================================

DIST_DIR="$(dirname "$0")/../dist/public"
MAIN_INDEX="$DIST_DIR/index.html"

# All client-side routes that need their own index.html
ROUTES=(auth perfil dashboard membros planos)

if [ ! -f "$MAIN_INDEX" ]; then
  echo "❌ Build output not found at $MAIN_INDEX"
  exit 1
fi

echo "📋 Copying index.html to sub-route folders..."

for route in "${ROUTES[@]}"; do
  mkdir -p "$DIST_DIR/$route"
  cp "$MAIN_INDEX" "$DIST_DIR/$route/index.html"
  echo "  ✓ $route/index.html"
done

echo "✅ Post-build complete — ${#ROUTES[@]} sub-routes updated."
