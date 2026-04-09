from pathlib import Path
from datetime import date
import json
import re

ROOT = Path('/home/ubuntu/share2inspire_work')
TODAY = '2026-04-09'
SITE = 'https://www.share2inspire.pt'
OG_IMAGE = f'{SITE}/images/logo.webp'

ROUTES = [
    {
        'id': 'home',
        'paths': {'pt': '/', 'en': '/en/', 'es': '/es/'},
        'files': {'pt': 'index.html', 'en': 'en/index.html', 'es': 'es/index.html'},
        'titles': {
            'pt': 'Share2Inspire | Inteligência de carreira com IA',
            'en': 'Share2Inspire | AI career intelligence platform',
            'es': 'Share2Inspire | Inteligencia profesional con IA',
        },
        'descriptions': {
            'pt': 'Plataforma de inteligência de carreira com IA para analisar CV, optimizar LinkedIn, definir career path e acelerar a tua empregabilidade.',
            'en': 'AI career intelligence platform to analyse your CV, optimise LinkedIn, map your career path and accelerate employability.',
            'es': 'Plataforma de inteligencia profesional con IA para analizar tu CV, optimizar LinkedIn, definir tu career path y acelerar tu empleabilidad.',
        },
        'type': 'WebSite',
        'priority': '1.0',
        'changefreq': 'weekly',
    },
    {
        'id': 'cv-analyser',
        'paths': {'pt': '/cv-analyser', 'en': '/en/cv-analyser', 'es': '/es/cv-analyser'},
        'files': {'pt': 'cv-analyser/index.html', 'en': 'en/cv-analyser/index.html', 'es': 'es/cv-analyser/index.html'},
        'titles': {
            'pt': 'CV Analyser | Analisa o teu currículo com IA',
            'en': 'CV Analyser | Analyse your resume with AI',
            'es': 'CV Analyser | Analiza tu currículum con IA',
        },
        'descriptions': {
            'pt': 'Recebe um score de CV, leitura ATS, área profissional sugerida e recomendações práticas para melhorar o teu currículo.',
            'en': 'Get a CV score, ATS review, suggested professional area and practical recommendations to improve your resume.',
            'es': 'Obtén una puntuación de CV, lectura ATS, área profesional sugerida y recomendaciones prácticas para mejorar tu currículum.',
        },
        'type': 'SoftwareApplication',
        'priority': '0.9',
        'changefreq': 'weekly',
    },
    {
        'id': 'career-path',
        'paths': {'pt': '/career-path', 'en': '/en/career-path', 'es': '/es/career-path'},
        'files': {'pt': 'career-path/index.html', 'en': 'en/career-path/index.html', 'es': 'es/career-path/index.html'},
        'titles': {
            'pt': 'Career Path | Roadmap de carreira personalizado com IA',
            'en': 'Career Path | Personalised AI career roadmap',
            'es': 'Career Path | Hoja de ruta profesional personalizada con IA',
        },
        'descriptions': {
            'pt': 'Descobre próximos passos, funções-alvo, lacunas e recomendações accionáveis com um roadmap de carreira personalizado.',
            'en': 'Discover next steps, target roles, gaps and actionable recommendations with a personalised career roadmap.',
            'es': 'Descubre próximos pasos, roles objetivo, brechas y recomendaciones accionables con una hoja de ruta profesional personalizada.',
        },
        'type': 'SoftwareApplication',
        'priority': '0.9',
        'changefreq': 'weekly',
    },
    {
        'id': 'linkedin-roaster',
        'paths': {'pt': '/linkedin-roaster', 'en': '/en/linkedin-roaster', 'es': '/es/linkedin-roaster'},
        'files': {'pt': 'linkedin-roaster/index.html', 'en': 'en/linkedin-roaster/index.html', 'es': 'es/linkedin-roaster/index.html'},
        'titles': {
            'pt': 'LinkedIn Roaster | Feedback brutalmente honesto ao teu perfil',
            'en': 'LinkedIn Roaster | Brutally honest feedback on your profile',
            'es': 'LinkedIn Roaster | Feedback brutalmente honesto sobre tu perfil',
        },
        'descriptions': {
            'pt': 'Analisa o teu perfil LinkedIn com IA e recebe feedback directo sobre posicionamento, headline, impacto e clareza.',
            'en': 'Analyse your LinkedIn profile with AI and get direct feedback on positioning, headline, impact and clarity.',
            'es': 'Analiza tu perfil de LinkedIn con IA y recibe feedback directo sobre posicionamiento, titular, impacto y claridad.',
        },
        'type': 'SoftwareApplication',
        'priority': '0.9',
        'changefreq': 'weekly',
    },
    {
        'id': 'bundle',
        'paths': {'pt': '/bundle', 'en': '/en/bundle', 'es': '/es/bundle'},
        'files': {'pt': 'bundle/index.html', 'en': 'en/bundle/index.html', 'es': 'es/bundle/index.html'},
        'titles': {
            'pt': 'Bundle | Pack de ferramentas de carreira com IA',
            'en': 'Bundle | AI-powered career tools bundle',
            'es': 'Bundle | Pack de herramientas profesionales con IA',
        },
        'descriptions': {
            'pt': 'Acede num só pack ao CV Analyser, Career Path e LinkedIn Roaster para acelerar a tua estratégia de carreira.',
            'en': 'Access CV Analyser, Career Path and LinkedIn Roaster in one pack to accelerate your career strategy.',
            'es': 'Accede en un solo pack a CV Analyser, Career Path y LinkedIn Roaster para acelerar tu estrategia profesional.',
        },
        'type': 'Product',
        'priority': '0.9',
        'changefreq': 'weekly',
    },
    {
        'id': 'career-intelligence',
        'paths': {'pt': '/career-intelligence', 'en': '/en/career-intelligence', 'es': '/es/career-intelligence'},
        'files': {'pt': 'career-intelligence/index.html', 'en': 'en/career-intelligence/index.html', 'es': 'es/career-intelligence/index.html'},
        'titles': {
            'pt': 'Career Intelligence | Insights de mercado e empregabilidade',
            'en': 'Career Intelligence | Market and employability insights',
            'es': 'Career Intelligence | Insights de mercado y empleabilidad',
        },
        'descriptions': {
            'pt': 'Explora insights de mercado, oportunidades e recomendações inteligentes para decisões de carreira mais informadas.',
            'en': 'Explore market insights, opportunities and smart recommendations for better career decisions.',
            'es': 'Explora insights de mercado, oportunidades y recomendaciones inteligentes para tomar mejores decisiones profesionales.',
        },
        'type': 'WebPage',
        'priority': '0.8',
        'changefreq': 'weekly',
    },
    {
        'id': 'student-pack',
        'paths': {'pt': '/student-pack', 'en': '/en/student-pack', 'es': '/es/student-pack'},
        'files': {'pt': 'student-pack/index.html', 'en': 'en/student-pack/index.html', 'es': 'es/student-pack/index.html'},
        'titles': {
            'pt': 'Student Pack | Ferramentas de carreira para estudantes',
            'en': 'Student Pack | Career tools for students',
            'es': 'Student Pack | Herramientas profesionales para estudiantes',
        },
        'descriptions': {
            'pt': 'Pack pensado para estudantes com análise de CV, feedback LinkedIn e orientação inicial para entrar no mercado.',
            'en': 'A pack for students with CV analysis, LinkedIn feedback and initial guidance to enter the job market.',
            'es': 'Un pack para estudiantes con análisis de CV, feedback de LinkedIn y orientación inicial para entrar al mercado laboral.',
        },
        'type': 'Product',
        'priority': '0.8',
        'changefreq': 'weekly',
    },
]

LOCALES = {'pt': 'pt_PT', 'en': 'en_GB', 'es': 'es_ES'}


def build_meta(route, lang):
    canonical = f"{SITE}{route['paths'][lang]}"
    alternates = '\n'.join(
        f'    <link rel="alternate" hreflang="{alt}" href="{SITE}{path}" />'
        for alt, path in route['paths'].items()
    ) + f'\n    <link rel="alternate" hreflang="x-default" href="{SITE}{route["paths"]["pt"]}" />'
    schema = {
        '@context': 'https://schema.org',
        '@type': route['type'],
        'name': route['titles'][lang],
        'description': route['descriptions'][lang],
        'url': canonical,
        'inLanguage': lang,
        'image': OG_IMAGE,
        'publisher': {
            '@type': 'Organization',
            'name': 'Share2Inspire',
            'url': SITE,
            'logo': {
                '@type': 'ImageObject',
                'url': OG_IMAGE,
            },
        },
    }
    if route['type'] == 'WebSite':
        schema['potentialAction'] = {
            '@type': 'SearchAction',
            'target': f'{SITE}/?q={{search_term_string}}',
            'query-input': 'required name=search_term_string',
        }
    return f'''    <title>{route['titles'][lang]}</title>
    <meta name="description" content="{route['descriptions'][lang]}" />
    <link rel="canonical" href="{canonical}" />
{alternates}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="{route['titles'][lang]}" />
    <meta property="og:description" content="{route['descriptions'][lang]}" />
    <meta property="og:url" content="{canonical}" />
    <meta property="og:image" content="{OG_IMAGE}" />
    <meta property="og:site_name" content="Share2Inspire" />
    <meta property="og:locale" content="{LOCALES[lang]}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{route['titles'][lang]}" />
    <meta name="twitter:description" content="{route['descriptions'][lang]}" />
    <meta name="twitter:image" content="{OG_IMAGE}" />
    <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>'''


def update_html(route):
    for lang, rel_path in route['files'].items():
        file_path = ROOT / rel_path
        if not file_path.exists():
            continue
        html = file_path.read_text(encoding='utf-8')
        html = re.sub(r'<html\\b[^>]*lang="[^"]*"', f'<html lang="{lang}"', html, count=1)
        html = re.sub(r'\s*<title>.*?</title>\s*', '\n', html, count=1, flags=re.S)
        html = re.sub(r'\s*<meta name="description"[^>]*>\s*', '\n', html, flags=re.S)
        html = re.sub(r'\s*<link rel="canonical"[^>]*>\s*', '\n', html, flags=re.S)
        html = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*"[^>]*>\s*', '\n', html, flags=re.S)
        html = re.sub(r'\s*<meta property="og:[^"]+"[^>]*>\s*', '\n', html, flags=re.S)
        html = re.sub(r'\s*<meta name="twitter:[^"]+"[^>]*>\s*', '\n', html, flags=re.S)
        html = re.sub(r'\s*<script type="application/ld\+json">.*?</script>\s*', '\n', html, flags=re.S)
        meta_block = build_meta(route, lang)
        html = html.replace('    <meta\n      name="viewport"\n      content="width=device-width, initial-scale=1.0, maximum-scale=1" />', '    <meta\n      name="viewport"\n      content="width=device-width, initial-scale=1.0, maximum-scale=1" />\n' + meta_block, 1)
        file_path.write_text(html, encoding='utf-8')


def build_sitemap():
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for route in ROUTES:
        for lang in ['pt', 'en', 'es']:
            loc = f"{SITE}{route['paths'][lang]}"
            lines.append('  <url>')
            lines.append(f'    <loc>{loc}</loc>')
            for alt in ['pt', 'en', 'es']:
                lines.append(f'    <xhtml:link rel="alternate" hreflang="{alt}" href="{SITE}{route["paths"][alt]}" />')
            lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{route["paths"]["pt"]}" />')
            lines.append(f'    <lastmod>{TODAY}</lastmod>')
            lines.append(f'    <changefreq>{route["changefreq"]}</changefreq>')
            lines.append(f'    <priority>{route["priority"]}</priority>')
            lines.append('  </url>')
    lines.append('</urlset>')
    (ROOT / 'sitemap.xml').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def build_robots():
    robots = f'''User-agent: *
Allow: /

# Private, admin and payment-related routes
Disallow: /admin/
Disallow: /api/
Disallow: /pages/
Disallow: /area-cliente/
Disallow: /linkedin-roaster/results
Disallow: /career-path/results
Disallow: /career-path/example
Disallow: /career-intelligence/results
Disallow: /career-intelligence/demo
Disallow: /cv-analyser/results
Disallow: /bundle/results
Disallow: /student-pack/results
Disallow: /estudante/results
Disallow: /en/career-path/results
Disallow: /en/career-path/example
Disallow: /en/career-intelligence/results
Disallow: /en/cv-analyser/results
Disallow: /en/bundle/results
Disallow: /es/career-path/results
Disallow: /es/career-intelligence/results
Disallow: /es/cv-analyser/results
Disallow: /es/bundle/results

Sitemap: {SITE}/sitemap.xml
'''
    (ROOT / 'robots.txt').write_text(robots, encoding='utf-8')


def main():
    for route in ROUTES:
        update_html(route)
    build_sitemap()
    build_robots()


if __name__ == '__main__':
    main()
