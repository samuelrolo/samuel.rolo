from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path('/home/ubuntu/samuel_rolo_seo')
START_DIR = ROOT / 'es' / 'blog'


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != 'a':
            return
        for key, value in attrs:
            if key.lower() == 'href' and value:
                self.hrefs.append(value.strip())


def resolve_local_target(current_file: Path, href: str) -> Path | None:
    if not href or href.startswith(('#', 'mailto:', 'tel:', 'javascript:')):
        return None

    parsed = urlparse(href)
    if parsed.scheme in {'http', 'https'}:
        if parsed.netloc not in {'share2inspire.pt', 'www.share2inspire.pt'}:
            return None
        path = parsed.path or '/'
    else:
        path = parsed.path or href

    if not path.startswith('/'):
        path = str((current_file.parent / path).resolve().relative_to(ROOT.resolve()))
        if not path.startswith('/'):
            path = '/' + path.replace('\\', '/')

    candidate = ROOT / path.lstrip('/')

    if candidate.is_dir():
        index_file = candidate / 'index.html'
        if index_file.exists():
            return index_file

    if candidate.exists() and candidate.is_file():
        return candidate

    if candidate.suffix == '':
        for alt in [candidate / 'index.html', candidate.with_suffix('.html')]:
            if alt.exists():
                return alt

    return candidate


results: list[tuple[str, str, str]] = []

for html_file in sorted(START_DIR.rglob('*.html')):
    parser = LinkParser()
    parser.feed(html_file.read_text(encoding='utf-8', errors='ignore'))
    seen: set[str] = set()
    for href in parser.hrefs:
        if href in seen:
            continue
        seen.add(href)
        target = resolve_local_target(html_file, href)
        if target is None:
            continue
        if not target.exists():
            results.append((str(html_file.relative_to(ROOT)), href, str(target.relative_to(ROOT))))

for source, href, target in results:
    print(f'{source}\t{href}\t{target}')

print(f'BROKEN_COUNT\t{len(results)}')
