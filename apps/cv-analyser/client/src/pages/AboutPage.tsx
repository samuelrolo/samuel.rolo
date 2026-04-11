import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  Globe2,
  Languages,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import useTranslation from "@/i18n/useTranslation";
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";

export default function AboutPage() {
  const { pick, localePath } = useTranslation();
  usePageSEO(pageSeo.about);

  const companyFacts = [
    {
      icon: <BriefcaseBusiness className="w-4 h-4" />,
      label: pick("Setor", "Sector", "Sector"),
      value: pick(
        "HR Tech / EdTech / Career Intelligence",
        "HR Tech / EdTech / Career Intelligence",
        "HR Tech / EdTech / Career Intelligence"
      ),
    },
    {
      icon: <CalendarDays className="w-4 h-4" />,
      label: pick("Fundação", "Founded", "Fundación"),
      value: pick("Abril de 2025", "April 2025", "Abril de 2025"),
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: pick("Sede", "Headquarters", "Sede"),
      value: pick("Lisboa, Portugal", "Lisbon, Portugal", "Lisboa, Portugal"),
    },
  ];

  const platformPillars = [
    {
      icon: <Target className="w-4 h-4" />,
      title: pick("Missão", "Mission", "Misión"),
      text: pick(
        "Acelerar a empregabilidade e o crescimento profissional, fornecendo uma análise inteligente, objectiva e localizada da carreira.",
        "Accelerate employability and professional growth by providing intelligent, objective and locally grounded career analysis.",
        "Acelerar la empleabilidad y el crecimiento profesional, proporcionando un análisis de carrera inteligente, objetivo y localizado."
      ),
    },
    {
      icon: <Eye className="w-4 h-4" />,
      title: pick("Visão", "Vision", "Visión"),
      text: pick(
        "Tornar-se o ecossistema de referência onde profissionais percebem exactamente onde estão, o que precisam ajustar e qual o próximo passo estratégico, com base em dados reais.",
        "Become the reference ecosystem where professionals understand exactly where they stand, what they need to adjust and what the next strategic step is, based on real data.",
        "Convertirse en el ecosistema de referencia donde los profesionales entienden exactamente dónde están, qué necesitan ajustar y cuál es el siguiente paso estratégico, basándose en datos reales."
      ),
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      title: pick("Valores", "Values", "Valores"),
      text: pick(
        "Praticidade, dados reais em vez de recomendações genéricas, transparência, humanização da tecnologia e foco no mercado local.",
        "Practicality, real data instead of generic recommendations, transparency, humanised technology and a strong focus on the local market.",
        "Practicidad, datos reales en lugar de recomendaciones genéricas, transparencia, humanización de la tecnología y foco en el mercado local."
      ),
    },
  ];

  const ecosystemItems = [
    {
      title: "CV Analyser",
      description: pick(
        "Diagnóstico rápido e objectivo do CV, compatibilidade ATS, gaps de competências e enquadramento de posicionamento profissional.",
        "Fast and objective CV diagnosis, ATS compatibility, skill gaps and professional positioning context.",
        "Diagnóstico rápido y objetivo del CV, compatibilidad con ATS, brechas de competencias y contexto de posicionamiento profesional."
      ),
      href: localePath("/cv-analyser"),
    },
    {
      title: "LinkedIn Roaster",
      description: pick(
        "Auditoria crítica do perfil de LinkedIn para aumentar visibilidade, clareza de proposta de valor e capacidade de atrair recrutadores.",
        "Critical LinkedIn profile audit to improve visibility, sharpen value proposition and attract recruiters more effectively.",
        "Auditoría crítica del perfil de LinkedIn para aumentar la visibilidad, afinar la propuesta de valor y atraer reclutadores con mayor eficacia."
      ),
      href: localePath("/linkedin-roaster"),
    },
    {
      title: pick(
        "Career Path / Career Intelligence",
        "Career Path / Career Intelligence",
        "Career Path / Career Intelligence"
      ),
      description: pick(
        "Ferramentas para clarificar opções, comparar cenários e estruturar o próximo passo de carreira com uma lógica mais estratégica.",
        "Tools to clarify options, compare scenarios and structure the next career move with a more strategic logic.",
        "Herramientas para aclarar opciones, comparar escenarios y estructurar el siguiente paso profesional con una lógica más estratégica."
      ),
      href: localePath("/career-path"),
    },
    {
      title: pick("Career Advisory", "Career Advisory", "Career Advisory"),
      description: pick(
        "Uma camada consultiva apoiada por IA para transformar diagnóstico em orientação prática, accionável e contextualizada.",
        "An advisory layer supported by AI to transform diagnosis into practical, actionable and contextual guidance.",
        "Una capa de asesoramiento apoyada por IA para transformar el diagnóstico en orientación práctica, accionable y contextualizada."
      ),
      href: localePath("/contactos"),
    },
  ];

  const founderHighlights = [
    pick(
      "+15 anos de experiência em transformação de RH, excelência operacional e inovação aplicada a People & Culture.",
      "+15 years of experience across HR transformation, operational excellence and innovation applied to People & Culture.",
      "+15 años de experiencia en transformación de RR. HH., excelencia operativa e innovación aplicada a People & Culture."
    ),
    pick(
      "Percurso em organizações como Deloitte, BNP Paribas CIB e AstraZeneca, com evolução de Analyst a Senior Manager e liderança em HR Transformation e Digital HR.",
      "Track record in organisations such as Deloitte, BNP Paribas CIB and AstraZeneca, progressing from Analyst to Senior Manager and leading HR Transformation and Digital HR initiatives.",
      "Trayectoria en organizaciones como Deloitte, BNP Paribas CIB y AstraZeneca, progresando de Analyst a Senior Manager y liderando iniciativas de HR Transformation y Digital HR."
    ),
    pick(
      "Reconhecido como LinkedIn Top Voice em Change & Transformation e Top Creator em Technology & Innovation em Portugal.",
      "Recognised as a LinkedIn Top Voice in Change & Transformation and a Top Creator in Technology & Innovation in Portugal.",
      "Reconocido como LinkedIn Top Voice en Change & Transformation y Top Creator en Technology & Innovation en Portugal."
    ),
    pick(
      "Criador do People Innovation Hub e de uma comunidade com mais de 30.000 pessoas interessadas no futuro do trabalho, liderança e tecnologia.",
      "Creator of People Innovation Hub and a community of more than 30,000 people interested in the future of work, leadership and technology.",
      "Creador de People Innovation Hub y de una comunidad de más de 30.000 personas interesadas en el futuro del trabajo, el liderazgo y la tecnología."
    ),
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <S2IHeader activePage="sobre" />

      <main className="bg-white">
        <section className="border-b border-[#C9A961]/20 bg-gradient-to-b from-[#fbfaf7] via-white to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-18">
            <div className="max-w-4xl mx-auto text-center">
              <img
                src="/logo-s2i.png"
                alt={pick("Logótipo Share2Inspire", "Share2Inspire logo", "Logotipo Share2Inspire")}
                loading="lazy"
                decoding="async"
                width="320"
                height="84"
                className="h-12 md:h-14 w-auto mx-auto mb-5 object-contain"
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C9A961] mb-3">
                {pick("Sobre a plataforma", "About the platform", "Sobre la plataforma")}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
                {pick("Sobre a Share2Inspire", "About Share2Inspire", "Sobre Share2Inspire")}
              </h1>
              <p className="max-w-3xl mx-auto text-base md:text-lg leading-8 text-slate-600">
                {pick(
                  "A Share2Inspire é um ecossistema de Career Intelligence criado para tornar as decisões de carreira mais claras, mais estratégicas e mais próximas da realidade do mercado. Em vez de recomendações genéricas, combina tecnologia, contexto local e análise prática para ajudar profissionais a perceber onde estão, o que precisam de ajustar e qual o próximo passo com maior retorno.",
                  "Share2Inspire is a Career Intelligence ecosystem created to make career decisions clearer, more strategic and closer to actual market conditions. Instead of generic recommendations, it combines technology, local context and practical analysis to help professionals understand where they stand, what they need to adjust and which next step offers the highest return.",
                  "Share2Inspire es un ecosistema de Career Intelligence creado para hacer que las decisiones de carrera sean más claras, más estratégicas y más cercanas a la realidad del mercado. En lugar de recomendaciones genéricas, combina tecnología, contexto local y análisis práctico para ayudar a los profesionales a entender dónde están, qué necesitan ajustar y cuál es el siguiente paso con mayor retorno."
                )}
              </p>
            </div>

            <div className="mt-10 rounded-[28px] border border-[#C9A961]/25 bg-white overflow-hidden shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)]">
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#C9A961]/18">
                {companyFacts.map((fact) => (
                  <div key={fact.label} className="px-5 md:px-6 py-5 md:py-6 text-left bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full border border-[#C9A961]/30 text-[#C9A961] flex items-center justify-center shrink-0 mt-0.5">
                        {fact.icon}
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-2">{fact.label}</p>
                        <p className="text-sm md:text-base font-semibold text-slate-900 leading-7">{fact.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-[30px] border border-[#C9A961]/22 bg-white overflow-hidden shadow-[0_22px_70px_-52px_rgba(15,23,42,0.35)]">
              <div className="grid lg:grid-cols-[1.08fr_0.92fr] divide-y lg:divide-y-0 lg:divide-x divide-[#C9A961]/16">
                <div className="p-7 md:p-9 lg:p-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 text-[#C9A961] flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">
                      {pick(
                        "O que a Share2Inspire oferece",
                        "What Share2Inspire offers",
                        "Lo que ofrece Share2Inspire"
                      )}
                    </h2>
                  </div>

                  <div className="space-y-4 text-slate-600 leading-8">
                    <p>
                      {pick(
                        "A plataforma foi desenhada para acelerar a empregabilidade e o crescimento profissional através de análises inteligentes, objectivas e localizadas. O foco está em transformar incerteza em clareza e recomendações dispersas em orientação accionável.",
                        "The platform was designed to accelerate employability and professional growth through intelligent, objective and locally grounded analysis. Its focus is to turn uncertainty into clarity and scattered recommendations into actionable guidance.",
                        "La plataforma fue diseñada para acelerar la empleabilidad y el crecimiento profesional mediante análisis inteligentes, objetivos y contextualizados al mercado local. Su foco es transformar la incertidumbre en claridad y las recomendaciones dispersas en orientación accionable."
                      )}
                    </p>
                    <p>
                      {pick(
                        "A Share2Inspire posiciona-se entre HR Tech, EdTech e Career Intelligence, com uma abordagem que humaniza a tecnologia: a IA acelera o diagnóstico, enquanto a estratégia e o contexto humano garantem que cada recomendação é útil, realista e relevante.",
                        "Share2Inspire sits at the intersection of HR Tech, EdTech and Career Intelligence, with an approach that humanises technology: AI accelerates diagnosis, while strategy and human context ensure that each recommendation is useful, realistic and relevant.",
                        "Share2Inspire se sitúa entre HR Tech, EdTech y Career Intelligence, con un enfoque que humaniza la tecnología: la IA acelera el diagnóstico, mientras que la estrategia y el contexto humano garantizan que cada recomendación sea útil, realista y relevante."
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-5 md:p-6 lg:p-7 bg-[#fcfbf8]">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700 mb-4">
                    {pick("Princípios de construção", "Core principles", "Principios de construcción")}
                  </h3>
                  <div className="grid gap-3">
                    {platformPillars.map((pillar) => (
                      <div
                        key={pillar.title}
                        className="rounded-2xl border border-[#C9A961]/24 bg-white px-5 py-4"
                      >
                        <div className="flex items-center gap-3 mb-2.5 text-slate-900">
                          <div className="w-8 h-8 rounded-full border border-[#C9A961]/28 text-[#C9A961] flex items-center justify-center">
                            {pillar.icon}
                          </div>
                          <h4 className="font-semibold">{pillar.title}</h4>
                        </div>
                        <p className="text-sm leading-7 text-slate-600">{pillar.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8 md:pb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-[30px] border border-[#C9A961]/22 bg-white p-7 md:p-9 lg:p-10 shadow-[0_22px_70px_-52px_rgba(15,23,42,0.35)]">
              <div className="max-w-3xl mb-6 md:mb-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#C9A961] mb-3">
                  {pick("Ecossistema", "Ecosystem", "Ecosistema")}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  {pick(
                    "Ferramentas que ligam diagnóstico, visibilidade e decisão",
                    "Tools that connect diagnosis, visibility and decision-making",
                    "Herramientas que conectan diagnóstico, visibilidad y toma de decisiones"
                  )}
                </h2>
                <p className="text-slate-600 leading-8">
                  {pick(
                    "O ecossistema Share2Inspire foi desenhado para acompanhar diferentes momentos da jornada profissional, desde a optimização da candidatura até à definição do próximo movimento estratégico.",
                    "The Share2Inspire ecosystem was designed to support different moments of the professional journey, from application optimisation to defining the next strategic move.",
                    "El ecosistema Share2Inspire fue diseñado para acompañar distintos momentos de la trayectoria profesional, desde la optimización de la candidatura hasta la definición del siguiente movimiento estratégico."
                  )}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                {ecosystemItems.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    className="group rounded-2xl border border-[#C9A961]/22 bg-[#fcfbf8] px-5 py-5 hover:bg-white hover:border-[#C9A961]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4 mb-2.5">
                      <h3 className="text-base md:text-lg font-semibold text-slate-900">{item.title}</h3>
                      <ArrowRight className="w-4 h-4 text-[#C9A961] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8 md:pb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-[30px] border border-[#C9A961]/22 bg-white overflow-hidden shadow-[0_22px_70px_-52px_rgba(15,23,42,0.35)]">
              <div className="grid lg:grid-cols-[0.92fr_1.08fr] divide-y lg:divide-y-0 lg:divide-x divide-[#C9A961]/16 items-stretch">
                <div className="min-h-[360px] lg:min-h-[100%] bg-[#f5f2e9]">
                  <img
                    src="/images/samuel-hero.jpg"
                    alt={pick("Samuel Rolo", "Samuel Rolo", "Samuel Rolo")}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-7 md:p-9 lg:p-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#C9A961] mb-3">
                    {pick("Fundador", "Founder", "Fundador")}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold mb-5">Samuel Rolo</h2>
                  <p className="text-slate-600 leading-8 mb-6">
                    {pick(
                      "Especialista em Digital HR, Process Excellence e Humanising AI in People & Culture, Samuel Rolo criou a Share2Inspire para aproximar tecnologia, empregabilidade e estratégia de carreira de forma prática e útil. O seu trabalho combina visão de transformação, foco em execução e leitura real do mercado.",
                      "A specialist in Digital HR, Process Excellence and Humanising AI in People & Culture, Samuel Rolo created Share2Inspire to bring technology, employability and career strategy closer together in a practical and useful way. His work combines transformation vision, execution focus and a real understanding of the market.",
                      "Especialista en Digital HR, Process Excellence y Humanising AI in People & Culture, Samuel Rolo creó Share2Inspire para acercar tecnología, empleabilidad y estrategia de carrera de una forma práctica y útil. Su trabajo combina visión de transformación, foco en la ejecución y una comprensión real del mercado."
                    )}
                  </p>

                  <div className="grid gap-3 mb-6">
                    {founderHighlights.map((highlight) => (
                      <div
                        key={highlight}
                        className="rounded-2xl border border-[#C9A961]/18 bg-[#fcfbf8] px-4 py-3.5"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="w-7 h-7 rounded-full border border-[#C9A961]/28 text-[#C9A961] flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-sm leading-7 text-slate-600">{highlight}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#C9A961]/24 bg-white px-5 py-4">
                      <div className="flex items-center gap-3 mb-2 text-slate-900">
                        <div className="w-8 h-8 rounded-full border border-[#C9A961]/28 text-[#C9A961] flex items-center justify-center">
                          <Languages className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold">{pick("Idiomas", "Languages", "Idiomas")}</h3>
                      </div>
                      <p className="text-sm leading-7 text-slate-600">
                        {pick(
                          "Fluente em português, inglês e espanhol.",
                          "Fluent in Portuguese, English and Spanish.",
                          "Fluido en portugués, inglés y español."
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#C9A961]/24 bg-white px-5 py-4">
                      <div className="flex items-center gap-3 mb-2 text-slate-900">
                        <div className="w-8 h-8 rounded-full border border-[#C9A961]/28 text-[#C9A961] flex items-center justify-center">
                          <Globe2 className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold">{pick("Presença", "Reach", "Alcance")}</h3>
                      </div>
                      <p className="text-sm leading-7 text-slate-600">
                        {pick(
                          "Mais de 30.000 pessoas em comunidade em torno de Change, Transformation, Technology & Innovation.",
                          "More than 30,000 people in a community built around Change, Transformation, Technology & Innovation.",
                          "Más de 30.000 personas en comunidad en torno a Change, Transformation, Technology & Innovation."
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-18">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-[30px] border border-slate-900 bg-slate-950 text-white px-7 py-8 md:px-10 md:py-10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  {pick(
                    "Explorar o ecossistema Share2Inspire",
                    "Explore the Share2Inspire ecosystem",
                    "Explora el ecosistema Share2Inspire"
                  )}
                </h2>
                <p className="text-slate-300 leading-8 mb-7">
                  {pick(
                    "Se quiseres perceber como as ferramentas se articulam com o teu contexto, podes começar pelos serviços, navegar pelo Knowledge Hub ou entrar em contacto para uma conversa mais direccionada.",
                    "If you want to understand how the tools fit your context, you can start with the services page, explore the Knowledge Hub or get in touch for a more directed conversation.",
                    "Si quieres entender cómo encajan las herramientas en tu contexto, puedes empezar por la página de servicios, explorar el Knowledge Hub o ponerte en contacto para una conversación más enfocada."
                  )}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-3 max-w-4xl mx-auto">
                <a
                  href={localePath("/servicos")}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-gradient-to-r from-[#C9A961] to-[#B8943D] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {pick("Ver serviços", "View services", "Ver servicios")}
                </a>
                <a
                  href={localePath("/conhecimento")}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
                >
                  {pick("Explorar conhecimento", "Explore knowledge", "Explorar conocimiento")}
                </a>
                <a
                  href={localePath("/contactos")}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
                >
                  {pick("Entrar em contacto", "Get in touch", "Contactar")}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <S2IFooter />
    </div>
  );
}
