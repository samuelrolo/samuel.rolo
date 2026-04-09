import { useEffect } from "react";
import { Award, Briefcase, Brain, GraduationCap } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import useTranslation from "@/i18n/useTranslation";

export default function AboutPage() {
  const { pick, lang, localePath } = useTranslation();

  useEffect(() => {
    document.title = pick(
      "Sobre | Share2Inspire",
      "About | Share2Inspire",
      "Sobre | Share2Inspire"
    );
  }, [lang, pick]);

  const pillars = [
    {
      icon: <Briefcase className="w-5 h-5" />,
      title: pick("Experiência real de mercado", "Real market experience", "Experiencia real de mercado"),
      text: pick(
        "Mais de uma década a trabalhar em consultoria, transformação organizacional e desenvolvimento de talento em contextos empresariais exigentes.",
        "More than a decade working in consulting, organisational transformation and talent development across demanding business contexts.",
        "Más de una década trabajando en consultoría, transformación organizacional y desarrollo de talento en contextos empresariales exigentes."
      ),
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: pick("IA aplicada à carreira", "AI applied to careers", "IA aplicada a la carrera"),
      text: pick(
        "A Share2Inspire combina análise estratégica, conteúdo accionável e tecnologia para transformar CV, LinkedIn e decisões de carreira em vantagem competitiva.",
        "Share2Inspire combines strategic analysis, actionable content and technology to turn CVs, LinkedIn and career decisions into a competitive advantage.",
        "Share2Inspire combina análisis estratégico, contenido accionable y tecnología para convertir CV, LinkedIn y decisiones de carrera en una ventaja competitiva."
      ),
    },
    {
      icon: <GraduationCap className="w-5 h-5" />,
      title: pick("Foco em empregabilidade", "Focus on employability", "Enfoque en empleabilidad"),
      text: pick(
        "Cada ferramenta foi desenhada para ajudar profissionais e estudantes a perceber o seu posicionamento, reduzir bloqueios e avançar com clareza.",
        "Each tool was designed to help professionals and students understand their positioning, reduce blockers and move forward with clarity.",
        "Cada herramienta fue diseñada para ayudar a profesionales y estudiantes a entender su posicionamiento, reducir bloqueos y avanzar con claridad."
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <S2IHeader activePage="sobre" />

      <main>
        <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A961] mb-4">
              {pick("Share2Inspire", "Share2Inspire", "Share2Inspire")}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {pick(
                "Sobre a Share2Inspire",
                "About Share2Inspire",
                "Sobre Share2Inspire"
              )}
            </h1>
            <p className="max-w-3xl mx-auto text-base md:text-lg leading-8 text-slate-600">
              {pick(
                "A Share2Inspire nasceu para tornar decisões de carreira mais claras, mais estratégicas e menos dependentes de tentativa e erro. O projecto junta experiência em consultoria, orientação profissional e inteligência artificial para criar análises práticas, accionáveis e alinhadas com o mercado.",
                "Share2Inspire was created to make career decisions clearer, more strategic and less dependent on trial and error. The project combines consulting experience, career guidance and artificial intelligence to deliver practical, actionable analyses aligned with the market.",
                "Share2Inspire nació para hacer que las decisiones de carrera sean más claras, más estratégicas y menos dependientes del ensayo y error. El proyecto combina experiencia en consultoría, orientación profesional e inteligencia artificial para ofrecer análisis prácticos, accionables y alineados con el mercado."
              )}
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#C9A961]/10 text-[#C9A961] flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">
                  {pick("Quem está por detrás", "Who is behind it", "Quién está detrás")}
                </h2>
              </div>
              <div className="space-y-5 text-slate-600 leading-8">
                <p>
                  {pick(
                    "Samuel Rolo desenvolveu a Share2Inspire com o objectivo de aproximar estratégia, empregabilidade e tecnologia. O foco não é produzir relatórios genéricos, mas sim ajudar cada pessoa a perceber onde está, o que a está a limitar e qual é o próximo passo com maior retorno.",
                    "Samuel Rolo developed Share2Inspire with the goal of bringing strategy, employability and technology closer together. The aim is not to produce generic reports, but to help each person understand where they stand, what is limiting them and what next step offers the highest return.",
                    "Samuel Rolo desarrolló Share2Inspire con el objetivo de acercar estrategia, empleabilidad y tecnología. El objetivo no es producir informes genéricos, sino ayudar a cada persona a entender dónde está, qué la está limitando y cuál es el siguiente paso con mayor retorno."
                  )}
                </p>
                <p>
                  {pick(
                    "Ao longo do projecto, a prioridade tem sido transformar informação complexa em orientação útil: desde o diagnóstico do CV até ao desenho de percursos de carreira e à comparação entre diferentes opções profissionais.",
                    "Throughout the project, the priority has been to turn complex information into useful guidance: from CV diagnosis to career path design and the comparison of different professional options.",
                    "A lo largo del proyecto, la prioridad ha sido transformar información compleja en orientación útil: desde el diagnóstico del CV hasta el diseño de trayectorias profesionales y la comparación entre diferentes opciones laborales."
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-3 gap-6">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="w-10 h-10 rounded-2xl bg-white text-[#C9A961] flex items-center justify-center mb-4 shadow-sm">
                    {pillar.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{pillar.title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{pillar.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {pick(
                  "Queres explorar as ferramentas?",
                  "Want to explore the tools?",
                  "¿Quieres explorar las herramientas?"
                )}
              </h2>
              <p className="text-slate-300 leading-8 max-w-2xl mx-auto mb-8">
                {pick(
                  "Podes começar pelo CV Analyser, descobrir o teu próximo passo com o Career Path ou comparar cenários com o Career Intelligence.",
                  "You can start with CV Analyser, discover your next step with Career Path or compare scenarios with Career Intelligence.",
                  "Puedes empezar con CV Analyser, descubrir tu próximo paso con Career Path o comparar escenarios con Career Intelligence."
                )}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={localePath('/servicos')} className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white font-semibold transition-colors">
                  {pick("Ver serviços", "View services", "Ver servicios")}
                </a>
                <a href={localePath('/contactos')} className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 font-semibold transition-colors">
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
