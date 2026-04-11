import { Clock3, Linkedin, Mail, MessageSquare } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import useTranslation from "@/i18n/useTranslation";
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";

export default function ContactPage() {
  const { pick } = useTranslation();
  usePageSEO(pageSeo.contact);

  const cards = [
    {
      icon: <Mail className="w-4 h-4" />,
      title: pick("E-mail", "Email", "Correo electrónico"),
      body: "geral@share2inspire.pt",
      href: "mailto:geral@share2inspire.pt",
    },
    {
      icon: <Linkedin className="w-4 h-4" />,
      title: "LinkedIn",
      body: pick(
        "Acompanha novidades e actualizações da Share2Inspire.",
        "Follow Share2Inspire news and updates.",
        "Sigue las novedades y actualizaciones de Share2Inspire."
      ),
      href: "https://www.linkedin.com/company/107046213",
    },
    {
      icon: <Clock3 className="w-4 h-4" />,
      title: pick("Resposta", "Response time", "Tiempo de respuesta"),
      body: pick(
        "Normalmente respondemos em 1 a 2 dias úteis.",
        "We usually reply within 1 to 2 business days.",
        "Normalmente respondemos en 1 a 2 días laborables."
      ),
      href: "mailto:geral@share2inspire.pt",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <S2IHeader activePage="contactos" />

      <main className="bg-white">
        <section className="border-b border-[#C9A961]/20 bg-gradient-to-b from-[#fbfaf7] via-white to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-18 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C9A961] mb-3">
              {pick("Contactos", "Contact", "Contacto")}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              {pick("Fala connosco", "Get in touch", "Habla con nosotros")}
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

        <section className="py-8 md:py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="rounded-[30px] border border-[#C9A961]/22 bg-white overflow-hidden shadow-[0_22px_70px_-52px_rgba(15,23,42,0.35)]">
              <div className="grid lg:grid-cols-[1.05fr_0.95fr] divide-y lg:divide-y-0 lg:divide-x divide-[#C9A961]/16">
                <div className="p-7 md:p-9 lg:p-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 text-[#C9A961] flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <h2 className="text-2xl font-bold">
                      {pick("Como podemos ajudar", "How we can help", "Cómo podemos ayudar")}
                    </h2>
                  </div>

                  <div className="space-y-4 text-slate-600 leading-8">
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

                <div className="p-5 md:p-6 lg:p-7 bg-[#fcfbf8]">
                  <div className="grid gap-3">
                    {cards.map((card, index) => (
                      <a
                        key={card.title}
                        href={card.href}
                        target={card.href.startsWith("http") ? "_blank" : undefined}
                        rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={`block rounded-2xl border border-[#C9A961]/24 bg-white px-5 py-4 transition-colors hover:border-[#C9A961]/40 hover:bg-[#fffdfa] ${index === 2 ? "sm:col-span-2 lg:col-span-1" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full border border-[#C9A961]/28 text-[#C9A961] flex items-center justify-center shrink-0 mt-0.5">
                            {card.icon}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 mb-1.5">{card.title}</h3>
                            <p className="text-sm leading-7 text-slate-600">{card.body}</p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <S2IFooter />
    </div>
  );
}
