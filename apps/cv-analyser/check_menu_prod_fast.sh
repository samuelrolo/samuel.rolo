#!/usr/bin/env bash
set -u
OUT=/home/ubuntu/share2inspire-frontend/apps/cv-analyser/menu_prod_check_fast.txt
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
  tmp=$(mktemp)
  err=$(mktemp)
  status='ok'
  /usr/bin/timeout 20s "$BROWSER" --headless --disable-gpu --disable-dev-shm-usage --no-sandbox --virtual-time-budget=8000 --dump-dom "$url" > "$tmp" 2> "$err"
  code=$?
  if [ "$code" -eq 124 ]; then status='timeout'; fi
  title=$(grep -oPm1 '(?<=<title>).*?(?=</title>)' "$tmp" | tr '\n' ' ')
  body=$(tr '\n' ' ' < "$tmp" | sed 's/<script[^>]*>[\s\S]*<\/script>/ /g' | sed 's/<style[^>]*>[\s\S]*<\/style>/ /g' | sed 's/<[^>]*>/ /g' | tr -s ' ' | head -c 260)
  bytes=$(wc -c < "$tmp")
  printf '%s\t%s\t%s\t%s\n' "$url" "$status" "$bytes" "$title" >> "$OUT"
  printf 'SNIPPET\t%s\n\n' "$body" >> "$OUT"
  rm -f "$tmp" "$err"
done
printf 'saved:%s\n' "$OUT"
