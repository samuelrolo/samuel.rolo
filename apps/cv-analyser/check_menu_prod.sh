#!/usr/bin/env bash
set -euo pipefail
OUT=/home/ubuntu/share2inspire-frontend/apps/cv-analyser/menu_prod_check.txt
: > "$OUT"
URLS=(
  'https://www.share2inspire.pt'
  'https://www.share2inspire.pt/servicos'
  'https://www.share2inspire.pt/conhecimento'
  'https://www.share2inspire.pt/sobre'
  'https://www.share2inspire.pt/contactos'
  'https://www.share2inspire.pt/en'
  'https://www.share2inspire.pt/en/services'
  'https://www.share2inspire.pt/en/knowledge'
  'https://www.share2inspire.pt/en/about'
  'https://www.share2inspire.pt/en/contact'
  'https://www.share2inspire.pt/es'
  'https://www.share2inspire.pt/es/servicios'
  'https://www.share2inspire.pt/es/conocimiento'
  'https://www.share2inspire.pt/es/sobre'
  'https://www.share2inspire.pt/es/contacto'
)
if command -v chromium >/dev/null 2>&1; then BROWSER=chromium; elif command -v chromium-browser >/dev/null 2>&1; then BROWSER=chromium-browser; else echo 'Chromium not found' >> "$OUT"; exit 1; fi
for url in "${URLS[@]}"; do
  echo "=== $url ===" >> "$OUT"
  tmp=$(mktemp)
  "$BROWSER" --headless --disable-gpu --no-sandbox --virtual-time-budget=12000 --dump-dom "$url" > "$tmp" 2>/dev/null || true
  python3.11 - <<'PY' "$tmp" >> "$OUT"
import re, sys
from pathlib import Path
html = Path(sys.argv[1]).read_text(errors='ignore')
text = re.sub(r'<script[\s\S]*?</script>', ' ', html, flags=re.I)
text = re.sub(r'<style[\s\S]*?</style>', ' ', text, flags=re.I)
text = re.sub(r'<[^>]+>', ' ', text)
text = re.sub(r'\s+', ' ', text).strip()
title = re.search(r'<title>(.*?)</title>', html, re.I|re.S)
print('TITLE:', (title.group(1).strip() if title else ''))
print('TEXT_SNIPPET:', text[:320])
print('BLANK_LIKELY:', len(text) < 80)
PY
  rm -f "$tmp"
  echo >> "$OUT"
done
printf 'saved:%s\n' "$OUT"
