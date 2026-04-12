#!/usr/bin/env python3.11
import os
import re
import signal
import subprocess
from pathlib import Path

URLS = [
    'https://www.share2inspire.pt',
    'https://www.share2inspire.pt/servicos',
    'https://www.share2inspire.pt/conhecimento',
    'https://www.share2inspire.pt/sobre',
    'https://www.share2inspire.pt/contactos',
    'https://www.share2inspire.pt/en',
    'https://www.share2inspire.pt/en/services',
    'https://www.share2inspire.pt/en/knowledge',
    'https://www.share2inspire.pt/en/about',
    'https://www.share2inspire.pt/en/contact',
    'https://www.share2inspire.pt/es',
    'https://www.share2inspire.pt/es/servicios',
    'https://www.share2inspire.pt/es/conocimiento',
    'https://www.share2inspire.pt/es/sobre',
    'https://www.share2inspire.pt/es/contacto',
]

OUTPUT = Path('/home/ubuntu/share2inspire-frontend/apps/cv-analyser/menu_prod_validation_results.md')

EXPECTED = {
    'https://www.share2inspire.pt': ['share2inspire', 'carreira', 'ia'],
    'https://www.share2inspire.pt/servicos': ['serviços', 'career path', 'career intelligence'],
    'https://www.share2inspire.pt/conhecimento': ['conhecimento'],
    'https://www.share2inspire.pt/sobre': ['sobre', 'share2inspire'],
    'https://www.share2inspire.pt/contactos': ['contact', 'share2inspire'],
    'https://www.share2inspire.pt/en': ['share2inspire', 'career', 'ai'],
    'https://www.share2inspire.pt/en/services': ['services', 'career path', 'career intelligence'],
    'https://www.share2inspire.pt/en/knowledge': ['knowledge'],
    'https://www.share2inspire.pt/en/about': ['about', 'share2inspire'],
    'https://www.share2inspire.pt/en/contact': ['contact', 'share2inspire'],
    'https://www.share2inspire.pt/es': ['share2inspire', 'carrera', 'ia'],
    'https://www.share2inspire.pt/es/servicios': ['servicios', 'career path', 'career intelligence'],
    'https://www.share2inspire.pt/es/conocimiento': ['conocimiento'],
    'https://www.share2inspire.pt/es/sobre': ['sobre', 'share2inspire'],
    'https://www.share2inspire.pt/es/contacto': ['contact', 'share2inspire'],
}


def find_browser() -> str:
    for candidate in ('chromium', 'chromium-browser'):
        if subprocess.run(['bash', '-lc', f'command -v {candidate}'], capture_output=True).returncode == 0:
            return candidate
    raise SystemExit('Chromium not found')


def strip_html(html: str) -> str:
    html = re.sub(r'<script[\s\S]*?</script>', ' ', html, flags=re.I)
    html = re.sub(r'<style[\s\S]*?</style>', ' ', html, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', html)
    return re.sub(r'\s+', ' ', text).strip()


def fetch_dom(browser: str, url: str, timeout_sec: int = 22):
    cmd = [
        browser,
        '--headless',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--virtual-time-budget=8000',
        '--dump-dom',
        url,
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True)
    try:
        out, err = proc.communicate(timeout=timeout_sec)
        return {'status': 'ok' if proc.returncode == 0 else f'error_{proc.returncode}', 'html': out, 'stderr': err}
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGKILL)
        out, err = proc.communicate()
        return {'status': 'timeout', 'html': out, 'stderr': err}


def main():
    browser = find_browser()
    lines = ['# Validação de rotas do menu em produção', '', '| URL | Estado | Título | Indicadores | Observação |', '|---|---|---|---|---|']
    for url in URLS:
        result = fetch_dom(browser, url)
        html = result['html'] or ''
        title_match = re.search(r'<title>(.*?)</title>', html, flags=re.I | re.S)
        title = re.sub(r'\s+', ' ', title_match.group(1)).strip() if title_match else ''
        text = strip_html(html).lower()
        indicators = EXPECTED[url]
        matched = [token for token in indicators if token.lower() in text or token.lower() in title.lower()]
        blank = len(text) < 120 or ('<div id="root"></div>' in html)
        if result['status'] == 'timeout':
            observation = 'Timeout ao renderizar; resultado inconclusivo.'
        elif blank:
            observation = 'Possível página em branco ou DOM insuficiente.'
        elif len(matched) >= max(1, len(indicators) - 1):
            observation = 'Conteúdo esperado encontrado; rota aparenta estar funcional.'
        else:
            observation = 'Semântica parcial; requer revisão manual se houver suspeita.'
        title_safe = title.replace('|', '/').strip() or '—'
        indicators_safe = ', '.join(matched) if matched else '—'
        lines.append(f'| {url} | {result["status"]} | {title_safe} | {indicators_safe} | {observation} |')
    OUTPUT.write_text('\n'.join(lines) + '\n')
    print(str(OUTPUT))


if __name__ == '__main__':
    main()
