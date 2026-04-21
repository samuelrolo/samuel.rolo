import useTranslation from "@/i18n/useTranslation";

export default function MentionedIn() {
  const { pick } = useTranslation();

  const mentions = [
    {
      name: "e27",
      href: "https://e27.co/share2inspire-thinks-your-cv-isnt-failing-its-being-misread-20260415/",
      logo: (
        <img
          src="/images/e27-logo.png"
          alt="e27"
          loading="lazy"
          decoding="async"
          className="h-8 md:h-10 w-auto object-contain"
        />
      ),
    },
    {
      name: "VibeRank",
      href: "https://viberank.dev/apps/Share2inspire",
      logo: (
        <img
          src="https://viberank.dev/badge?app=Share2inspire&theme=dark"
          alt="Share2inspire on VibeRank"
          loading="lazy"
          decoding="async"
          className="h-8 md:h-10 w-auto object-contain"
        />
      ),
    },
    {
      name: "VentureGaps",
      href: "https://www.venturegaps.com/tools/cv-analyser",
      logo: (
        <span className="inline-flex items-center gap-1.5 text-lg md:text-xl font-bold tracking-tight text-slate-800">
          <span className="text-[#FF3D00]">Venture</span>Gaps
        </span>
      ),
    },
  ];

  return (
    <section className="py-12 md:py-16 px-6 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#C9A961] mb-6">
          {pick("Mencionado em", "Featured in", "Mencionado en")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {mentions.map((m) => (
            <a
              key={m.name}
              href={m.href}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity duration-200"
              title={m.name}
            >
              {m.logo}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
