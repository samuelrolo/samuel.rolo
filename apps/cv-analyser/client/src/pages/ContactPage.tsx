import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Globe2,
  Linkedin,
  Mail,
  MessageSquare,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useTranslation from "@/i18n/useTranslation";
import { pageSeo } from "@/lib/pageSeo";
import { usePageSEO } from "@/lib/seo";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  privacyAccepted: boolean;
};

type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

const INITIAL_FORM: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  privacyAccepted: false,
};

async function notifyContactEmail(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    await fetch("https://share2inspire-beckend.lm.r.appspot.com/api/feedback/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        phone: "",
        subject: payload.subject,
        message: payload.message,
        source: "website_contact",
      }),
    });
  } catch (error) {
    console.warn("Contact email notification failed:", error);
  }
}

async function insertContactMessage(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const insertPayload = {
    name: payload.name,
    email: payload.email,
    phone: null,
    subject: payload.subject,
    message: payload.message,
    source: "website_contact",
    status: "novo",
  };

  const { error } = await supabase.from("contact_messages").insert(insertPayload);

  if (!error) return;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(insertPayload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || error.message || "Unable to save contact message");
  }
}

function ContactInfoCard({
  icon,
  title,
  body,
  href,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_28px_70px_-48px_rgba(16,185,129,0.25)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-slate-950">{title}</h3>
      <p className="text-sm leading-7 text-slate-600">{body}</p>
    </div>
  );

  if (!href) return content;

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="block"
    >
      {content}
    </a>
  );
}

export default function ContactPage() {
  const { pick, localePath } = useTranslation();
  usePageSEO(pageSeo.contact);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<ContactFormErrors>({});

  const privacyHref = localePath("/politica-privacidade");

  const cards = useMemo(
    () => [
      {
        icon: <Mail className="h-4 w-4" />,
        title: pick("Email principal", "Primary email", "Correo principal"),
        body: "geral@share2inspire.pt",
        href: "mailto:geral@share2inspire.pt",
      },
      {
        icon: <Linkedin className="h-4 w-4" />,
        title: "LinkedIn",
        body: pick(
          "Acompanha actualizações, novidades e novos lançamentos da Share2Inspire.",
          "Follow updates, news and new Share2Inspire launches.",
          "Sigue actualizaciones, novedades y nuevos lanzamientos de Share2Inspire."
        ),
        href: "https://www.linkedin.com/company/107046213",
      },
      {
        icon: <Clock3 className="h-4 w-4" />,
        title: pick("Tempo de resposta", "Response time", "Tiempo de respuesta"),
        body: pick(
          "Respondemos habitualmente em 1 a 2 dias úteis, com contexto e próximos passos claros.",
          "We usually reply within 1 to 2 business days, with context and clear next steps.",
          "Respondemos normalmente en 1 a 2 días laborables, con contexto y próximos pasos claros."
        ),
      },
    ],
    [pick]
  );

  const highlights = useMemo(
    () => [
      pick("Dúvidas sobre ferramentas e relatórios", "Questions about tools and reports", "Dudas sobre herramientas e informes"),
      pick("Parcerias, workshops e projectos de conteúdo", "Partnerships, workshops and content projects", "Colaboraciones, workshops y proyectos de contenido"),
      pick("Apoio para escolher o serviço certo", "Help choosing the right service", "Ayuda para elegir el servicio adecuado"),
    ],
    [pick]
  );

  const nextSteps = useMemo(
    () => [
      {
        icon: <Sparkles className="h-4 w-4" />,
        title: pick("Mensagem centralizada", "Centralised message", "Mensaje centralizado"),
        body: pick(
          "O teu pedido fica registado em sistema para acompanhamento interno e resposta organizada.",
          "Your request is logged in the system for internal follow-up and an organised response.",
          "Tu solicitud queda registrada en el sistema para seguimiento interno y una respuesta organizada."
        ),
      },
      {
        icon: <ShieldCheck className="h-4 w-4" />,
        title: pick("Processo simples", "Simple process", "Proceso simple"),
        body: pick(
          "Só pedimos os dados essenciais para perceber o teu contexto e responder com qualidade.",
          "We only ask for the essential details needed to understand your context and reply properly.",
          "Solo pedimos los datos esenciales para entender tu contexto y responder con calidad."
        ),
      },
      {
        icon: <Globe2 className="h-4 w-4" />,
        title: pick("Resposta em PT, EN ou ES", "Reply in PT, EN or ES", "Respuesta en PT, EN o ES"),
        body: pick(
          "A experiência adapta-se ao idioma do site e a equipa mantém o mesmo tom nas respostas.",
          "The experience adapts to the site language and the team keeps the same tone in replies.",
          "La experiencia se adapta al idioma del sitio y el equipo mantiene el mismo tono en las respuestas."
        ),
      },
    ],
    [pick]
  );

  function updateField<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setForm(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  }

  function validateForm(values: ContactFormState) {
    const nextErrors: ContactFormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.name.trim()) {
      nextErrors.name = pick("Indica o teu nome.", "Please enter your name.", "Indica tu nombre.");
    }

    if (!values.email.trim()) {
      nextErrors.email = pick("Indica o teu email.", "Please enter your email.", "Indica tu correo.");
    } else if (!emailRegex.test(values.email.trim())) {
      nextErrors.email = pick(
        "Introduce um email válido.",
        "Please enter a valid email address.",
        "Introduce un correo válido."
      );
    }

    if (!values.subject.trim()) {
      nextErrors.subject = pick("Escolhe um assunto claro.", "Please add a clear subject.", "Añade un asunto claro.");
    }

    if (!values.message.trim()) {
      nextErrors.message = pick("Escreve a tua mensagem.", "Please write your message.", "Escribe tu mensaje.");
    } else if (values.message.trim().length < 12) {
      nextErrors.message = pick(
        "Partilha um pouco mais de contexto para conseguirmos ajudar.",
        "Please share a bit more context so we can help properly.",
        "Comparte un poco más de contexto para que podamos ayudarte mejor."
      );
    }

    if (!values.privacyAccepted) {
      nextErrors.privacyAccepted = pick(
        "Precisas de aceitar a Política de Privacidade para continuar.",
        "You need to accept the Privacy Policy to continue.",
        "Necesitas aceptar la Política de Privacidad para continuar."
      );
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    };

    setIsSubmitting(true);

    try {
      await insertContactMessage(payload);
      await notifyContactEmail(payload);
      toast.success(
        pick(
          "Mensagem enviada com sucesso. Vamos responder brevemente.",
          "Message sent successfully. We will reply shortly.",
          "Mensaje enviado con éxito. Responderemos en breve."
        )
      );
      setForm(INITIAL_FORM);
      setErrors({});
      setIsModalOpen(false);
    } catch (error) {
      console.error("Contact form submission failed:", error);
      toast.error(
        pick(
          "Não foi possível enviar a mensagem. Tenta novamente dentro de instantes.",
          "We could not send your message. Please try again in a moment.",
          "No hemos podido enviar tu mensaje. Inténtalo de nuevo en un momento."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <S2IHeader activePage="contactos" />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <main className="bg-white">
          <section className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#ffffff_100%)]">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {pick("Contactos", "Contact", "Contacto")}
                </p>
                <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  {pick(
                    "Fala connosco com contexto, clareza e uma resposta humana.",
                    "Reach out with context, clarity and a human reply.",
                    "Escríbenos con contexto, claridad y una respuesta humana."
                  )}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                  {pick(
                    "Se tens dúvidas sobre as ferramentas, queres explorar uma parceria ou perceber qual o serviço mais indicado para o teu momento, envia-nos uma mensagem. O formulário de contacto volta a ser o ponto central desta página e liga diretamente ao acompanhamento interno da equipa.",
                    "If you have questions about the tools, want to explore a partnership or need help choosing the right service for your situation, send us a message. The contact form is once again the centrepiece of this page and connects directly to the team’s internal follow-up workflow.",
                    "Si tienes dudas sobre las herramientas, quieres explorar una colaboración o necesitas ayuda para elegir el servicio adecuado para tu momento, envíanos un mensaje. El formulario de contacto vuelve a ser el elemento central de esta página y conecta directamente con el seguimiento interno del equipo."
                  )}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {highlights.map(item => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="leading-6">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <DialogTrigger asChild>
                    <Button className="h-12 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(16,185,129,0.65)] hover:bg-emerald-700">
                      {pick("Abrir formulário de contacto", "Open contact form", "Abrir formulario de contacto")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>

                  <a
                    href="mailto:geral@share2inspire.pt"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
                  >
                    <Mail className="h-4 w-4" />
                    {pick("Enviar email direto", "Send direct email", "Enviar correo directo")}
                  </a>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_34px_90px_-58px_rgba(15,23,42,0.38)]">
                  <div className="border-b border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 px-6 py-6 text-white sm:px-7">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200/90">
                          {pick("Mensagem", "Message", "Mensaje")}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold">
                          {pick("Canal de contacto restaurado", "Contact channel restored", "Canal de contacto restaurado")}
                        </h2>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-200 backdrop-blur">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                    </div>

                    <p className="text-sm leading-7 text-slate-200/90">
                      {pick(
                        "As mensagens enviadas por este modal ficam registadas no sistema para aparecerem novamente na área de Mensagens do dashboard admin-analytics.",
                        "Messages sent through this modal are stored in the system so they appear again in the Messages area of the admin-analytics dashboard.",
                        "Los mensajes enviados a través de este modal se guardan en el sistema para volver a aparecer en el área de Mensajes del panel admin-analytics."
                      )}
                    </p>
                  </div>

                  <div className="grid gap-4 bg-white px-6 py-6 sm:px-7">
                    <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        {pick("Elemento central", "Central element", "Elemento central")}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {pick(
                          "O formulário vive num modal limpo, responsivo e discreto, preparado para dúvidas, pedidos comerciais e oportunidades de colaboração.",
                          "The form lives in a clean, responsive and understated modal, ready for questions, commercial requests and collaboration opportunities.",
                          "El formulario vive en un modal limpio, responsive y discreto, preparado para dudas, solicitudes comerciales y oportunidades de colaboración."
                        )}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {nextSteps.map(step => (
                        <div
                          key={step.title}
                          className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4"
                        >
                          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                            {step.icon}
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                          <p className="mt-2 text-xs leading-6 text-slate-600">{step.body}</p>
                        </div>
                      ))}
                    </div>

                    <DialogTrigger asChild>
                      <button className="group inline-flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/60">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {pick("Queres enviar uma mensagem agora?", "Ready to send your message?", "¿Quieres enviar un mensaje ahora?")}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {pick(
                              "Abre o modal e partilha connosco o teu contexto em menos de um minuto.",
                              "Open the modal and share your context with us in less than a minute.",
                              "Abre el modal y comparte tu contexto con nosotros en menos de un minuto."
                            )}
                          </p>
                        </div>
                        <span className="ml-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white transition-transform group-hover:translate-x-1">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </button>
                    </DialogTrigger>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-8 md:py-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="grid gap-4 md:grid-cols-3">
                {cards.map(card => (
                  <ContactInfoCard
                    key={card.title}
                    icon={card.icon}
                    title={card.title}
                    body={card.body}
                    href={card.href}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>

        <DialogContent className="max-h-[92vh] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_40px_120px_-56px_rgba(15,23,42,0.52)] sm:max-w-2xl">
          <div className="grid overflow-hidden sm:grid-cols-[0.92fr_1.08fr]">
            <div className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 px-6 py-7 text-white sm:border-r sm:border-b-0 sm:px-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-200 backdrop-blur">
                <SendHorizontal className="h-5 w-5" />
              </div>
              <DialogHeader className="mt-5 space-y-3 text-left">
                <DialogTitle className="text-2xl font-semibold tracking-tight text-white">
                  {pick("Enviar mensagem", "Send a message", "Enviar mensaje")}
                </DialogTitle>
                <DialogDescription className="text-sm leading-7 text-slate-200/90">
                  {pick(
                    "Partilha connosco a tua questão, o objetivo da conversa ou o tipo de colaboração que tens em mente. O registo segue diretamente para a equipa e para o dashboard interno.",
                    "Share your question, the goal of the conversation or the type of collaboration you have in mind. The submission goes directly to the team and the internal dashboard.",
                    "Comparte tu pregunta, el objetivo de la conversación o el tipo de colaboración que tienes en mente. El registro se envía directamente al equipo y al panel interno."
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    {pick("Inclui", "Includes", "Incluye")}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200/90">
                    {highlights.map(item => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    {pick("Resposta habitual", "Typical response", "Respuesta habitual")}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-200/90">
                    {pick(
                      "Normalmente respondemos em 1 a 2 dias úteis, por email, com indicação do melhor próximo passo.",
                      "We usually reply by email within 1 to 2 business days with guidance on the best next step.",
                      "Normalmente respondemos por correo en 1 a 2 días laborables con orientación sobre el mejor siguiente paso."
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-7 sm:px-7">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="contact-name" className="text-sm font-medium text-slate-800">
                      {pick("Nome", "Name", "Nombre")}
                    </label>
                    <Input
                      id="contact-name"
                      value={form.name}
                      onChange={event => updateField("name", event.target.value)}
                      placeholder={pick("O teu nome", "Your name", "Tu nombre")}
                      className="h-11 rounded-2xl border-slate-200 bg-slate-50 px-4 shadow-none focus-visible:border-emerald-300 focus-visible:ring-emerald-100"
                    />
                    {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="text-sm font-medium text-slate-800">
                      {pick("Email", "Email", "Correo")}
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={event => updateField("email", event.target.value)}
                      placeholder={pick("o-teu@email.com", "your@email.com", "tu@email.com")}
                      className="h-11 rounded-2xl border-slate-200 bg-slate-50 px-4 shadow-none focus-visible:border-emerald-300 focus-visible:ring-emerald-100"
                    />
                    {errors.email ? <p className="text-xs text-rose-600">{errors.email}</p> : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-subject" className="text-sm font-medium text-slate-800">
                    {pick("Assunto", "Subject", "Asunto")}
                  </label>
                  <Input
                    id="contact-subject"
                    value={form.subject}
                    onChange={event => updateField("subject", event.target.value)}
                    placeholder={pick(
                      "Ex.: Parceria, suporte, workshop ou questão sobre serviços",
                      "E.g. partnership, support, workshop or service question",
                      "Ej.: colaboración, soporte, workshop o consulta sobre servicios"
                    )}
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 px-4 shadow-none focus-visible:border-emerald-300 focus-visible:ring-emerald-100"
                  />
                  {errors.subject ? <p className="text-xs text-rose-600">{errors.subject}</p> : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-message" className="text-sm font-medium text-slate-800">
                    {pick("Mensagem", "Message", "Mensaje")}
                  </label>
                  <Textarea
                    id="contact-message"
                    value={form.message}
                    onChange={event => updateField("message", event.target.value)}
                    placeholder={pick(
                      "Conta-nos o teu contexto, o que procuras e como podemos ajudar.",
                      "Tell us about your context, what you need and how we can help.",
                      "Cuéntanos tu contexto, qué necesitas y cómo podemos ayudarte."
                    )}
                    className="min-h-36 rounded-[22px] border-slate-200 bg-slate-50 px-4 py-3 shadow-none focus-visible:border-emerald-300 focus-visible:ring-emerald-100"
                  />
                  {errors.message ? <p className="text-xs text-rose-600">{errors.message}</p> : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.privacyAccepted}
                      onChange={event => updateField("privacyAccepted", event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      {pick("Li e aceito a ", "I have read and accept the ", "He leído y acepto la ")}
                      <a href={privacyHref} className="font-medium text-emerald-700 underline-offset-4 hover:underline">
                        {pick("Política de Privacidade", "Privacy Policy", "Política de Privacidad")}
                      </a>
                      {pick(
                        ", autorizando o tratamento desta mensagem para resposta e acompanhamento.",
                        ", authorising the processing of this message for response and follow-up.",
                        ", autorizando el tratamiento de este mensaje para respuesta y seguimiento."
                      )}
                    </span>
                  </label>
                  {errors.privacyAccepted ? (
                    <p className="mt-2 text-xs text-rose-600">{errors.privacyAccepted}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-6 text-slate-500">
                    {pick(
                      "Os teus dados são usados apenas para gerir este contacto e responder com contexto.",
                      "Your data is only used to manage this contact request and respond properly.",
                      "Tus datos solo se utilizan para gestionar esta solicitud de contacto y responder adecuadamente."
                    )}
                  </p>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    {isSubmitting
                      ? pick("A enviar...", "Sending...", "Enviando...")
                      : pick("Enviar mensagem", "Send message", "Enviar mensaje")}
                    {!isSubmitting ? <SendHorizontal className="h-4 w-4" /> : null}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <S2IFooter />
    </div>
  );
}
