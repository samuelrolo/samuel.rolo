// ServicosPage — Serviços Share2Inspire (PT/EN/ES)
// Sections: Hero, Stats, Phase 1 (Diagnosticar), Phase 2 (Decidir), FAQ, CTA Final, Testimonials
import { useState, useEffect } from "react";
import { FileText, Linkedin, Route, Zap, GraduationCap, Rocket, ChevronDown, Star, Check, ArrowRight } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import PromoBanner from "@/components/PromoBanner";
import { pick as pickLang } from "@/i18n";
import useTranslation from "@/i18n/useTranslation";
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";

/* ─── COMPONENTS ─── */
function ServiceCard({ svc, featured }: { svc: any; featured?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border ${featured ? "border-[#C9A961] shadow-lg ring-1 ring-[#C9A961]/20" : "border-[#f0ebe0]"} p-6 flex flex-col h-full hover:shadow-md transition-shadow`}>
      {svc.badge && (
        <span className={`inline-block text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4 self-start ${svc.badgeColor}`}>
          {svc.badge}
        </span>
      )}
      {svc.icon && <div className="text-[#C9A961] mb-3">{svc.icon}</div>}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{svc.title}</h3>
      <p className="text-sm text-slate-500 mb-4 leading-relaxed">{svc.desc}</p>
      {svc.features && (
        <ul className="space-y-2 mb-4 flex-1">
          {svc.features.map((f: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="w-4 h-4 text-[#C9A961] shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {svc.detail && <p className="text-xs text-slate-400 leading-relaxed mb-4">{svc.detail}</p>}
      {svc.upgradeNote && <p className="text-xs text-[#C9A961] mb-4">{svc.upgradeNote}</p>}
      <div className="mt-auto">
        {svc.oldPrice && (
          <p className="text-sm text-slate-400 mb-1">
            <span className="line-through">{svc.oldPrice}</span>
            {svc.saving && <span className="ml-2 text-emerald-600 text-xs font-medium">{svc.saving}</span>}
          </p>
        )}
        {svc.price && <p className="text-lg font-bold text-slate-900 mb-3">{svc.price}</p>}
        <a
          href={svc.link}
          {...(svc.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961] to-[#B8943D] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          {svc.cta} <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function FaqItem({ faq }: { faq: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-sm font-semibold text-slate-900 group-hover:text-[#C9A961] transition-colors">{faq.q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-sm text-slate-500 leading-relaxed pb-5 -mt-1">{faq.a}</p>}
    </div>
  );
}

/* ─── SCHEMA.ORG JSON-LD ─── */
function ServicosSchemaLD({ lang }: { lang: string }) {
  const baseUrl = "https://share2inspire.pt";
  const isEN = lang === "en";
  const isES = lang === "es";
  const pick = <T,>(pt: T, en: T, es: T): T => pickLang(pt, en, es, lang as "pt" | "en" | "es");

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    "name": "Share2Inspire",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo.png`
    },
    "description": pick(
      "Ferramentas de desenvolvimento de carreira com IA que ajudam profissionais a tomar o controlo das suas carreiras.",
      "AI-powered career development tools helping professionals take control of their careers.",
      "Herramientas de desarrollo profesional con IA que ayudan a los profesionales a tomar el control de sus carreras."
    ),
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "hello@share2inspire.pt",
      "availableLanguage": ["Portuguese", "English", "Spanish"]
    },
    "sameAs": [
      "https://www.linkedin.com/company/share2inspire",
      "https://www.instagram.com/share2inspire"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "152"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Share2Inspire",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": pick("Serviços", "Services", "Servicios"),
        "item": isEN ? `${baseUrl}/en/servicos` : isES ? `${baseUrl}/es/servicos` : `${baseUrl}/servicos`
      }
    ]
  };

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": pick("Serviços de Carreira Share2Inspire", "Share2Inspire Career Services", "Servicios de Carrera Share2Inspire"),
    "description": pick(
      "Ferramentas de carreira com IA: análise de CV, auditoria LinkedIn, planeamento de carreira e inteligência estratégica.",
      "AI-powered career tools: CV analysis, LinkedIn audit, career path planning and strategic career intelligence.",
      "Herramientas de carrera con IA: análisis de CV, auditoría de LinkedIn, planificación de carrera e inteligencia estratégica."
    ),
    "url": isEN ? `${baseUrl}/en/servicos` : isES ? `${baseUrl}/es/servicos` : `${baseUrl}/servicos`,
    "numberOfItems": 6,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Service",
          "@id": `${baseUrl}/cv-analyser#service`,
          "name": "CV Analyser",
          "url": `${baseUrl}/cv-analyser`,
          "description": pick(
            "Diagnóstico instantâneo de CV com IA. Score de empregabilidade 0-100, taxa de rejeição ATS, relatório PDF com 15+ recomendações.",
            "Instant AI-powered CV diagnosis. Employability score 0-100, ATS rejection rate, PDF report with 15+ recommendations.",
            "Diagnóstico instantáneo de CV con IA. Puntuación de empleabilidad 0-100, tasa de rechazo ATS, informe PDF con 15+ recomendaciones."
          ),
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": pick("Análise de CV", "CV Analysis", "Análisis de CV"),
          "category": pick("Desenvolvimento de Carreira", "Career Development", "Desarrollo Profesional"),
          "offers": [
            {
              "@type": "Offer",
              "name": pick("Análise Gratuita", "Free Analysis", "Análisis Gratuito"),
              "price": "0",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `${baseUrl}/cv-analyser`,
              "description": pick("Análise de CV gratuita com score de empregabilidade e recomendações-chave.", "Free CV analysis with employability score and key recommendations.", "Análisis de CV gratuito con puntuación de empleabilidad y recomendaciones clave.")
            },
            {
              "@type": "Offer",
              "name": pick("Relatório Completo", "Full Report", "Informe Completo"),
              "price": "9.99",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `${baseUrl}/cv-analyser`,
              "description": pick("Relatório PDF completo com 15+ recomendações detalhadas e taxa ATS.", "Full PDF report with 15+ detailed recommendations and ATS rate.", "Informe PDF completo con 15+ recomendaciones detalladas y tasa ATS.")
            }
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "148"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Service",
          "@id": `${baseUrl}/linkedin-roaster#service`,
          "name": "LinkedIn Roaster",
          "url": `${baseUrl}/linkedin-roaster`,
          "description": pick(
            "Auditoria completa do perfil LinkedIn. Score de visibilidade 0-10, erros críticos, palavras-chave SEO e recomendação prioritária.",
            "Complete LinkedIn profile audit. Visibility score 0-10, critical errors, SEO keywords and priority recommendations.",
            "Auditoría completa del perfil LinkedIn. Puntuación de visibilidad 0-10, errores críticos, palabras clave SEO y recomendaciones prioritarias."
          ),
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": pick("Auditoria de Perfil LinkedIn", "LinkedIn Profile Audit", "Auditoría de Perfil LinkedIn"),
          "category": pick("Desenvolvimento de Carreira", "Career Development", "Desarrollo Profesional"),
          "offers": {
            "@type": "Offer",
            "price": "3.99",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "url": `${baseUrl}/linkedin-roaster`
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.7",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "89"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Service",
          "@id": `${baseUrl}/career-path#service`,
          "name": "Career Path",
          "url": `${baseUrl}/career-path`,
          "description": pick(
            "Roadmap de carreira personalizado com análise de gaps de competências, estimativa salarial por etapa, formações recomendadas e plano 30-60-90 dias.",
            "Personalised career roadmap with skills gap analysis, salary estimates by stage, recommended training and a 30-60-90 day plan.",
            "Hoja de ruta de carrera personalizada con análisis de brechas de competencias, estimación salarial por etapa, formaciones recomendadas y plan 30-60-90 días."
          ),
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": pick("Planeamento de Carreira", "Career Planning", "Planificación de Carrera"),
          "category": pick("Desenvolvimento de Carreira", "Career Development", "Desarrollo Profesional"),
          "offers": {
            "@type": "Offer",
            "price": "19.99",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "url": `${baseUrl}/career-path`
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "134"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 4,
        "item": {
          "@type": "Service",
          "@id": `${baseUrl}/career-intelligence#service`,
          "name": "Career Intelligence",
          "url": `${baseUrl}/career-intelligence`,
          "description": pick(
            "Decisão estratégica de carreira. 3 caminhos com probabilidade de sucesso, comparação lado a lado, trade-offs e recomendação final com justificação. Contexto de mercado incluído.",
            "Strategic career decision-making. 3 paths with success probability, side-by-side comparison, trade-offs and a final justified recommendation. Market context included.",
            "Toma de decisiones estratégica de carrera. 3 caminos con probabilidad de éxito, comparación lado a lado, trade-offs y recomendación final justificada. Contexto de mercado incluido."
          ),
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": pick("Inteligência de Carreira", "Career Intelligence", "Inteligencia de Carrera"),
          "category": pick("Desenvolvimento de Carreira", "Career Development", "Desarrollo Profesional"),
          "offers": [
            {
              "@type": "Offer",
              "name": pick("Standard", "Standard", "Standard"),
              "price": "49.99",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `${baseUrl}/career-intelligence`
            },
            {
              "@type": "Offer",
              "name": pick("Upgrade desde Career Path", "Career Path Upgrade", "Upgrade desde Career Path"),
              "price": "29.00",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `${baseUrl}/career-intelligence`,
              "description": pick("Preço de upgrade para clientes do Career Path.", "Upgrade price for existing Career Path customers.", "Precio de upgrade para clientes de Career Path.")
            }
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "67"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 5,
        "item": {
          "@type": "Service",
          "@id": `${baseUrl}/estudante#service`,
          "name": pick("Pack Estudante", "Student Pack", "Pack Estudiante"),
          "url": `${baseUrl}/estudante`,
          "description": pick(
            "CV Analyser + LinkedIn Roaster juntos. Análise completa de CV com IA, auditoria de perfil LinkedIn, relatório de consistência CV↔LinkedIn e plano de acção integrado por semanas.",
            "CV Analyser + LinkedIn Roaster together. Full AI CV analysis, LinkedIn profile audit, CV↔LinkedIn consistency report and weekly integrated action plan.",
            "CV Analyser + LinkedIn Roaster juntos. Análisis completo de CV con IA, auditoría de perfil LinkedIn, informe de consistencia CV↔LinkedIn y plan de acción integrado semanal."
          ),
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": pick("Pack de Início de Carreira", "Career Starter Bundle", "Pack de Inicio de Carrera"),
          "category": pick("Desenvolvimento de Carreira", "Career Development", "Desarrollo Profesional"),
          "offers": {
            "@type": "Offer",
            "price": "7.99",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "url": `${baseUrl}/estudante`,
            "priceValidUntil": "2026-12-31"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.7",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "112"
          }
        }
      },
      {
        "@type": "ListItem",
        "position": 6,
        "item": {
          "@type": "Service",
          "@id": `${baseUrl}/bundle#service`,
          "name": pick("Bundle CV Analyser + Career Path", "CV Analyser + Career Path Bundle", "Bundle CV Analyser + Career Path"),
          "url": `${baseUrl}/bundle`,
          "description": pick(
            "Diagnóstico completo de CV + roadmap de carreira personalizado. Tudo o que precisas para começar — a preço de bundle com desconto.",
            "Full CV diagnosis + personalised career roadmap. Everything you need to get started — at a discounted bundle price.",
            "Diagnóstico completo de CV + hoja de ruta de carrera personalizada. Todo lo que necesitas para empezar — a precio de bundle con descuento."
          ),
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": pick("Bundle de Carreira", "Career Bundle", "Bundle de Carrera"),
          "category": pick("Desenvolvimento de Carreira", "Career Development", "Desarrollo Profesional"),
          "offers": {
            "@type": "Offer",
            "price": "29.00",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
            "url": `${baseUrl}/bundle`,
            "priceValidUntil": "2026-12-31"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "95"
          }
        }
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": pick("O CV Analyser é mesmo gratuito?", "Is CV Analyser really free?", "¿El CV Analyser es realmente gratuito?"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": pick(
            "Sim. A análise inicial com score de maturidade e recomendações-chave é 100% gratuita. Se quiseres o relatório completo com 15+ recomendações detalhadas e taxa ATS, custa 9,99€.",
            "Yes. The initial analysis with maturity score and key recommendations is 100% free. If you want the full report with 15+ detailed recommendations and ATS rate, it costs €9.99.",
            "Sí. El análisis inicial con puntuación de madurez y recomendaciones clave es 100% gratuito. Si quieres el informe completo con 15+ recomendaciones detalladas y tasa ATS, cuesta 9,99€."
          )
        }
      },
      {
        "@type": "Question",
        "name": pick("Qual a diferença entre Career Path e Career Intelligence?", "What's the difference between Career Path and Career Intelligence?", "¿Cuál es la diferencia entre Career Path y Career Intelligence?"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": pick(
            "O Career Path dá-te um roadmap personalizado com o próximo passo ideal. O Career Intelligence vai mais longe: compara múltiplos caminhos, analisa trade-offs e dá-te uma recomendação fundamentada. Se já sabes a direcção, o Career Path basta. Se tens dúvidas entre opções, o Career Intelligence é para ti.",
            "Career Path gives you a personalised roadmap with the ideal next step. Career Intelligence goes further: it compares multiple paths, analyses trade-offs and gives you a data-backed recommendation. If you already know the direction, Career Path is enough. If you're unsure between options, Career Intelligence is for you.",
            "Career Path te da una hoja de ruta personalizada con el próximo paso ideal. Career Intelligence va más lejos: compara múltiples caminos, analiza trade-offs y te da una recomendación fundamentada. Si ya sabes la dirección, Career Path es suficiente. Si tienes dudas entre opciones, Career Intelligence es para ti."
          )
        }
      },
      {
        "@type": "Question",
        "name": pick("Quanto tempo demora a receber os resultados?", "How long does it take to receive results?", "¿Cuánto tiempo tarda en recibir los resultados?"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": pick(
            "O CV Analyser e o LinkedIn Roaster são instantâneos — recebes o resultado em segundos. O Career Path e o Career Intelligence são gerados em menos de 5 minutos após o pagamento.",
            "The CV Analyser and LinkedIn Roaster are instant — you get results in seconds. Career Path and Career Intelligence are generated in less than 5 minutes after payment.",
            "El CV Analyser y el LinkedIn Roaster son instantáneos — recibes el resultado en segundos. El Career Path y el Career Intelligence se generan en menos de 5 minutos después del pago."
          )
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

/* ─── PAGE ─── */
export default function ServicosPage() {
  const { pick, lang, localePath } = useTranslation();
  usePageSEO(pageSeo.services);

  const phase1Services = [
    {
      icon: <FileText className="w-6 h-6" />,
      badge: pick("GRÁTIS", "FREE", "GRATIS"),
      badgeColor: "bg-[#C9A961] text-white",
      title: "CV Analyser",
      desc: pick(
        "Vê em segundos porque o teu CV não está a gerar entrevistas.",
        "See in seconds why your CV isn't generating interviews.",
        "Ve en segundos por qué tu CV no está generando entrevistas."
      ),
      features: [
        pick("Descobre o teu score de empregabilidade", "Discover your employability score", "Descubre tu puntuación de empleabilidad"),
        pick("Identifica o que os recrutadores não veem", "Identify what recruiters don't see", "Identifica lo que los reclutadores no ven"),
        pick("Recebe um plano de melhoria concreto", "Receive a concrete improvement plan", "Recibe un plan de mejora concreto"),
      ],
      detail: pick(
        "Diagnóstico instantâneo com IA. Score de maturidade 0-100, taxa de rejeição ATS, relatório PDF com 15+ recomendações. Análise gratuita + relatório completo por 9,99€.",
        "Instant AI diagnosis. Maturity score 0-100, ATS rejection rate, PDF report with 15+ recommendations. Free analysis + full report for €9.99.",
        "Diagnóstico instantáneo con IA. Puntuación de madurez 0-100, tasa de rechazo ATS, informe PDF con 15+ recomendaciones. Análisis gratuito + informe completo por 9,99€."
      ),
      price: pick("Grátis / completo 9,99€", "Free / full €9.99", "Gratis / completo 9,99€"),
      cta: pick("Analisar o meu CV", "Analyse my CV", "Analizar mi CV"),
      link: localePath("/cv-analyser"),
    },
    {
      icon: <Linkedin className="w-6 h-6" />,
      badge: pick("NOVO", "NEW", "NUEVO"),
      badgeColor: "bg-[#0077B5] text-white",
      title: "LinkedIn Roaster",
      desc: pick(
        "Descobre o que está a travar a tua visibilidade profissional.",
        "Discover what's blocking your professional visibility.",
        "Descubre qué está bloqueando tu visibilidad profesional."
      ),
      features: [
        pick("Sabe porque não apareces nas pesquisas", "Find out why you don't appear in searches", "Descubre por qué no apareces en las búsquedas"),
        pick("Corrige os erros que afastam recrutadores", "Fix mistakes that push recruiters away", "Corrige los errores que alejan a los reclutadores"),
        pick("Recebe headlines e keywords optimizadas", "Get optimised headlines and keywords", "Recibe titulares y palabras clave optimizadas"),
      ],
      detail: pick(
        "Auditoria completa do teu perfil LinkedIn. Score de visibilidade 0-10, erros críticos, palavras-chave SEO e recomendação prioritária.",
        "Full LinkedIn profile audit. Visibility score 0-10, critical errors, SEO keywords and priority recommendation.",
        "Auditoría completa de tu perfil LinkedIn. Puntuación de visibilidad 0-10, errores críticos, palabras clave SEO y recomendación prioritaria."
      ),
      price: "3,99€",
      cta: pick("Ver o que está a travar-me", "See what's holding me back", "Ver qué me está frenando"),
      link: localePath("/linkedin-roaster"),
    },
  ];

  const phase1Bundles = [
    {
      icon: <GraduationCap className="w-6 h-6" />,
      badge: "-43%",
      badgeColor: "bg-emerald-500 text-white",
      title: pick("Pack Estudante", "Student Pack", "Pack Estudiante"),
      desc: pick(
        "CV Analyser + LinkedIn Roaster juntos. Prepara-te para o primeiro emprego.",
        "CV Analyser + LinkedIn Roaster together. Get ready for your first job.",
        "CV Analyser + LinkedIn Roaster juntos. Prepárate para tu primer empleo."
      ),
      features: [
        pick("Análise completa do CV com IA", "Full AI CV analysis", "Análisis completo del CV con IA"),
        pick("Auditoria do perfil LinkedIn", "LinkedIn profile audit", "Auditoría del perfil LinkedIn"),
        pick("Relatório de consistência CV ↔ LinkedIn (exclusivo)", "CV ↔ LinkedIn consistency report (exclusive)", "Informe de consistencia CV ↔ LinkedIn (exclusivo)"),
        pick("Plano de acção integrado por semanas", "Integrated weekly action plan", "Plan de acción integrado por semanas"),
      ],
      oldPrice: "13,98€",
      price: "7,99€",
      saving: pick("Poupas 43%", "Save 43%", "Ahorras 43%"),
      cta: pick("Quero o Pack Estudante", "I want the Student Pack", "Quiero el Pack Estudiante"),
      link: localePath("/estudante"),
    },
    {
      badge: pick("MAIS POPULAR", "MOST POPULAR", "MÁS POPULAR"),
      badgeColor: "bg-[#C9A961] text-white",
      title: "CV Analyser + Career Path",
      desc: pick(
        "Diagnóstico completo + roadmap personalizado. Tudo o que precisas para começar.",
        "Full diagnosis + personalised roadmap. Everything you need to get started.",
        "Diagnóstico completo + hoja de ruta personalizada. Todo lo que necesitas para empezar."
      ),
      oldPrice: "38€",
      price: "29€",
      saving: pick("Poupas 9€", "Save €9", "Ahorras 9€"),
      cta: pick("Quero os dois", "I want both", "Quiero los dos"),
      link: localePath("/bundle"),
    },
  ];

  const phase2Services = [
    {
      icon: <Route className="w-6 h-6" />,
      badge: pick("RECOMENDADO", "RECOMMENDED", "RECOMENDADO"),
      badgeColor: "bg-[#C9A961] text-white",
      title: "Career Path",
      desc: pick(
        "Deixa de andar às cegas. Sabe exactamente qual é o próximo passo.",
        "Stop guessing. Know exactly what your next step is.",
        "Deja de andar a ciegas. Sabe exactamente cuál es el próximo paso."
      ),
      features: [
        pick("Recebe um roadmap personalizado para a tua carreira", "Get a personalised career roadmap", "Recibe una hoja de ruta personalizada para tu carrera"),
        pick("Identifica os gaps que te separam do próximo nível", "Identify the gaps keeping you from the next level", "Identifica las brechas que te separan del siguiente nivel"),
        pick("Sabe quanto podes ganhar em cada etapa", "Know how much you can earn at each stage", "Sabe cuánto puedes ganar en cada etapa"),
      ],
      detail: pick(
        "Percursos de carreira personalizados, análise de gaps de competências, estimativa salarial por etapa, formações recomendadas e plano 30-60-90 dias.",
        "Personalised career paths, skills gap analysis, salary estimate per stage, recommended training and 30-60-90 day plan.",
        "Trayectorias de carrera personalizadas, análisis de brechas de competencias, estimación salarial por etapa, formaciones recomendadas y plan 30-60-90 días."
      ),
      price: "19,99€",
      cta: pick("Traçar o meu caminho", "Map my path", "Trazar mi camino"),
      link: localePath("/career-path"),
    },
    {
      icon: <Zap className="w-6 h-6" />,
      badge: pick("COMPLETO", "COMPLETE", "COMPLETO"),
      badgeColor: "bg-slate-800 text-white",
      title: "Career Intelligence",
      desc: pick(
        "Toma a decisão certa com base em dados, não em dúvidas.",
        "Make the right decision based on data, not doubt.",
        "Toma la decisión correcta basada en datos, no en dudas."
      ),
      features: [
        pick("Compara múltiplos caminhos lado a lado", "Compare multiple paths side by side", "Compara múltiples caminos uno al lado del otro"),
        pick("Vê o que ganhas e o que abdicas em cada opção", "See what you gain and give up in each option", "Ve lo que ganas y lo que cedes en cada opción"),
        pick("Recebe uma recomendação fundamentada com dados", "Get a data-backed recommendation", "Recibe una recomendación fundamentada con datos"),
      ],
      detail: pick(
        "Tudo do Career Path + decisão estratégica. 3 caminhos com probabilidade de sucesso, comparação lado a lado, trade-offs e recomendação final com justificação. Contexto de mercado incluído.",
        "Everything in Career Path + strategic decision. 3 paths with success probability, side-by-side comparison, trade-offs and final recommendation with justification. Market context included.",
        "Todo del Career Path + decisión estratégica. 3 caminos con probabilidad de éxito, comparación lado a lado, trade-offs y recomendación final con justificación. Contexto de mercado incluido."
      ),
      upgradeNote: pick(
        "Ou começa pelo Career Path (19,99€) e faz upgrade por 29€.",
        "Or start with Career Path (€19.99) and upgrade for €29.",
        "O empieza por Career Path (19,99€) y haz upgrade por 29€."
      ),
      cta: pick("Tomar a decisão certa", "Make the right decision", "Tomar la decisión correcta"),
      link: localePath("/career-intelligence"),
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "KickStart Pro",
      desc: pick(
        "Precisas de clareza agora? 30 minutos com um especialista e sais com um plano.",
        "Need clarity now? 30 minutes with a specialist and you leave with a plan.",
        "¿Necesitas claridad ahora? 30 minutos con un especialista y sales con un plan."
      ),
      features: [
        pick("Plano de acção com 3-5 passos concretos", "Action plan with 3-5 concrete steps", "Plan de acción con 3-5 pasos concretos"),
        pick("Acompanhamento pós-sessão incluído", "Post-session follow-up included", "Seguimiento post-sesión incluido"),
      ],
      price: pick("desde 35€", "from €35", "desde 35€"),
      cta: pick("Agendar sessão", "Book session", "Reservar sesión"),
      link: "https://calendly.com/share2inspire",
      isExternal: true,
    },
  ];

  const faqs = [
    {
      q: pick("O CV Analyser é mesmo gratuito?", "Is the CV Analyser really free?", "¿El CV Analyser es realmente gratuito?"),
      a: pick(
        "Sim. A análise inicial com score de maturidade e recomendações-chave é 100% gratuita. Se quiseres o relatório completo com 15+ recomendações detalhadas e taxa ATS, custa 9,99€.",
        "Yes. The initial analysis with maturity score and key recommendations is 100% free. If you want the full report with 15+ detailed recommendations and ATS rate, it costs €9.99.",
        "Sí. El análisis inicial con puntuación de madurez y recomendaciones clave es 100% gratuito. Si quieres el informe completo con 15+ recomendaciones detalladas y tasa ATS, cuesta 9,99€."
      ),
    },
    {
      q: pick(
        "Qual a diferença entre Career Path e Career Intelligence?",
        "What's the difference between Career Path and Career Intelligence?",
        "¿Cuál es la diferencia entre Career Path y Career Intelligence?"
      ),
      a: pick(
        "O Career Path dá-te um roadmap personalizado com o próximo passo ideal. O Career Intelligence vai mais longe: compara múltiplos caminhos, analisa trade-offs e dá-te uma recomendação fundamentada. Se já sabes a direcção, o Career Path basta. Se tens dúvidas entre opções, o Career Intelligence é para ti.",
        "Career Path gives you a personalised roadmap with the ideal next step. Career Intelligence goes further: it compares multiple paths, analyses trade-offs and gives you a data-backed recommendation. If you already know the direction, Career Path is enough. If you're unsure between options, Career Intelligence is for you.",
        "Career Path te da una hoja de ruta personalizada con el próximo paso ideal. Career Intelligence va más lejos: compara múltiples caminos, analiza trade-offs y te da una recomendación fundamentada. Si ya sabes la dirección, Career Path es suficiente. Si tienes dudas entre opciones, Career Intelligence es para ti."
      ),
    },
    {
      q: pick(
        "Quanto tempo demora a receber os resultados?",
        "How long does it take to receive results?",
        "¿Cuánto tiempo tarda en recibir los resultados?"
      ),
      a: pick(
        "O CV Analyser e o LinkedIn Roaster são instantâneos — recebes o resultado em segundos. O Career Path e o Career Intelligence são gerados em menos de 5 minutos após o pagamento.",
        "The CV Analyser and LinkedIn Roaster are instant — you get results in seconds. Career Path and Career Intelligence are generated in less than 5 minutes after payment.",
        "El CV Analyser y el LinkedIn Roaster son instantáneos — recibes el resultado en segundos. El Career Path y el Career Intelligence se generan en menos de 5 minutos después del pago."
      ),
    },
  ];

  const testimonials = [
    {
      quote: pick(
        "A sessão KickStart Pro foi transformadora. Em 30 minutos tinha um plano de acção concreto.",
        "The KickStart Pro session was transformative. In 30 minutes I had a concrete action plan.",
        "La sesión KickStart Pro fue transformadora. En 30 minutos tenía un plan de acción concreto."
      ),
      name: "Marta S.", role: pick("HR Director", "HR Director", "Directora de RRHH"), initials: "MS"
    },
    {
      quote: pick(
        "O LinkedIn Roaster mudou a forma como me apresento. Recebi 3 contactos na semana seguinte.",
        "The LinkedIn Roaster changed how I present myself. I received 3 contacts the following week.",
        "El LinkedIn Roaster cambió la forma en que me presento. Recibí 3 contactos la semana siguiente."
      ),
      name: "João F.", role: "Tech Lead", initials: "JF"
    },
    {
      quote: pick(
        "O Career Path deu-me uma visão clara do próximo passo. Recomendo a qualquer profissional em transição.",
        "Career Path gave me a clear vision of the next step. I recommend it to any professional in transition.",
        "Career Path me dio una visión clara del próximo paso. Lo recomiendo a cualquier profesional en transición."
      ),
      name: "Ana M.", role: "Senior Manager", initials: "AM"
    },
    {
      quote: pick(
        "O CV Analyser identificou pontos que eu nunca teria visto. Gratuito e extremamente útil.",
        "The CV Analyser identified points I would never have seen. Free and extremely useful.",
        "El CV Analyser identificó puntos que nunca habría visto. Gratuito y extremadamente útil."
      ),
      name: "Ricardo P.", role: pick("Consultor", "Consultant", "Consultor"), initials: "RP"
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── SCHEMA.ORG JSON-LD ─── */}
      <ServicosSchemaLD lang={lang} />

      <S2IHeader activePage="servicos" />
      <PromoBanner />

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-light text-slate-900 mb-2 leading-tight">
            {pick("Para de adivinhar.", "Stop guessing.", "Deja de adivinar.")}
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            {pick("Toma o controlo da tua carreira.", "Take control of your career.", "Toma el control de tu carrera.")}
          </h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
            {pick(
              "Do diagnóstico à decisão estratégica. Ferramentas de IA que te mostram onde estás, para onde podes ir e qual o melhor caminho.",
              "From diagnosis to strategic decision. AI tools that show you where you are, where you can go and the best path to get there.",
              "Del diagnóstico a la decisión estratégica. Herramientas de IA que te muestran dónde estás, hacia dónde puedes ir y cuál es el mejor camino."
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <a
              href={localePath("/cv-analyser")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961] to-[#B8943D] text-white font-semibold px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              {pick("Analisar o meu CV — Grátis", "Analyse my CV — Free", "Analizar mi CV — Gratis")} <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#servicos"
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 font-medium px-7 py-3 rounded-full hover:border-[#C9A961] hover:text-[#C9A961] transition-colors"
            >
              {pick("Ver os serviços", "View services", "Ver los servicios")} <ChevronDown className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-slate-400">
            <span className="text-[#C9A961]">⚡</span>{" "}
            {pick(
              "Resultado em segundos · Sem cartão de crédito · Sem compromisso",
              "Results in seconds · No credit card · No commitment",
              "Resultado en segundos · Sin tarjeta de crédito · Sin compromiso"
            )}
          </p>
        </div>
      </section>

      {/* ─── PHASE STEPPER ─── */}
      <section className="py-6 px-6 bg-white">
        <div className="max-w-md mx-auto flex items-center justify-center gap-8">
          <a href="#fase1" className="flex flex-col items-center gap-1 group">
            <span className="w-10 h-10 rounded-full border-2 border-[#C9A961] flex items-center justify-center text-sm font-bold text-[#C9A961] group-hover:bg-[#C9A961] group-hover:text-white transition-all">1</span>
            <span className="text-xs text-slate-500">{pick("Diagnosticar", "Diagnose", "Diagnosticar")}</span>
          </a>
          <div className="w-16 h-px bg-slate-200" />
          <a href="#fase2" className="flex flex-col items-center gap-1 group">
            <span className="w-10 h-10 rounded-full border-2 border-[#C9A961] flex items-center justify-center text-sm font-bold text-[#C9A961] group-hover:bg-[#C9A961] group-hover:text-white transition-all">2</span>
            <span className="text-xs text-slate-500">{pick("Decidir", "Decide", "Decidir")}</span>
          </a>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-10 px-6 border-y border-slate-100">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-12 flex-wrap">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A961]">+500</p>
            <p className="text-xs text-slate-400">{pick("Profissionais ajudados", "Professionals helped", "Profesionales ayudados")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A961]">5 <Star className="w-4 h-4 inline text-[#C9A961] -mt-1" /></p>
            <p className="text-xs text-slate-400">{pick("Avaliação média", "Average rating", "Valoración media")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A961]">98%</p>
            <p className="text-xs text-slate-400">{pick("Taxa de satisfação", "Satisfaction rate", "Tasa de satisfacción")}</p>
          </div>
        </div>
      </section>

      {/* ─── PHASE 1: DIAGNOSTICAR ─── */}
      <section id="fase1" className="py-20 px-6 scroll-mt-20" style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf8f4 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center text-xs font-bold text-[#C9A961]">1</span>
            <span className="text-[0.65rem] font-bold uppercase tracking-[2.5px] text-[#C9A961]">{pick("Fase", "Phase", "Fase")}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            {pick("Percebe ", "Understand ", "Entiende ")}<strong className="text-[#C9A961]">{pick("onde estás", "where you are", "dónde estás")}</strong>
          </h2>
          <p className="text-sm text-slate-500 mb-10 max-w-xl leading-relaxed">
            {pick(
              "Antes de decidir para onde ir, precisas de saber o ponto de partida. Estas ferramentas dão-te essa clareza — em minutos.",
              "Before deciding where to go, you need to know your starting point. These tools give you that clarity — in minutes.",
              "Antes de decidir a dónde ir, necesitas saber el punto de partida. Estas herramientas te dan esa claridad — en minutos."
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {phase1Services.map((svc) => (
              <ServiceCard key={svc.title} svc={svc} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {phase1Bundles.map((svc, i) => (
              <ServiceCard key={i} svc={svc} featured={i === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRANSITION ─── */}
      <section className="py-8 px-6 text-center bg-[#faf8f4]">
        <a href="#fase2" className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A961] hover:underline">
          {pick("Já sabes onde estás? Decide para onde vais", "Know where you are? Decide where you're going", "¿Ya sabes dónde estás? Decide a dónde vas")} <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* ─── PHASE 2: DECIDIR ─── */}
      <section id="fase2" className="py-20 px-6 scroll-mt-20" style={{ background: "linear-gradient(180deg, #faf8f4 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center text-xs font-bold text-[#C9A961]">2</span>
            <span className="text-[0.65rem] font-bold uppercase tracking-[2.5px] text-[#C9A961]">{pick("Fase", "Phase", "Fase")}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            {pick("Decide ", "Decide ", "Decide ")}<strong className="text-[#C9A961]">{pick("para onde vais", "where you're going", "a dónde vas")}</strong>
          </h2>
          <p className="text-sm text-slate-500 mb-10 max-w-xl leading-relaxed">
            {pick(
              "Não basta saber onde estás. Precisas de saber para onde ir — e qual o melhor caminho para lá chegar.",
              "Knowing where you are isn't enough. You need to know where to go — and the best path to get there.",
              "No basta con saber dónde estás. Necesitas saber a dónde ir — y cuál es el mejor camino para llegar."
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phase2Services.map((svc) => (
              <ServiceCard key={svc.title} svc={svc} featured={svc.badge === pick("RECOMENDADO", "RECOMMENDED", "RECOMENDADO")} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2 text-center">
            {pick("Perguntas ", "Frequently asked ", "Preguntas ")}<strong className="text-[#C9A961]">{pick("frequentes", "questions", "frecuentes")}</strong>
          </h2>
          <div className="w-10 h-0.5 bg-[#C9A961] mx-auto mb-10" />
          <div className="bg-white rounded-2xl border border-[#f0ebe0] p-6">
            {faqs.map((faq, i) => (
              <FaqItem key={i} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            {pick("Pronto para parar de ", "Ready to stop ", "¿Listo para dejar de ")}<strong className="text-[#C9A961]">{pick("adivinhar", "guessing", "adivinar")}</strong>{"?"}
          </h2>
          <p className="text-sm text-white/50 mb-6 leading-relaxed">
            {pick(
              "Começa pelo diagnóstico gratuito. Em 30 segundos sabes onde estás — e o que fazer a seguir.",
              "Start with the free diagnosis. In 30 seconds you know where you are — and what to do next.",
              "Empieza por el diagnóstico gratuito. En 30 segundos sabes dónde estás — y qué hacer a continuación."
            )}
          </p>
          <p className="text-xs text-white/30 mb-8">{pick("O que dizem os nossos clientes", "What our clients say", "Lo que dicen nuestros clientes")}</p>
          <div className="flex items-center justify-center gap-8 flex-wrap mb-10">
            <div className="text-center">
              <p className="text-xl font-bold text-[#C9A961]">+500</p>
              <p className="text-[0.65rem] text-white/40">{pick("Profissionais ajudados", "Professionals helped", "Profesionales ayudados")}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#C9A961]">5<Star className="w-3 h-3 inline text-[#C9A961] -mt-0.5 ml-0.5" /></p>
              <p className="text-[0.65rem] text-white/40">{pick("Avaliação média", "Average rating", "Valoración media")}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#C9A961]">98%</p>
              <p className="text-[0.65rem] text-white/40">{pick("Taxa de satisfação", "Satisfaction rate", "Tasa de satisfacción")}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={localePath("/cv-analyser")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961] to-[#B8943D] text-white font-semibold px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              {pick("Analisar o meu CV — Grátis", "Analyse my CV — Free", "Analizar mi CV — Gratis")}
            </a>
            <a
              href={localePath("/career-path")}
              className="inline-flex items-center gap-2 border border-white/20 text-white font-medium px-7 py-3 rounded-full hover:border-[#C9A961] hover:text-[#C9A961] transition-colors"
            >
              {pick("Traçar o meu caminho — 19,99€", "Map my path — €19.99", "Trazar mi camino — 19,99€")}
            </a>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6 bg-[#faf8f4]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-slate-900 mb-2">
            {pick("O que dizem os nossos ", "What our ", "Lo que dicen nuestros ")}<strong className="text-[#C9A961]">{pick("utilizadores", "users say", "usuarios")}</strong>
          </h2>
          <div className="w-10 h-0.5 bg-[#C9A961] mx-auto mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-5 border border-[#f0ebe0]">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-[#C9A961] fill-[#C9A961]" />
                  ))}
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#C9A961] rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <S2IFooter />
    </div>
  );
}
