#!/bin/bash
# Post-build script: copy the main index.html to all sub-directory pages
# This ensures Vercel serves the correct HTML for all SPA routes
# (Vercel serves static files before applying rewrites)

DIST_DIR="dist/public"
MAIN_HTML="$DIST_DIR/index.html"

if [ ! -f "$MAIN_HTML" ]; then
    echo "Error: $MAIN_HTML not found"
    exit 1
fi

for dir in perfil dashboard membros planos auth; do
    mkdir -p "$DIST_DIR/$dir"
    cp "$MAIN_HTML" "$DIST_DIR/$dir/index.html"
    echo "Synced $dir/index.html"
done

echo "All sub-directory index.html files synced successfully"
