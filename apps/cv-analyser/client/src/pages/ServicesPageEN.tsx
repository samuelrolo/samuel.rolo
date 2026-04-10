// ServicesPageEN — Services Share2Inspire (EN)
// Sections: Hero, Stats, Phase 1 (Diagnose), Phase 2 (Decide), FAQ, CTA Final, Testimonials
import { useState, useEffect } from "react";
import { FileText, Linkedin, Route, Zap, GraduationCap, Rocket, ChevronDown, Star, Check, ArrowRight } from "lucide-react";
import S2IHeader from "@/components/S2IHeader";
import S2IFooterEN from "@/components/S2IFooterEN";

/* ─── DATA ─── */
const phase1Services = [
  {
    icon: <FileText className="w-6 h-6" />,
    badge: "FREE",
    badgeColor: "bg-[#C9A961] text-white",
    title: "CV Analyser",
    desc: "See in seconds why your CV isn't generating interviews.",
    features: [
      "Discover your employability score",
      "Identify what recruiters aren't seeing",
      "Get a concrete improvement plan",
    ],
    detail: "Instant AI diagnosis. Maturity score 0-100, ATS rejection rate, PDF report with 15+ recommendations. Free analysis + full report for \u20AC9.99.",
    price: "Free / full \u20AC9.99",
    cta: "Analyse my CV",
    link: "/cv-analyser",
  },
  {
    icon: <Linkedin className="w-6 h-6" />,
    badge: "NEW",
    badgeColor: "bg-[#0077B5] text-white",
    title: "LinkedIn Roaster",
    desc: "Find out what's blocking your professional visibility.",
    features: [
      "Learn why you don't appear in searches",
      "Fix the mistakes that push recruiters away",
      "Get optimised headlines and keywords",
    ],
    detail: "Complete audit of your LinkedIn profile. Visibility score 0-10, critical errors, SEO keywords and priority recommendation.",
    price: "\u20AC3.99",
    cta: "See what's holding me back",
    link: "/linkedin-roaster",
  },
];

const phase1Bundles = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    badge: "-43%",
    badgeColor: "bg-emerald-500 text-white",
    title: "Student Pack",
    desc: "CV Analyser + LinkedIn Roaster together. Get ready for your first job.",
    features: [
      "Full CV analysis with AI",
      "LinkedIn profile audit",
      "CV \u2194 LinkedIn consistency report (exclusive)",
      "Weekly integrated action plan",
    ],
    oldPrice: "\u20AC13.98",
    price: "\u20AC7.99",
    saving: "Save 43%",
    cta: "Get the Student Pack",
    link: "/estudante",
  },
  {
    badge: "MOST POPULAR",
    badgeColor: "bg-[#C9A961] text-white",
    title: "CV Analyser + Career Path",
    desc: "Full diagnosis + personalised roadmap. Everything you need to get started.",
    oldPrice: "\u20AC38",
    price: "\u20AC29",
    saving: "Save \u20AC9",
    cta: "Get both",
    link: "/bundle",
  },
];

const phase2Services = [
  {
    icon: <Route className="w-6 h-6" />,
    badge: "RECOMMENDED",
    badgeColor: "bg-[#C9A961] text-white",
    title: "Career Path",
    desc: "Stop navigating your career blindly. Know exactly what's next.",
    features: [
      "Get a personalised career roadmap",
      "Identify the gaps between you and the next level",
      "Know how much you can earn at each stage",
    ],
    detail: "Personalised career paths, skills gap analysis, salary estimates by stage, recommended training and a 30-60-90 day plan.",
    price: "\u20AC19.99",
    cta: "Map my path",
    link: "/career-path",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    badge: "COMPLETE",
    badgeColor: "bg-slate-800 text-white",
    title: "Career Intelligence",
    desc: "Make the right decision based on data, not doubt.",
    features: [
      "Compare multiple paths side by side",
      "See what you gain and give up with each option",
      "Get a data-backed recommendation",
    ],
    detail: "Everything in Career Path + strategic decision-making. 3 paths with success probability, side-by-side comparison, trade-offs and a final justified recommendation. Market context included.",
    upgradeNote: "Or start with Career Path (\u20AC19.99) and upgrade for \u20AC29.",
    cta: "Make the right call",
    link: "/career-intelligence",
  },
  {
    icon: <Rocket className="w-6 h-6" />,
    title: "KickStart Pro",
    desc: "Need clarity now? 30 minutes with a specialist and you leave with a plan.",
    features: [
      "Action plan with 3-5 concrete steps",
      "Post-session follow-up included",
    ],
    price: "from \u20AC35",
    cta: "Book session",
    link: "https://calendly.com/share2inspire",
    isExternal: true,
  },
];

const faqs = [
  {
    q: "Is CV Analyser really free?",
    a: "Yes. The initial analysis with maturity score and key recommendations is 100% free. If you want the full report with 15+ detailed recommendations and ATS rate, it costs \u20AC9.99.",
  },
  {
    q: "What's the difference between Career Path and Career Intelligence?",
    a: "Career Path gives you a personalised roadmap with your ideal next step. Career Intelligence goes further: it compares multiple paths, analyses trade-offs and gives you a justified recommendation. If you already know the direction, Career Path is enough. If you're torn between options, Career Intelligence is for you.",
  },
  {
    q: "How long does it take to get results?",
    a: "CV Analyser and LinkedIn Roaster are instant \u2014 you get results in seconds. Career Path and Career Intelligence are generated in under 5 minutes after payment.",
  },
];

const testimonials = [
  { quote: "The KickStart Pro session was transformative. In 30 minutes I had a concrete action plan.", name: "Marta S.", role: "HR Director", initials: "MS" },
  { quote: "LinkedIn Roaster completely changed how I present myself. Got 3 contacts the following week.", name: "Jo\u00E3o F.", role: "Tech Lead", initials: "JF" },
  { quote: "Career Path gave me a clear vision of my next step. I recommend it to any professional in transition.", name: "Ana M.", role: "Senior Manager", initials: "AM" },
  { quote: "CV Analyser identified points I would never have seen. Free and extremely useful.", name: "Ricardo P.", role: "Consultant", initials: "RP" },
];

/* ─── SCHEMA.ORG JSON-LD ─── */
function ServicesSchemaLD() {
  const baseUrl = "https://share2inspire.pt";

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
    "description": "AI-powered career development tools helping professionals take control of their careers.",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "hello@share2inspire.pt",
      "availableLanguage": ["English", "Portuguese", "Spanish"]
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
        "name": "Services",
        "item": `${baseUrl}/en/services`
      }
    ]
  };

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Share2Inspire Career Services",
    "description": "AI-powered career tools: CV analysis, LinkedIn audit, career path planning and strategic career intelligence.",
    "url": `${baseUrl}/en/services`,
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
          "description": "Instant AI-powered CV diagnosis. Employability score 0-100, ATS rejection rate, PDF report with 15+ recommendations.",
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": "CV Analysis",
          "category": "Career Development",
          "offers": [
            {
              "@type": "Offer",
              "name": "Free Analysis",
              "price": "0",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `${baseUrl}/cv-analyser`,
              "description": "Free CV analysis with employability score and key recommendations."
            },
            {
              "@type": "Offer",
              "name": "Full Report",
              "price": "9.99",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `${baseUrl}/cv-analyser`,
              "description": "Full PDF report with 15+ detailed recommendations and ATS rate."
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
          "description": "Complete LinkedIn profile audit. Visibility score 0-10, critical errors, SEO keywords and priority recommendations.",
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": "LinkedIn Profile Audit",
          "category": "Career Development",
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
          "description": "Personalised career roadmap with skills gap analysis, salary estimates by stage, recommended training and a 30-60-90 day plan.",
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": "Career Planning",
          "category": "Career Development",
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
          "description": "Strategic career decision-making. 3 paths with success probability, side-by-side comparison, trade-offs and a final justified recommendation. Market context included.",
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": "Career Intelligence",
          "category": "Career Development",
          "offers": [
            {
              "@type": "Offer",
              "name": "Standard",
              "price": "49.99",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `${baseUrl}/career-intelligence`
            },
            {
              "@type": "Offer",
              "name": "Career Path Upgrade",
              "price": "29.00",
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "url": `${baseUrl}/career-intelligence`,
              "description": "Upgrade price for existing Career Path customers."
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
          "name": "Student Pack",
          "url": `${baseUrl}/estudante`,
          "description": "CV Analyser + LinkedIn Roaster together. Full AI CV analysis, LinkedIn profile audit, CV\u2194LinkedIn consistency report and weekly integrated action plan.",
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": "Career Starter Bundle",
          "category": "Career Development",
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
          "name": "CV Analyser + Career Path Bundle",
          "url": `${baseUrl}/bundle`,
          "description": "Full CV diagnosis + personalised career roadmap. Everything you need to get started — at a discounted bundle price.",
          "provider": { "@id": `${baseUrl}/#organization` },
          "serviceType": "Career Bundle",
          "category": "Career Development",
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
        "name": "Is CV Analyser really free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. The initial analysis with maturity score and key recommendations is 100% free. If you want the full report with 15+ detailed recommendations and ATS rate, it costs \u20AC9.99."
        }
      },
      {
        "@type": "Question",
        "name": "What's the difference between Career Path and Career Intelligence?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Career Path gives you a personalised roadmap with your ideal next step. Career Intelligence goes further: it compares multiple paths, analyses trade-offs and gives you a justified recommendation. If you already know the direction, Career Path is enough. If you're torn between options, Career Intelligence is for you."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to get results?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "CV Analyser and LinkedIn Roaster are instant \u2014 you get results in seconds. Career Path and Career Intelligence are generated in under 5 minutes after payment."
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

/* ─── PAGE ─── */
export default function ServicesPageEN() {
  useEffect(() => {
    document.title = "Services | CV with AI, Career Path & Career Intelligence | Share2Inspire";
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── SCHEMA.ORG JSON-LD ─── */}
      <ServicesSchemaLD />

      <S2IHeader  />

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-light text-slate-900 mb-2 leading-tight">
            Stop guessing.
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Take control of your career.
          </h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
            From diagnosis to strategic decision. AI tools that show you where you are, where you can go, and the best path to get there.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <a
              href="/cv-analyser"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961] to-[#B8943D] text-white font-semibold px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Analyse my CV — Free <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 font-medium px-7 py-3 rounded-full hover:border-[#C9A961] hover:text-[#C9A961] transition-colors"
            >
              View services <ChevronDown className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-slate-400">
            <span className="text-[#C9A961]">⚡</span> Results in seconds &middot; No credit card &middot; No commitment
          </p>
        </div>
      </section>

      {/* ─── PHASE STEPPER ─── */}
      <section className="pb-6 px-6">
        <div className="max-w-md mx-auto flex items-center justify-center gap-8">
          <a href="#phase1" className="flex flex-col items-center gap-1 group">
            <span className="w-10 h-10 rounded-full border-2 border-[#C9A961] flex items-center justify-center text-sm font-bold text-[#C9A961] group-hover:bg-[#C9A961] group-hover:text-white transition-all">1</span>
            <span className="text-xs text-slate-500">Diagnose</span>
          </a>
          <div className="w-16 h-px bg-slate-200" />
          <a href="#phase2" className="flex flex-col items-center gap-1 group">
            <span className="w-10 h-10 rounded-full border-2 border-[#C9A961] flex items-center justify-center text-sm font-bold text-[#C9A961] group-hover:bg-[#C9A961] group-hover:text-white transition-all">2</span>
            <span className="text-xs text-slate-500">Decide</span>
          </a>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-10 px-6 border-y border-slate-100">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-12 flex-wrap">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A961]">+500</p>
            <p className="text-xs text-slate-400">Professionals helped</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A961]">5 <Star className="w-4 h-4 inline text-[#C9A961] -mt-1" /></p>
            <p className="text-xs text-slate-400">Average rating</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C9A961]">98%</p>
            <p className="text-xs text-slate-400">Satisfaction rate</p>
          </div>
        </div>
      </section>

      {/* ─── PHASE 1: DIAGNOSE ─── */}
      <section id="phase1" className="py-20 px-6 scroll-mt-20" style={{ background: "linear-gradient(180deg, #ffffff 0%, #faf8f4 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center text-xs font-bold text-[#C9A961]">1</span>
            <span className="text-[0.65rem] font-bold uppercase tracking-[2.5px] text-[#C9A961]">Phase</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            Understand <strong className="text-[#C9A961]">where you stand</strong>
          </h2>
          <p className="text-sm text-slate-500 mb-10 max-w-xl leading-relaxed">
            Before deciding where to go, you need to know your starting point. These tools give you that clarity — in minutes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {phase1Services.map((svc) => (
              <ServiceCard key={svc.title} svc={svc} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {phase1Bundles.map((svc) => (
              <ServiceCard key={svc.title} svc={svc} featured={svc.badge === "MOST POPULAR"} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRANSITION ─── */}
      <section className="py-8 px-6 text-center bg-[#faf8f4]">
        <a href="#phase2" className="inline-flex items-center gap-2 text-sm font-semibold text-[#C9A961] hover:underline">
          Know where you stand? Decide where to go <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* ─── PHASE 2: DECIDE ─── */}
      <section id="phase2" className="py-20 px-6 scroll-mt-20" style={{ background: "linear-gradient(180deg, #faf8f4 0%, #ffffff 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center text-xs font-bold text-[#C9A961]">2</span>
            <span className="text-[0.65rem] font-bold uppercase tracking-[2.5px] text-[#C9A961]">Phase</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            Decide <strong className="text-[#C9A961]">where to go</strong>
          </h2>
          <p className="text-sm text-slate-500 mb-10 max-w-xl leading-relaxed">
            Knowing where you stand isn't enough. You need to know where to go — and the best path to get there.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phase2Services.map((svc) => (
              <ServiceCard key={svc.title} svc={svc} featured={svc.badge === "RECOMMENDED"} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2 text-center">
            Frequently asked <strong className="text-[#C9A961]">questions</strong>
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
            Ready to stop <strong className="text-[#C9A961]">guessing</strong>?
          </h2>
          <p className="text-sm text-white/50 mb-6 leading-relaxed">
            Start with the free diagnosis. In 30 seconds you'll know where you stand — and what to do next.
          </p>
          <p className="text-xs text-white/30 mb-8">What our clients say</p>
          <div className="flex items-center justify-center gap-8 flex-wrap mb-10">
            <div className="text-center">
              <p className="text-xl font-bold text-[#C9A961]">+500</p>
              <p className="text-[0.65rem] text-white/40">Professionals helped</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#C9A961]">5<Star className="w-3 h-3 inline text-[#C9A961] -mt-0.5 ml-0.5" /></p>
              <p className="text-[0.65rem] text-white/40">Average rating</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[#C9A961]">98%</p>
              <p className="text-[0.65rem] text-white/40">Satisfaction rate</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/cv-analyser"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961] to-[#B8943D] text-white font-semibold px-7 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Analyse my CV — Free
            </a>
            <a
              href="/career-path"
              className="inline-flex items-center gap-2 border border-white/20 text-white font-medium px-7 py-3 rounded-full hover:border-[#C9A961] hover:text-[#C9A961] transition-colors"
            >
              Map my path — \u20AC19.99
            </a>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 px-6 bg-[#faf8f4]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-slate-900 mb-2">
            What our <strong className="text-[#C9A961]">clients</strong> say
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

      <S2IFooterEN />
    </div>
  );
}
