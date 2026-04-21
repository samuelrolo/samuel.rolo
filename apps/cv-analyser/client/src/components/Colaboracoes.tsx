import useTranslation from "@/i18n/useTranslation";

export default function Colaboracoes() {
  const { pick } = useTranslation();

  return (
    <section className="py-12 md:py-16 px-6 bg-[#faf8f4] border-t border-slate-100">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#C9A961] mb-6">
          {pick("Colaborações", "Collaborations", "Colaboraciones")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          <a
            href="https://www.aeiscal.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100 transition-opacity duration-200"
            title="AEIscal"
          >
            <img
              src="/images/aeiscal-logo.png"
              alt="AEIscal — Associação de Estudantes do ISCAL"
              loading="lazy"
              decoding="async"
              className="h-12 md:h-16 w-auto object-contain"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
