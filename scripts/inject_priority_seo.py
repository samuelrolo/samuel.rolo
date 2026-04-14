from __future__ import annotations

import re
from pathlib import Path

SITE_URL = "https://share2inspire.pt"
DEFAULT_OG_IMAGE = f"{SITE_URL}/images/og-share2inspire.png"
ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"

ROOT = Path("/home/ubuntu/samuel_rolo_seo")


def abs_url(path: str) -> str:
    if path == "/":
        return f"{SITE_URL}/"
    return f"{SITE_URL}{path}"


PAGES = {
    "home": {
        "alternates": {"pt": "/", "en": "/en", "es": "/es"},
        "locales": {
            "pt": {
                "title": "Share2Inspire | Plataforma de Inteligência de Carreira com IA",
                "description": "Descobre ferramentas de IA para CV, LinkedIn e estratégia de carreira na Share2Inspire. Avalia o teu perfil e começa hoje a evoluir com clareza.",
                "canonical": "/",
                "files": ["index.html"],
            },
            "en": {
                "title": "Share2Inspire | AI Career Intelligence Platform",
                "description": "Discover AI tools for CV, LinkedIn and career strategy at Share2Inspire. Assess your profile and start moving forward with clarity today.",
                "canonical": "/en",
                "files": ["en/index.html"],
            },
            "es": {
                "title": "Share2Inspire | Plataforma de Inteligencia de Carrera con IA",
                "description": "Descubre herramientas de IA para CV, LinkedIn y estrategia profesional en Share2Inspire. Evalúa tu perfil y empieza hoy a avanzar con claridad.",
                "canonical": "/es",
                "files": ["es/index.html"],
            },
        },
    },
    "cv_analyser": {
        "alternates": {"pt": "/cv-analyser", "en": "/en/cv-analyser", "es": "/es/cv-analyser"},
        "locales": {
            "pt": {
                "title": "CV Analyser | Análise ATS ao CV com IA | Share2Inspire",
                "description": "Analisa o teu CV com IA, melhora o ATS score e percebe porque não estás a ser chamado. Testa o CV Analyser e recebe feedback acionável agora.",
                "canonical": "/cv-analyser",
                "files": ["cv-analyser/index.html"],
            },
            "en": {
                "title": "CV Analyser | AI ATS CV Review | Share2Inspire",
                "description": "Analyse your CV with AI, improve your ATS score and learn why you are not getting interviews. Try CV Analyser and get actionable feedback now.",
                "canonical": "/en/cv-analyser",
                "files": ["en/cv-analyser/index.html"],
            },
            "es": {
                "title": "CV Analyser | Análisis ATS del CV con IA | Share2Inspire",
                "description": "Analiza tu CV con IA, mejora tu ATS score y descubre por qué no consigues entrevistas. Prueba CV Analyser y recibe feedback accionable ahora.",
                "canonical": "/es/cv-analyser",
                "files": ["es/cv-analyser/index.html"],
            },
        },
    },
    "career_path": {
        "alternates": {"pt": "/career-path", "en": "/en/career-path", "es": "/es/career-path"},
        "locales": {
            "pt": {
                "title": "Career Path | Roadmap de Carreira com IA | Share2Inspire",
                "description": "Recebe um roadmap de carreira com IA, funções ideais, gaps e plano 30-60-90. Explora o Career Path e define o teu próximo movimento hoje.",
                "canonical": "/career-path",
                "files": ["career-path/index.html"],
            },
            "en": {
                "title": "Career Path | AI Career Roadmap | Share2Inspire",
                "description": "Get an AI career roadmap with ideal roles, skill gaps and a 30-60-90 plan. Explore Career Path and define your next move today.",
                "canonical": "/en/career-path",
                "files": ["en/career-path/index.html"],
            },
            "es": {
                "title": "Career Path | Roadmap de Carrera con IA | Share2Inspire",
                "description": "Obtén un roadmap de carrera con IA, roles ideales, gaps y plan 30-60-90. Explora Career Path y define hoy tu próximo movimiento.",
                "canonical": "/es/career-path",
                "files": ["es/career-path/index.html"],
            },
        },
    },
    "career_intelligence": {
        "alternates": {"pt": "/career-intelligence", "en": "/en/career-intelligence", "es": "/es/career-intelligence"},
        "locales": {
            "pt": {
                "title": "Career Intelligence | Decisão Estratégica de Carreira com IA | Share2Inspire",
                "description": "Compara caminhos de carreira com IA, analisa trade-offs e recebe uma recomendação final. Experimenta o Career Intelligence e decide com confiança.",
                "canonical": "/career-intelligence",
                "files": ["career-intelligence/index.html"],
            },
            "en": {
                "title": "Career Intelligence | AI Career Decision Support | Share2Inspire",
                "description": "Compare career paths with AI, analyse trade-offs and get a final recommendation. Try Career Intelligence and make decisions with confidence.",
                "canonical": "/en/career-intelligence",
                "files": ["en/career-intelligence/index.html"],
            },
            "es": {
                "title": "Career Intelligence | Decisión Estratégica de Carrera con IA | Share2Inspire",
                "description": "Compara caminos profesionales con IA, analiza trade-offs y recibe una recomendación final. Prueba Career Intelligence y decide con confianza.",
                "canonical": "/es/career-intelligence",
                "files": ["es/career-intelligence/index.html"],
            },
        },
    },
    "linkedin_roaster": {
        "alternates": {"pt": "/linkedin-roaster", "en": "/en/linkedin-roaster", "es": "/es/linkedin-roaster"},
        "locales": {
            "pt": {
                "title": "LinkedIn Roaster | Análise Brutal ao Perfil LinkedIn | Share2Inspire",
                "description": "Recebe feedback direto ao teu perfil LinkedIn, headline, experiência e visibilidade. Testa o LinkedIn Roaster e melhora a tua presença hoje.",
                "canonical": "/linkedin-roaster",
                "files": ["linkedin-roaster/index.html"],
            },
            "en": {
                "title": "LinkedIn Roaster | Brutal LinkedIn Profile Review | Share2Inspire",
                "description": "Get direct feedback on your LinkedIn profile, headline, experience and visibility. Try LinkedIn Roaster and improve your presence today.",
                "canonical": "/en/linkedin-roaster",
                "files": ["en/linkedin-roaster/index.html"],
            },
            "es": {
                "title": "LinkedIn Roaster | Análisis Brutal del Perfil de LinkedIn | Share2Inspire",
                "description": "Recibe feedback directo sobre tu perfil de LinkedIn, titular, experiencia y visibilidad. Prueba LinkedIn Roaster y mejora tu presencia hoy.",
                "canonical": "/es/linkedin-roaster",
                "files": ["es/linkedin-roaster/index.html"],
            },
        },
    },
    "student_pack": {
        "alternates": {"pt": "/estudante", "en": "/en/student-pack", "es": "/es/pack-estudiante"},
        "locales": {
            "pt": {
                "title": "Student Pack | CV Analyser + LinkedIn Roaster | Share2Inspire",
                "description": "Prepara o teu primeiro emprego com o Student Pack: CV Analyser e LinkedIn Roaster num só preço. Começa já a destacar o teu perfil.",
                "canonical": "/estudante",
                "files": ["estudante/index.html", "student-pack/index.html"],
            },
            "en": {
                "title": "Student Pack | CV Analyser + LinkedIn Roaster | Share2Inspire",
                "description": "Prepare for your first job with the Student Pack: CV Analyser and LinkedIn Roaster for one price. Start standing out today.",
                "canonical": "/en/student-pack",
                "files": ["en/student-pack/index.html"],
            },
            "es": {
                "title": "Student Pack | CV Analyser + LinkedIn Roaster | Share2Inspire",
                "description": "Prepárate para tu primer empleo con Student Pack: CV Analyser y LinkedIn Roaster en un solo precio. Empieza hoy a destacar.",
                "canonical": "/es/pack-estudiante",
                "files": ["es/pack-estudiante/index.html", "es/student-pack/index.html"],
            },
        },
    },
    "bundle": {
        "alternates": {"pt": "/bundle", "en": "/en/bundle", "es": "/es/bundle"},
        "locales": {
            "pt": {
                "title": "Bundle | CV Analyser + Career Path com Desconto | Share2Inspire",
                "description": "Junta CV Analyser e Career Path num bundle com desconto para otimizar CV e direção profissional. Descobre a oferta e avança hoje.",
                "canonical": "/bundle",
                "files": ["bundle/index.html"],
            },
            "en": {
                "title": "Bundle | CV Analyser + Career Path Discount | Share2Inspire",
                "description": "Combine CV Analyser and Career Path in one discounted bundle to improve your CV and direction. Explore the offer and move forward today.",
                "canonical": "/en/bundle",
                "files": ["en/bundle/index.html"],
            },
            "es": {
                "title": "Bundle | CV Analyser + Career Path con Descuento | Share2Inspire",
                "description": "Combina CV Analyser y Career Path en un bundle con descuento para mejorar tu CV y dirección profesional. Descubre la oferta y avanza hoy.",
                "canonical": "/es/bundle",
                "files": ["es/bundle/index.html"],
            },
        },
    },
    "services": {
        "alternates": {"pt": "/servicos", "en": "/en/services", "es": "/es/servicios"},
        "locales": {
            "pt": {
                "title": "Serviços | Consultoria de Carreira, CV e LinkedIn | Share2Inspire",
                "description": "Conhece os serviços Share2Inspire para carreira, CV, LinkedIn e sessões estratégicas. Escolhe o apoio certo e agenda a tua próxima evolução.",
                "canonical": "/servicos",
                "files": ["servicos/index.html", "services/index.html"],
            },
            "en": {
                "title": "Services | Career, CV and LinkedIn Consulting | Share2Inspire",
                "description": "Explore Share2Inspire services for career growth, CV, LinkedIn and strategy sessions. Choose the right support and book your next step.",
                "canonical": "/en/services",
                "files": ["en/services/index.html", "en/servicos/index.html", "en/pages/services/index.html"],
            },
            "es": {
                "title": "Servicios | Consultoría de Carrera, CV y LinkedIn | Share2Inspire",
                "description": "Conoce los servicios Share2Inspire para carrera, CV, LinkedIn y sesiones estratégicas. Elige el apoyo adecuado y reserva tu próximo paso.",
                "canonical": "/es/servicios",
                "files": ["es/servicios/index.html", "es/servicos/index.html", "es/services/index.html"],
            },
        },
    },
}


HEAD_BLOCK_RE = re.compile(r"\n\s*<!-- SEO: GENERATED START -->.*?<!-- SEO: GENERATED END -->\n", re.S)


def build_seo_block(*, title: str, description: str, canonical: str, alternates: dict[str, str]) -> str:
    canonical_url = abs_url(canonical)
    pt_url = abs_url(alternates["pt"])
    en_url = abs_url(alternates["en"])
    es_url = abs_url(alternates["es"])
    return (
        "\n    <!-- SEO: GENERATED START -->\n"
        f"    <meta name=\"description\" content=\"{description}\" />\n"
        f"    <meta name=\"robots\" content=\"{ROBOTS}\" />\n"
        f"    <link rel=\"canonical\" href=\"{canonical_url}\" />\n"
        f"    <link rel=\"alternate\" hreflang=\"pt\" href=\"{pt_url}\" />\n"
        f"    <link rel=\"alternate\" hreflang=\"en\" href=\"{en_url}\" />\n"
        f"    <link rel=\"alternate\" hreflang=\"es\" href=\"{es_url}\" />\n"
        f"    <link rel=\"alternate\" hreflang=\"x-default\" href=\"{pt_url}\" />\n"
        f"    <meta property=\"og:title\" content=\"{title}\" />\n"
        f"    <meta property=\"og:description\" content=\"{description}\" />\n"
        f"    <meta property=\"og:image\" content=\"{DEFAULT_OG_IMAGE}\" />\n"
        f"    <meta property=\"og:url\" content=\"{canonical_url}\" />\n"
        "    <meta property=\"og:type\" content=\"website\" />\n"
        "    <meta property=\"og:site_name\" content=\"Share2Inspire\" />\n"
        "    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n"
        f"    <meta name=\"twitter:title\" content=\"{title}\" />\n"
        f"    <meta name=\"twitter:description\" content=\"{description}\" />\n"
        f"    <meta name=\"twitter:image\" content=\"{DEFAULT_OG_IMAGE}\" />\n"
        f"    <meta name=\"twitter:url\" content=\"{canonical_url}\" />\n"
        "    <!-- SEO: GENERATED END -->\n"
    )


def clean_existing_seo(head_html: str) -> str:
    patterns = [
        r"\s*<meta name=\"description\"[^>]*>\n?",
        r"\s*<meta name=\"robots\"[^>]*>\n?",
        r"\s*<meta property=\"og:[^\"]+\"[^>]*>\n?",
        r"\s*<meta name=\"twitter:[^\"]+\"[^>]*>\n?",
        r"\s*<link rel=\"canonical\"[^>]*>\n?",
        r"\s*<link rel=\"alternate\" hreflang=\"[^\"]+\"[^>]*>\n?",
    ]
    cleaned = HEAD_BLOCK_RE.sub("\n", head_html)
    for pattern in patterns:
        cleaned = re.sub(pattern, "\n", cleaned)
    return cleaned


def inject_into_file(file_path: Path, *, lang: str, title: str, description: str, canonical: str, alternates: dict[str, str]) -> None:
    html = file_path.read_text(encoding="utf-8")
    html = re.sub(r"<html lang=\"[^\"]+\">", f'<html lang="{lang}">', html, count=1)
    html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html, count=1, flags=re.S)

    head_match = re.search(r"<head>(.*?)</head>", html, flags=re.S)
    if not head_match:
        raise ValueError(f"No <head> found in {file_path}")

    head_inner = head_match.group(1)
    head_inner = clean_existing_seo(head_inner)
    seo_block = build_seo_block(title=title, description=description, canonical=canonical, alternates=alternates)

    viewport_pattern = re.compile(r"(<meta\s+name=\"viewport\".*?/>)", re.S)
    if viewport_pattern.search(head_inner):
        head_inner = viewport_pattern.sub(rf"\1{seo_block}", head_inner, count=1)
    else:
        head_inner = f"\n{seo_block}{head_inner}"

    html = html[: head_match.start(1)] + head_inner + html[head_match.end(1) :]
    file_path.write_text(html, encoding="utf-8")


for page in PAGES.values():
    alternates = page["alternates"]
    for lang, locale_data in page["locales"].items():
        for rel_file in locale_data["files"]:
            target = ROOT / rel_file
            if target.exists():
                inject_into_file(
                    target,
                    lang=lang,
                    title=locale_data["title"],
                    description=locale_data["description"],
                    canonical=locale_data["canonical"],
                    alternates=alternates,
                )

print("Priority SEO metadata injected into published HTML files.")
