#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Doctype, NavigableString, Tag
from openai import OpenAI

BASE_URL = "https://www.share2inspire.pt"
REPO_ROOT = Path("/home/ubuntu/samuel.rolo")
PAGES = [
    "politica-privacidade",
    "politica-cookies",
    "termos-condicoes",
    "tratamento-dados",
    "informacao-legal",
]

PATH_MAP = {
    "/": {"en": "/en", "es": "/es"},
    "/cv-analyser": {"en": "/en/cv-analyser", "es": "/es/cv-analyser"},
    "/career-path": {"en": "/en/career-path", "es": "/es/career-path"},
    "/career-intelligence": {"en": "/en/career-intelligence", "es": "/es/career-intelligence"},
    "/linkedin-roaster": {"en": "/en/linkedin-roaster", "es": "/es/linkedin-roaster"},
    "/bundle": {"en": "/en/bundle", "es": "/es/bundle"},
    "/estudante": {"en": "/en/student-pack", "es": "/es/student-pack"},
    "/conhecimento": {"en": "/en/pages/knowledge", "es": "/es/pages/knowledge"},
    "/servicos": {"en": "/en/pages/services", "es": "/es/pages/services"},
    "/sobre": {"en": "/en/about", "es": "/es/sobre"},
    "/contactos": {"en": "/en/contact", "es": "/es/contacto"},
    "/area-cliente": {"en": "/area-cliente/?lang=en", "es": "/area-cliente/?lang=es"},
}

PAGE_META = {
    "politica-privacidade": {
        "en": {
            "title": "Privacy Policy | Share2Inspire | Samuel Rolo",
            "og_title": "Privacy Policy | Share2Inspire",
            "description": "Read Share2Inspire's privacy policy and learn how we protect your personal data.",
        },
        "es": {
            "title": "Política de Privacidad | Share2Inspire | Samuel Rolo",
            "og_title": "Política de Privacidad | Share2Inspire",
            "description": "Consulta la política de privacidad de Share2Inspire y descubre cómo protegemos tus datos personales.",
        },
    },
    "politica-cookies": {
        "en": {
            "title": "Cookie Policy | Share2Inspire | Samuel Rolo",
            "og_title": "Cookie Policy | Share2Inspire",
            "description": "Learn how Share2Inspire uses cookies and similar technologies on its website.",
        },
        "es": {
            "title": "Política de Cookies | Share2Inspire | Samuel Rolo",
            "og_title": "Política de Cookies | Share2Inspire",
            "description": "Descubre cómo Share2Inspire utiliza cookies y tecnologías similares en su sitio web.",
        },
    },
    "termos-condicoes": {
        "en": {
            "title": "Terms & Conditions | Share2Inspire | Samuel Rolo",
            "og_title": "Terms & Conditions | Share2Inspire",
            "description": "Read Share2Inspire's terms and conditions for using the website, tools, and services.",
        },
        "es": {
            "title": "Términos y Condiciones | Share2Inspire | Samuel Rolo",
            "og_title": "Términos y Condiciones | Share2Inspire",
            "description": "Consulta los términos y condiciones de Share2Inspire para el uso del sitio web, las herramientas y los servicios.",
        },
    },
    "tratamento-dados": {
        "en": {
            "title": "Data Processing | Share2Inspire | Samuel Rolo",
            "og_title": "Data Processing | Share2Inspire",
            "description": "Information on Share2Inspire's processing of personal data in accordance with the GDPR.",
        },
        "es": {
            "title": "Tratamiento de Datos | Share2Inspire | Samuel Rolo",
            "og_title": "Tratamiento de Datos | Share2Inspire",
            "description": "Información sobre el tratamiento de datos personales por parte de Share2Inspire de conformidad con el RGPD.",
        },
    },
    "informacao-legal": {
        "en": {
            "title": "Legal Information | Share2Inspire | Samuel Rolo",
            "og_title": "Legal Information | Share2Inspire",
            "description": "Legal information about Share2Inspire, including company and website details.",
        },
        "es": {
            "title": "Información Legal | Share2Inspire | Samuel Rolo",
            "og_title": "Información Legal | Share2Inspire",
            "description": "Información legal sobre Share2Inspire, incluidos los datos de la empresa y del sitio web.",
        },
    },
}

TEXT_MAP = {
    "en": {
        "Início": "Home",
        "Pack Estudante": "Student Pack",
        "Serviços": "Services",
        "Sobre": "About",
        "Contactos": "Contact",
        "Navegação": "Navigation",
        "Ferramentas": "Tools",
        "Privacidade": "Privacy Policy",
        "Informação Legal": "Legal Information",
        "Termos e Condições": "Terms & Conditions",
        "Tratamento de Dados": "Data Processing",
        "Contacto": "Contact",
        "Todos os direitos reservados.": "All rights reserved.",
        "Partilhar conhecimento, Inspirar Carreiras.": "Sharing knowledge, inspiring careers.",
    },
    "es": {
        "Início": "Inicio",
        "Pack Estudante": "Paquete Estudiante",
        "Serviços": "Servicios",
        "Sobre": "Sobre",
        "Contactos": "Contacto",
        "Navegação": "Navegación",
        "Ferramentas": "Herramientas",
        "Privacidade": "Privacidad",
        "Informação Legal": "Información Legal",
        "Termos e Condições": "Términos y Condiciones",
        "Tratamento de Dados": "Tratamiento de Datos",
        "Contacto": "Contacto",
        "Todos os direitos reservados.": "Todos los derechos reservados.",
        "Partilhar conhecimento, Inspirar Carreiras.": "Compartiendo conocimiento, inspirando carreras.",
    },
}

LANG_OPTION_TEXT = {
    "pt": "PT — Português",
    "en": "EN — English",
    "es": "ES — Español",
}



def locale_path(pt_path: str, lang: str) -> str:
    if not pt_path:
        pt_path = "/"
    if pt_path.endswith("/index.html"):
        pt_path = pt_path[:-11] or "/"
    if pt_path.endswith("/") and pt_path != "/":
        pt_path = pt_path[:-1]
    if not pt_path.startswith("/"):
        pt_path = f"/{pt_path}"
    if lang == "pt":
        return pt_path
    return PATH_MAP.get(pt_path, {}).get(lang, f"/{lang}{pt_path}")


def localize_anchor_href(href: str, lang: str) -> str:
    if not href:
        return href
    if href.startswith("mailto:") or href.startswith("tel:") or href.startswith("javascript:"):
        return href
    if href.startswith("#"):
        return href
    if href.startswith("http") and "share2inspire.pt" not in href:
        return href

    if href.startswith(BASE_URL):
        path = href[len(BASE_URL):] or "/"
        return BASE_URL + locale_path(path, lang)

    if href.startswith("/"):
        return locale_path(href, lang)

    return href


def replace_preserving_whitespace(original: str, replacement: str) -> str:
    stripped = original.strip()
    if not stripped:
        return original
    if original == stripped:
        return replacement
    start = original.find(stripped)
    end = start + len(stripped)
    return original[:start] + replacement + original[end:]


def translate_exact_text_nodes(soup: BeautifulSoup, lang: str) -> None:
    mapping = TEXT_MAP[lang]
    for node in soup.find_all(string=True):
        if not isinstance(node, NavigableString):
            continue
        parent = node.parent
        if not parent or parent.name in {"script", "style"}:
            continue
        stripped = str(node).strip()
        if stripped in mapping:
            node.replace_with(replace_preserving_whitespace(str(node), mapping[stripped]))


def update_metadata(soup: BeautifulSoup, slug: str, lang: str) -> None:
    meta = PAGE_META[slug][lang]
    localized_url = BASE_URL + locale_path(f"/{slug}", lang)

    if soup.html:
        soup.html["lang"] = lang

    if soup.title:
        soup.title.string = meta["title"]

    def set_meta(selector_attr: str, selector_value: str, content: str) -> None:
        tag = soup.find("meta", attrs={selector_attr: selector_value})
        if tag:
            tag["content"] = content

    set_meta("name", "description", meta["description"])
    set_meta("property", "og:title", meta["og_title"])
    set_meta("property", "og:description", meta["description"])
    set_meta("property", "og:url", localized_url)
    set_meta("name", "twitter:title", meta["og_title"])
    set_meta("name", "twitter:description", meta["description"])

    canonical = soup.find("link", rel=lambda v: v and "canonical" in v)
    if canonical:
        canonical["href"] = localized_url
    else:
        tag = soup.new_tag("link", rel="canonical", href=localized_url)
        if soup.head:
            soup.head.append(tag)

    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text(strip=True)
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if isinstance(data, dict):
            data["name"] = meta["og_title"]
            data["description"] = meta["description"]
            data["url"] = localized_url
            script.string = json.dumps(data, ensure_ascii=False, indent=2)
            break


def update_navigation_and_footer(soup: BeautifulSoup, slug: str, lang: str) -> None:
    for a in soup.find_all("a", href=True):
        a["href"] = localize_anchor_href(a["href"], lang)
        if a.has_attr("onclick") and "setLang" in a.get("onclick", ""):
            del a["onclick"]

    # Fix language dropdown to link directly to static legal pages in each locale.
    current_paths = {
        "pt": f"/{slug}",
        "en": f"/en/{slug}",
        "es": f"/es/{slug}",
    }
    label = soup.select_one("#langLabel")
    if label:
        label.string = lang.upper()
    for a in soup.select("#langMenu a.lang-opt"):
        option_lang = a.get("data-lang")
        if option_lang in current_paths:
            a["href"] = current_paths[option_lang]
            if a.has_attr("onclick"):
                del a["onclick"]
            base_classes = "lang-opt flex items-center gap-2 px-3 py-1.5 text-[12px]"
            if option_lang == lang:
                a["class"] = (base_classes + " text-[#C9A961] font-medium bg-[#C9A961]/5").split()
            else:
                a["class"] = (base_classes + " text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors").split()
            a.string = LANG_OPTION_TEXT[option_lang]


def parse_replacement_tag(fragment_html: str) -> Tag | None:
    fragment_soup = BeautifulSoup(fragment_html, "html.parser")
    for child in fragment_soup.contents:
        if isinstance(child, Tag):
            return child
    return None


def translate_fragment(client: OpenAI, html_fragment: str, lang: str) -> str:
    target_language = {"en": "English", "es": "Spanish"}[lang]
    prompt = (
        f"Translate the following HTML fragment from European Portuguese to {target_language}. "
        "Preserve the exact HTML structure, tags, attributes, classes, inline styles, links, tables, lists, and emphasis. "
        "Translate only human-readable text and accessibility text such as alt text, aria-labels, and titles if present. "
        "Do not add comments, markdown fences, or explanations. Return only the translated HTML fragment."
    )
    response = client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt + "\n\n" + html_fragment}
                ],
            }
        ],
    )
    return response.output_text.strip()


def translate_main_fragments(soup: BeautifulSoup, lang: str, client: OpenAI) -> None:
    if not soup.body:
        return
    top_level_sections = [child for child in soup.body.children if isinstance(child, Tag) and child.name == "section"]
    for node in top_level_sections:
        translated = translate_fragment(client, str(node), lang)
        replacement = parse_replacement_tag(translated)
        if replacement is not None:
            node.replace_with(replacement)


def write_html(path: Path, soup: BeautifulSoup) -> None:
    output = soup.decode(formatter=None)
    if "<!DOCTYPE" not in output[:100].upper():
        output = "<!DOCTYPE html>\n" + output
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(output, encoding="utf-8")


def build_page(slug: str, lang: str, client: OpenAI) -> None:
    source_path = REPO_ROOT / slug / "index.html"
    target_path = REPO_ROOT / lang / slug / "index.html"
    html = source_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    update_metadata(soup, slug, lang)
    translate_main_fragments(soup, lang, client)
    translate_exact_text_nodes(soup, lang)
    update_navigation_and_footer(soup, slug, lang)
    write_html(target_path, soup)
    print(f"Generated {target_path}")


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in {"en", "es"}:
        print("Usage: localize_legal_pages.py [en|es]", file=sys.stderr)
        return 1
    lang = sys.argv[1]
    client = OpenAI()
    for slug in PAGES:
        build_page(slug, lang, client)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
