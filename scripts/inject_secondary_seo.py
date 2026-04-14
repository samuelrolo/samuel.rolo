from __future__ import annotations

import re
from pathlib import Path

SITE_URL = "https://share2inspire.pt"
DEFAULT_OG_IMAGE = f"{SITE_URL}/images/og-share2inspire.png"
ROOT = Path("/home/ubuntu/samuel_rolo_seo")


def abs_url(path: str) -> str:
    if path == "/":
        return f"{SITE_URL}/"
    return f"{SITE_URL}{path}"


PAGES = {
    "knowledge": {
        "alternates": {"pt": "/conhecimento", "en": "/en/knowledge", "es": "/es/conocimiento"},
        "locales": {
            "pt": {
                "title": "Conhecimento | Guias de Carreira, CV e LinkedIn | Share2Inspire",
                "description": "Explora guias, insights e recursos sobre carreira, CV, LinkedIn e recrutamento. Aprende com a Share2Inspire e aplica melhorias práticas.",
                "canonical": "/conhecimento",
                "files": ["conhecimento/index.html", "knowledge/index.html"],
            },
            "en": {
                "title": "Knowledge Hub | Career, CV and LinkedIn Guides | Share2Inspire",
                "description": "Explore guides, insights and resources on career growth, CV, LinkedIn and hiring. Learn with Share2Inspire and apply practical improvements.",
                "canonical": "/en/knowledge",
                "files": ["en/knowledge/index.html", "en/conhecimento/index.html", "en/pages/knowledge/index.html"],
            },
            "es": {
                "title": "Conocimiento | Guías de Carrera, CV y LinkedIn | Share2Inspire",
                "description": "Explora guías, insights y recursos sobre carrera, CV, LinkedIn y reclutamiento. Aprende con Share2Inspire y aplica mejoras prácticas.",
                "canonical": "/es/conocimiento",
                "files": ["es/conocimiento/index.html", "es/conhecimento/index.html", "es/knowledge/index.html", "es/pages/knowledge/index.html"],
            },
        },
    },
    "about": {
        "alternates": {"pt": "/sobre", "en": "/en/about", "es": "/es/sobre"},
        "locales": {
            "pt": {
                "title": "Sobre | Samuel Rolo e a missão Share2Inspire | Share2Inspire",
                "description": "Conhece Samuel Rolo, a visão da Share2Inspire e a experiência por trás da plataforma. Descobre a missão e entra em contacto connosco.",
                "canonical": "/sobre",
                "files": ["sobre/index.html", "about/index.html"],
            },
            "en": {
                "title": "About | Samuel Rolo and the Share2Inspire Mission | Share2Inspire",
                "description": "Meet Samuel Rolo, the Share2Inspire vision and the experience behind the platform. Discover the mission and get in touch with us.",
                "canonical": "/en/about",
                "files": ["en/about/index.html", "en/sobre/index.html"],
            },
            "es": {
                "title": "Sobre | Samuel Rolo y la misión de Share2Inspire | Share2Inspire",
                "description": "Conoce a Samuel Rolo, la visión de Share2Inspire y la experiencia detrás de la plataforma. Descubre la misión y contacta con nosotros.",
                "canonical": "/es/sobre",
                "files": ["es/sobre/index.html"],
            },
        },
    },
    "contact": {
        "alternates": {"pt": "/contactos", "en": "/en/contact", "es": "/es/contacto"},
        "locales": {
            "pt": {
                "title": "Contactos | Fala com a Share2Inspire | Share2Inspire",
                "description": "Entra em contacto com a Share2Inspire para dúvidas, parcerias ou apoio na tua carreira. Envia a tua mensagem e fala connosco hoje.",
                "canonical": "/contactos",
                "files": ["contactos/index.html", "contact/index.html", "contacto/index.html"],
            },
            "en": {
                "title": "Contact | Talk to Share2Inspire | Share2Inspire",
                "description": "Contact Share2Inspire for questions, partnerships or career support. Send your message and speak with us today.",
                "canonical": "/en/contact",
                "files": ["en/contact/index.html", "en/contactos/index.html"],
            },
            "es": {
                "title": "Contacto | Habla con Share2Inspire | Share2Inspire",
                "description": "Contacta con Share2Inspire para dudas, colaboraciones o apoyo profesional. Envía tu mensaje y habla con nosotros hoy.",
                "canonical": "/es/contacto",
                "files": ["es/contacto/index.html", "es/contactos/index.html"],
            },
        },
    },
    "privacy": {
        "alternates": {"pt": "/politica-privacidade", "en": "/en/privacy-policy", "es": "/es/politica-privacidad"},
        "locales": {
            "pt": {
                "title": "Política de Privacidade | Share2Inspire",
                "description": "Consulta a política de privacidade da Share2Inspire e compreende como tratamos dados pessoais, finalidades, bases legais e direitos dos titulares.",
                "canonical": "/politica-privacidade",
                "files": ["politica-privacidade/index.html"],
            },
            "en": {
                "title": "Privacy Policy | Share2Inspire",
                "description": "Review the Share2Inspire privacy policy and understand how we process personal data, legal bases, purposes and data subject rights.",
                "canonical": "/en/privacy-policy",
                "files": ["en/privacy-policy/index.html", "en/politica-privacidade/index.html", "en/pages/privacy-policy/index.html"],
            },
            "es": {
                "title": "Política de Privacidad | Share2Inspire",
                "description": "Consulta la política de privacidad de Share2Inspire y entiende cómo tratamos los datos personales, las bases legales, las finalidades y los derechos de los titulares.",
                "canonical": "/es/politica-privacidad",
                "files": ["es/politica-privacidad/index.html", "es/privacy-policy/index.html"],
            },
        },
    },
    "cookies": {
        "alternates": {"pt": "/politica-cookies", "en": "/en/cookie-policy", "es": "/es/politica-cookies"},
        "locales": {
            "pt": {
                "title": "Política de Cookies | Share2Inspire",
                "description": "Conhece os tipos de cookies e tecnologias semelhantes utilizados pela Share2Inspire, as respetivas finalidades e as opções de gestão disponíveis.",
                "canonical": "/politica-cookies",
                "files": ["politica-cookies/index.html"],
            },
            "en": {
                "title": "Cookie Policy | Share2Inspire",
                "description": "Learn about the cookie categories and similar technologies used by Share2Inspire, their purposes and the available management options.",
                "canonical": "/en/cookie-policy",
                "files": ["en/cookie-policy/index.html", "en/politica-cookies/index.html"],
            },
            "es": {
                "title": "Política de Cookies | Share2Inspire",
                "description": "Conoce las categorías de cookies y tecnologías similares utilizadas por Share2Inspire, sus finalidades y las opciones de gestión disponibles.",
                "canonical": "/es/politica-cookies",
                "files": ["es/politica-cookies/index.html"],
            },
        },
    },
    "legal_information": {
        "alternates": {"pt": "/informacao-legal", "en": "/en/legal-information", "es": "/es/informacion-legal"},
        "locales": {
            "pt": {
                "title": "Informação Legal | Share2Inspire",
                "description": "Acede à informação legal essencial sobre a Share2Inspire, identificação da entidade, contacto, propriedade intelectual e utilização do website.",
                "canonical": "/informacao-legal",
                "files": ["informacao-legal/index.html"],
            },
            "en": {
                "title": "Legal Information | Share2Inspire",
                "description": "Access key legal information about Share2Inspire, including entity identification, contact details, intellectual property and website use.",
                "canonical": "/en/legal-information",
                "files": ["en/legal-information/index.html", "en/informacao-legal/index.html"],
            },
            "es": {
                "title": "Información Legal | Share2Inspire",
                "description": "Accede a la información legal esencial sobre Share2Inspire, incluida la identificación de la entidad, el contacto, la propiedad intelectual y el uso del sitio web.",
                "canonical": "/es/informacion-legal",
                "files": ["es/informacion-legal/index.html", "es/informacao-legal/index.html"],
            },
        },
    },
    "terms": {
        "alternates": {"pt": "/termos-condicoes", "en": "/en/terms-and-conditions", "es": "/es/terminos-condiciones"},
        "locales": {
            "pt": {
                "title": "Termos e Condições | Share2Inspire",
                "description": "Consulta os termos e condições da Share2Inspire para compreender o âmbito dos serviços, regras de utilização, pagamentos e limitações aplicáveis.",
                "canonical": "/termos-condicoes",
                "files": ["termos-condicoes/index.html"],
            },
            "en": {
                "title": "Terms & Conditions | Share2Inspire",
                "description": "Review the Share2Inspire terms and conditions to understand service scope, usage rules, payments and applicable limitations.",
                "canonical": "/en/terms-and-conditions",
                "files": ["en/terms-and-conditions/index.html", "en/termos-condicoes/index.html"],
            },
            "es": {
                "title": "Términos y Condiciones | Share2Inspire",
                "description": "Consulta los términos y condiciones de Share2Inspire para entender el alcance de los servicios, las reglas de uso, los pagos y las limitaciones aplicables.",
                "canonical": "/es/terminos-condiciones",
                "files": ["es/terminos-condiciones/index.html", "es/termos-condicoes/index.html"],
            },
        },
    },
    "data_processing": {
        "alternates": {"pt": "/tratamento-dados", "en": "/en/data-processing", "es": "/es/tratamiento-datos"},
        "locales": {
            "pt": {
                "title": "Tratamento de Dados | Share2Inspire",
                "description": "Conhece os princípios de tratamento de dados aplicados pela Share2Inspire, categorias de informação tratada, retenção e medidas de proteção.",
                "canonical": "/tratamento-dados",
                "files": ["tratamento-dados/index.html"],
            },
            "en": {
                "title": "Data Processing | Share2Inspire",
                "description": "Understand the data processing principles applied by Share2Inspire, including data categories, retention and protection measures.",
                "canonical": "/en/data-processing",
                "files": ["en/data-processing/index.html", "en/tratamento-dados/index.html"],
            },
            "es": {
                "title": "Tratamiento de Datos | Share2Inspire",
                "description": "Conoce los principios de tratamiento de datos aplicados por Share2Inspire, incluidas las categorías de datos, la conservación y las medidas de protección.",
                "canonical": "/es/tratamiento-datos",
                "files": ["es/tratamiento-datos/index.html", "es/tratamento-dados/index.html"],
            },
        },
    },
    "blog_index": {
        "alternates": {"pt": "/blog", "en": "/en/blog", "es": "/es/blog"},
        "locales": {
            "pt": {
                "title": "Blog | Artigos sobre Carreira e Emprego | Share2Inspire",
                "description": "Artigos sobre carreira, emprego, CV, LinkedIn e mercado de trabalho. Dicas práticas para profissionais em Portugal e no mundo.",
                "canonical": "/blog",
                "files": ["blog/index.html"],
            },
            "en": {
                "title": "Blog | Career and Employment Articles | Share2Inspire",
                "description": "Articles on careers, job search, CV, LinkedIn and the labour market. Practical insights for professionals in Portugal and beyond.",
                "canonical": "/en/blog",
                "files": ["en/blog/index.html"],
            },
            "es": {
                "title": "Blog | Artículos sobre Carrera y Empleo | Share2Inspire",
                "description": "Artículos sobre carrera, empleo, CV, LinkedIn y mercado laboral. Consejos prácticos para profesionales en Portugal y en otros mercados.",
                "canonical": "/es/blog",
                "files": ["es/blog/index.html"],
            },
        },
    },
    "cv_results": {
        "alternates": {"pt": "/cv-analyser", "en": "/en/cv-analyser", "es": "/es/cv-analyser"},
        "robots": "noindex, nofollow, noarchive",
        "locales": {
            "pt": {
                "title": "Resultados CV Analyser | Relatório de CV com IA | Share2Inspire",
                "description": "Consulta o teu relatório personalizado do CV Analyser com insights ATS, pontos fortes e melhorias prioritárias para o teu próximo passo profissional.",
                "canonical": "/cv-analyser",
                "files": ["cv-analyser/results/index.html"],
            },
            "en": {
                "title": "CV Analyser Results | AI CV Report | Share2Inspire",
                "description": "Review your personalised CV Analyser report with ATS insights, strengths and priority improvements for your next professional step.",
                "canonical": "/en/cv-analyser",
                "files": ["en/cv-analyser/results/index.html"],
            },
            "es": {
                "title": "Resultados CV Analyser | Informe de CV con IA | Share2Inspire",
                "description": "Consulta tu informe personalizado de CV Analyser con insights ATS, fortalezas y mejoras prioritarias para tu próximo paso profesional.",
                "canonical": "/es/cv-analyser",
                "files": ["es/cv-analyser/results/index.html"],
            },
        },
    },
    "career_path_results": {
        "alternates": {"pt": "/career-path", "en": "/en/career-path", "es": "/es/career-path"},
        "robots": "noindex, nofollow, noarchive",
        "locales": {
            "pt": {
                "title": "Resultados Career Path | Roadmap Personalizado | Share2Inspire",
                "description": "Consulta o teu roadmap personalizado com funções-alvo, gaps críticos e plano de ação. Revê os resultados do Career Path sempre que precisares.",
                "canonical": "/career-path",
                "files": ["career-path/results/index.html"],
            },
            "en": {
                "title": "Career Path Results | Personalised Roadmap | Share2Inspire",
                "description": "Review your personalised roadmap with target roles, critical gaps and an action plan. Revisit your Career Path results whenever needed.",
                "canonical": "/en/career-path",
                "files": ["en/career-path/results/index.html"],
            },
            "es": {
                "title": "Resultados Career Path | Roadmap Personalizado | Share2Inspire",
                "description": "Consulta tu roadmap personalizado con roles objetivo, gaps críticos y plan de acción. Revisa tus resultados de Career Path cuando lo necesites.",
                "canonical": "/es/career-path",
                "files": ["es/career-path/results/index.html"],
            },
        },
    },
    "career_path_example": {
        "alternates": {"pt": "/career-path", "en": "/en/career-path", "es": "/es/career-path"},
        "robots": "noindex, nofollow, noarchive",
        "locales": {
            "pt": {
                "title": "Exemplo Career Path | Roadmap de Exemplo | Share2Inspire",
                "description": "Exemplo interno de roadmap Career Path para demonstração da estrutura de resultados da Share2Inspire.",
                "canonical": "/career-path",
                "files": ["career-path/example/index.html"],
            },
            "en": {
                "title": "Career Path Example | Sample Roadmap | Share2Inspire",
                "description": "Internal Career Path sample roadmap used to demonstrate the Share2Inspire result structure.",
                "canonical": "/en/career-path",
                "files": ["en/career-path/example/index.html"],
            },
            "es": {
                "title": "Ejemplo Career Path | Roadmap de Muestra | Share2Inspire",
                "description": "Roadmap de ejemplo interno de Career Path utilizado para mostrar la estructura de resultados de Share2Inspire.",
                "canonical": "/es/career-path",
                "files": ["es/career-path/example/index.html"],
            },
        },
    },
    "career_intelligence_results": {
        "alternates": {"pt": "/career-intelligence", "en": "/en/career-intelligence", "es": "/es/career-intelligence"},
        "robots": "noindex, nofollow, noarchive",
        "locales": {
            "pt": {
                "title": "Resultados Career Intelligence | Recomendação Final | Share2Inspire",
                "description": "Revê a tua recomendação final com cenários comparados, riscos e oportunidades. Acede aos resultados do Career Intelligence quando quiseres.",
                "canonical": "/career-intelligence",
                "files": ["career-intelligence/results/index.html"],
            },
            "en": {
                "title": "Career Intelligence Results | Final Recommendation | Share2Inspire",
                "description": "Review your final recommendation with compared scenarios, risks and opportunities. Access your Career Intelligence results whenever needed.",
                "canonical": "/en/career-intelligence",
                "files": ["en/career-intelligence/results/index.html"],
            },
            "es": {
                "title": "Resultados Career Intelligence | Recomendación Final | Share2Inspire",
                "description": "Revisa tu recomendación final con escenarios comparados, riesgos y oportunidades. Accede a tus resultados de Career Intelligence cuando quieras.",
                "canonical": "/es/career-intelligence",
                "files": ["es/career-intelligence/results/index.html"],
            },
        },
    },
    "linkedin_roaster_results": {
        "alternates": {"pt": "/linkedin-roaster", "en": "/en/linkedin-roaster", "es": "/es/linkedin-roaster"},
        "robots": "noindex, nofollow, noarchive",
        "locales": {
            "pt": {
                "title": "Resultados LinkedIn Roaster | Relatório do Perfil | Share2Inspire",
                "description": "Consulta o relatório do teu perfil LinkedIn com pontos fortes, falhas críticas e recomendações práticas para aumentar a visibilidade profissional.",
                "canonical": "/linkedin-roaster",
                "files": ["linkedin-roaster/results/index.html"],
            },
            "en": {
                "title": "LinkedIn Roaster Results | Profile Report | Share2Inspire",
                "description": "Review your LinkedIn profile report with strengths, critical gaps and practical recommendations to increase professional visibility.",
                "canonical": "/en/linkedin-roaster",
                "files": ["en/linkedin-roaster/results/index.html"],
            },
            "es": {
                "title": "Resultados LinkedIn Roaster | Informe del Perfil | Share2Inspire",
                "description": "Consulta tu informe de LinkedIn con fortalezas, fallos críticos y recomendaciones prácticas para aumentar tu visibilidad profesional.",
                "canonical": "/es/linkedin-roaster",
                "files": ["es/linkedin-roaster/results/index.html"],
            },
        },
    },
    "student_pack_results": {
        "alternates": {"pt": "/estudante", "en": "/en/student-pack", "es": "/es/pack-estudiante"},
        "robots": "noindex, nofollow, noarchive",
        "locales": {
            "pt": {
                "title": "Resultados Student Pack | Diagnóstico de CV e LinkedIn | Share2Inspire",
                "description": "Acede ao teu diagnóstico combinado de CV e LinkedIn com melhorias prioritárias para estágio ou primeiro emprego. Revê os resultados aqui.",
                "canonical": "/estudante",
                "files": ["estudante/results/index.html", "student-pack/results/index.html"],
            },
            "en": {
                "title": "Student Pack Results | CV and LinkedIn Review | Share2Inspire",
                "description": "Access your combined CV and LinkedIn review with priority improvements for internships or a first job. Revisit your results here.",
                "canonical": "/en/student-pack",
                "files": ["en/student-pack/results/index.html"],
            },
            "es": {
                "title": "Resultados Student Pack | Diagnóstico de CV y LinkedIn | Share2Inspire",
                "description": "Accede a tu diagnóstico combinado de CV y LinkedIn con mejoras prioritarias para prácticas o primer empleo. Revisa tus resultados aquí.",
                "canonical": "/es/pack-estudiante",
                "files": ["es/pack-estudiante/results/index.html", "es/student-pack/results/index.html"],
            },
        },
    },
    "bundle_results": {
        "alternates": {"pt": "/bundle", "en": "/en/bundle", "es": "/es/bundle"},
        "robots": "noindex, nofollow, noarchive",
        "locales": {
            "pt": {
                "title": "Resultados Bundle | Diagnóstico Combinado | Share2Inspire",
                "description": "Área interna de resultados do Bundle da Share2Inspire com recomendações combinadas para CV e direção de carreira.",
                "canonical": "/bundle",
                "files": ["bundle/results/index.html"],
            },
            "en": {
                "title": "Bundle Results | Combined Assessment | Share2Inspire",
                "description": "Internal Share2Inspire Bundle results area with combined recommendations for CV and career direction.",
                "canonical": "/en/bundle",
                "files": ["en/bundle/results/index.html"],
            },
            "es": {
                "title": "Resultados Bundle | Diagnóstico Combinado | Share2Inspire",
                "description": "Área interna de resultados de Bundle de Share2Inspire con recomendaciones combinadas para CV y dirección profesional.",
                "canonical": "/es/bundle",
                "files": ["es/bundle/results/index.html"],
            },
        },
    },
    "cv_demo_test": {
        "alternates": {"pt": "/cv-analyser", "en": "/en/cv-analyser", "es": "/es/cv-analyser"},
        "robots": "noindex, nofollow, noarchive",
        "locales": {
            "en": {
                "title": "CV Analyser Demo | Internal Preview | Share2Inspire",
                "description": "Internal preview and testing page for CV Analyser flows in Share2Inspire.",
                "canonical": "/en/cv-analyser",
                "files": ["en/cv-analyser/demo/index.html", "en/cv-analyser/test/index.html"],
            },
        },
    },
}


HEAD_BLOCK_RE = re.compile(r"\n\s*<!-- SEO: GENERATED START -->.*?<!-- SEO: GENERATED END -->\n", re.S)


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


def build_seo_block(*, title: str, description: str, canonical: str, alternates: dict[str, str], robots: str) -> str:
    canonical_url = abs_url(canonical)
    parts = [
        "\n    <!-- SEO: GENERATED START -->\n",
        f"    <meta name=\"description\" content=\"{description}\" />\n",
        f"    <meta name=\"robots\" content=\"{robots}\" />\n",
        f"    <link rel=\"canonical\" href=\"{canonical_url}\" />\n",
    ]
    for lang in ["pt", "en", "es"]:
        if lang in alternates:
            parts.append(f"    <link rel=\"alternate\" hreflang=\"{lang}\" href=\"{abs_url(alternates[lang])}\" />\n")
    parts.append(f"    <link rel=\"alternate\" hreflang=\"x-default\" href=\"{abs_url(alternates.get('pt', canonical))}\" />\n")
    parts.extend([
        f"    <meta property=\"og:title\" content=\"{title}\" />\n",
        f"    <meta property=\"og:description\" content=\"{description}\" />\n",
        f"    <meta property=\"og:image\" content=\"{DEFAULT_OG_IMAGE}\" />\n",
        f"    <meta property=\"og:url\" content=\"{canonical_url}\" />\n",
        "    <meta property=\"og:type\" content=\"website\" />\n",
        "    <meta property=\"og:site_name\" content=\"Share2Inspire\" />\n",
        "    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n",
        f"    <meta name=\"twitter:title\" content=\"{title}\" />\n",
        f"    <meta name=\"twitter:description\" content=\"{description}\" />\n",
        f"    <meta name=\"twitter:image\" content=\"{DEFAULT_OG_IMAGE}\" />\n",
        f"    <meta name=\"twitter:url\" content=\"{canonical_url}\" />\n",
        "    <!-- SEO: GENERATED END -->\n",
    ])
    return "".join(parts)


def inject(file_path: Path, *, lang: str, title: str, description: str, canonical: str, alternates: dict[str, str], robots: str) -> None:
    html = file_path.read_text(encoding="utf-8")
    html = re.sub(r"<html lang=\"[^\"]+\">", f'<html lang="{lang}">', html, count=1)
    if re.search(r"<title>.*?</title>", html, flags=re.S):
        html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html, count=1, flags=re.S)
    else:
        html = html.replace("</head>", f"    <title>{title}</title>\n</head>", 1)

    head_match = re.search(r"<head>(.*?)</head>", html, flags=re.S)
    if not head_match:
        raise ValueError(f"No <head> found in {file_path}")

    head_inner = clean_existing_seo(head_match.group(1))
    seo_block = build_seo_block(title=title, description=description, canonical=canonical, alternates=alternates, robots=robots)
    viewport = re.compile(r"(<meta[^>]+name=\"viewport\"[^>]*>)", re.S)
    charset = re.compile(r"(<meta[^>]+charset=[^>]*>)", re.S)

    if viewport.search(head_inner):
        head_inner = viewport.sub(rf"\1{seo_block}", head_inner, count=1)
    elif charset.search(head_inner):
        head_inner = charset.sub(rf"\1{seo_block}", head_inner, count=1)
    else:
        head_inner = f"\n{seo_block}{head_inner}"

    html = html[: head_match.start(1)] + head_inner + html[head_match.end(1) :]
    file_path.write_text(html, encoding="utf-8")


for page in PAGES.values():
    alternates = page["alternates"]
    robots = page.get("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1")
    for lang, locale in page["locales"].items():
        for rel_file in locale["files"]:
            target = ROOT / rel_file
            if target.exists():
                inject(
                    target,
                    lang=lang,
                    title=locale["title"],
                    description=locale["description"],
                    canonical=locale["canonical"],
                    alternates=alternates,
                    robots=robots,
                )

print("Secondary SEO metadata injected.")
