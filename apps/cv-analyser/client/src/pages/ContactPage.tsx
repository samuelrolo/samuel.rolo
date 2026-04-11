import { useEffect } from "react";
import { Clock3, Linkedin, Mail, MessageSquare } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import useTranslation from "@/i18n/useTranslation";
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";

export default function ContactPage() {
  const { pick, lang } = useTranslation();
  usePageSEO(pageSeo.contact);

  const cards = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: pick("E-mail", "Email", "Correo electrónico"),
      body: "geral@share2inspire.pt",
      href: "mailto:geral@share2inspire.pt",
    },
    {
      icon: <Linkedin className="w-5 h-5" />,
      title: "LinkedIn",
      body: pick("Acompanha novidades e actualizações da Share2Inspire.", "Follow Share2Inspire news and updates.", "Sigue las novedades y actualizaciones de Share2Inspire."),
      href: "https://www.linkedin.com/company/107046213",
    },
    {
      icon: <Clock3 className="w-5 h-5" />,
      title: pick("Resposta", "Response time", "Tiempo de respuesta"),
      body: pick("Normalmente respondemos em 1 a 2 dias úteis.", "We usually reply within 1 to 2 business days.", "Normalmente respondemos en 1 a 2 días laborables."),
      href: "mailto:geral@share2inspire.pt",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <S2IHeader activePage="contactos" />

      <main>
        <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A961] mb-4">
              {pick("Contactos", "Contact", "Contacto")}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {pick(
                "Fala connosco",
                "Get in touch",
                "Habla con nosotros"
              )}
            </h1>
            <p className="max-w-3xl mx-auto text-base md:text-lg leading-8 text-slate-600">
              {pick(
                "Se tens dúvidas sobre as ferramentas, parcerias ou serviços da Share2Inspire, entra em contacto. Teremos todo o gosto em perceber o teu contexto e indicar o caminho mais adequado.",
                "If you have questions about Share2Inspire tools, partnerships or services, get in touch. We will be happy to understand your context and point you in the right direction.",
                "Si tienes dudas sobre las herramientas, colaboraciones o servicios de Share2Inspire, ponte en contacto. Estaremos encantados de entender tu contexto e indicarte el camino más adecuado."
              )}
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#C9A961]/10 text-[#C9A961] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">
                  {pick("Como podemos ajudar", "How we can help", "Cómo podemos ayudar")}
                </h2>
              </div>
              <div className="space-y-5 text-slate-600 leading-8">
                <p>
                  {pick(
                    "A Share2Inspire apoia profissionais e estudantes que querem melhorar o CV, optimizar o LinkedIn, clarificar o próximo passo de carreira ou comparar opções com mais confiança.",
                    "Share2Inspire supports professionals and students who want to improve their CV, optimise LinkedIn, clarify their next career step or compare options with more confidence.",
                    "Share2Inspire apoya a profesionales y estudiantes que quieren mejorar su CV, optimizar LinkedIn, aclarar el siguiente paso de su carrera o comparar opciones con mayor confianza."
                  )}
                </p>
                <p>
                  {pick(
                    "Também estamos disponíveis para falar sobre parcerias, projectos de conteúdo, workshops ou colaborações ligadas a empregabilidade, carreira e desenvolvimento profissional.",
                    "We are also available to discuss partnerships, content projects, workshops or collaborations related to employability, careers and professional development.",
                    "También estamos disponibles para hablar sobre colaboraciones, proyectos de contenido, workshops o iniciativas relacionadas con empleabilidad, carrera y desarrollo profesional."
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {cards.map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  target={card.href.startsWith('http') ? '_blank' : undefined}
                  rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block rounded-3xl border border-slate-200 bg-slate-50 p-6 hover:border-[#C9A961]/40 hover:bg-white transition-colors"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white text-[#C9A961] flex items-center justify-center mb-4 shadow-sm">
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{card.body}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <S2IFooter />
    </div>
  );
}
