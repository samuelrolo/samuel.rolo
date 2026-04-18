from __future__ import annotations

import re
from pathlib import Path

ROOT = Path('/tmp/s2i-check')
FILES = sorted(list((ROOT / 'videos').glob('*.html')) + list((ROOT / 'en' / 'videos').glob('*.html')))

CSS_LINK = '<link rel="stylesheet" href="/css/knowledge-hub-navbar.css">'
JS_LINK = '<script defer src="/js/knowledge-hub-navbar.js"></script>'

NAV = {
    'pt': {
        'home': ('Início', 'https://www.share2inspire.pt'),
        'student_pack': ('Pack Estudante', '/estudante'),
        'services': ('Serviços', '/servicos'),
        'hub': ('Knowledge Hub', '/conhecimento'),
        'about': ('Sobre', '/sobre'),
        'contact': ('Contactos', '/contactos'),
        'login': 'Login',
        'lang_label': 'PT',
        'lang_name': 'Português',
    },
    'en': {
        'home': ('Home', 'https://www.share2inspire.pt/en'),
        'student_pack': ('Student Pack', '/en/student-pack'),
        'services': ('Services', '/en/services'),
        'hub': ('Knowledge Hub', '/en/knowledge'),
        'about': ('About', '/en/about'),
        'contact': ('Contact', '/en/contact'),
        'login': 'Login',
        'lang_label': 'EN',
        'lang_name': 'English',
    },
    'es': {
        'home': ('Inicio', 'https://www.share2inspire.pt/es'),
        'student_pack': ('Pack Estudiante', '/es/pack-estudiante'),
        'services': ('Servicios', '/es/services'),
        'hub': ('Knowledge Hub', '/es/knowledge'),
        'about': ('Sobre', '/es/sobre'),
        'contact': ('Contacto', '/es/contacto'),
        'login': 'Login',
        'lang_label': 'ES',
        'lang_name': 'Español',
    },
}

COMMON_ITEMS = [
    ('CV Analyser', '/cv-analyser'),
    ('Career Path', '/career-path'),
    ('Career Intelligence', '/career-intelligence'),
    ('LinkedIn Roaster', '/linkedin-roaster'),
    ('Bundle', '/bundle'),
]

HEADER_RE = re.compile(r'<header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm font-sans" id="s2i-header">.*?</header>', re.S)
LEGACY_SCRIPT_RE = re.compile(r'\s*<script>\s*document\.querySelector\(\'\.nav-toggle\'\)\.addEventListener\(\'click\', function\(\) \{\s*document\.querySelector\(\'\.nav-links\'\)\.classList\.toggle\(\'open\'\);\s*\}\);\s*</script>\s*', re.S)
ALT_RE = re.compile(r'<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"[^>]*>')


def language_for(path: Path) -> str:
    return 'en' if '/en/' in path.as_posix() else 'pt'


def extract_alternates(html: str, lang: str) -> dict[str, str]:
    alts: dict[str, str] = {}
    for code, href in ALT_RE.findall(html):
        normalized = code.lower()
        if normalized in {'pt', 'pt-pt'}:
            alts['pt'] = href
        elif normalized.startswith('en'):
            alts['en'] = href
        elif normalized.startswith('es'):
            alts['es'] = href
    if 'pt' not in alts and lang == 'pt':
        canonical = re.search(r'<link rel="canonical" href="([^"]+)"', html)
        if canonical:
            alts['pt'] = canonical.group(1)
    if 'en' not in alts and lang == 'en':
        canonical = re.search(r'<link rel="canonical" href="([^"]+)"', html)
        if canonical:
            alts['en'] = canonical.group(1)
    alts.setdefault('es', NAV['es']['hub'][1])
    return alts


def build_header(lang: str, alts: dict[str, str]) -> str:
    labels = NAV[lang]
    nav_links = [
        labels['home'],
        *COMMON_ITEMS,
        labels['student_pack'],
        labels['services'],
        labels['hub'],
        labels['about'],
        labels['contact'],
    ]
    nav_html = '\n'.join(
        f'          <a href="{href}" class="s2i-kh-header__link">{text}</a>'
        for text, href in nav_links
    )
    lang_items = []
    for code in ('pt', 'en', 'es'):
        item = NAV[code]
        active = ' is-active' if code == lang else ''
        lang_items.append(
            f'              <a href="{alts.get(code, item["hub"][1])}" class="s2i-kh-header__lang-option{active}" hreflang="{code}">{item["lang_label"]} — {item["lang_name"]}</a>'
        )
    lang_html = '\n'.join(lang_items)
    return f'''<header class="s2i-kh-header" id="s2i-header">
      <div class="s2i-kh-header__inner">
        <a href="{labels['home'][1]}" class="s2i-kh-header__brand" aria-label="Share2Inspire">
          <img src="/images/logo-transparent.webp" alt="Share2Inspire">
        </a>
        <nav class="s2i-kh-header__nav" aria-label="Primary navigation">
{nav_html}
        </nav>
        <div class="s2i-kh-header__actions">
          <a href="/area-cliente/" class="s2i-kh-header__login">{labels['login']}</a>
          <div class="s2i-kh-header__lang" data-s2i-lang>
            <button type="button" class="s2i-kh-header__lang-toggle" data-s2i-lang-toggle aria-expanded="false" aria-haspopup="true">
              <span>{labels['lang_label']}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>
            </button>
            <div class="s2i-kh-header__lang-menu" data-s2i-lang-menu hidden>
{lang_html}
            </div>
          </div>
        </div>
        <button type="button" class="s2i-kh-header__menu-toggle" data-s2i-menu-toggle aria-expanded="false" aria-controls="s2i-mobile-menu" aria-label="Toggle navigation">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="s2i-kh-header__mobile" data-s2i-mobile id="s2i-mobile-menu" hidden>
{nav_html}
        <div class="s2i-kh-header__mobile-actions">
          <a href="/area-cliente/" class="s2i-kh-header__login">{labels['login']}</a>
        </div>
      </div>
    </header>'''


updated = []
for path in FILES:
    html = path.read_text(encoding='utf-8')
    if 'sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm font-sans' not in html:
        continue
    lang = language_for(path)
    alts = extract_alternates(html, lang)
    new_header = build_header(lang, alts)
    html, count = HEADER_RE.subn(new_header, html, count=1)
    if count != 1:
        raise RuntimeError(f'Header block not replaced in {path}')
    html = LEGACY_SCRIPT_RE.sub('\n', html)
    if CSS_LINK not in html:
        html = html.replace('</head>', f'    {CSS_LINK}\n</head>')
    if JS_LINK not in html:
        html = html.replace('</body>', f'    {JS_LINK}\n</body>')
    path.write_text(html, encoding='utf-8')
    updated.append(path)

print(f'Updated {len(updated)} files')
for path in updated:
    print(path.relative_to(ROOT))
