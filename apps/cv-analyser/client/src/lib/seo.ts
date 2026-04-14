import { useEffect } from "react";

export type LocalizedSEOText = {
  pt: string;
  en: string;
  es: string;
};

type SupportedLang = "pt" | "en" | "es";

export type SEOConfig = {
  canonicalPtPath: string;
  title: LocalizedSEOText;
  description: LocalizedSEOText;
  image?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
};

const SITE_NAME = "Share2Inspire";
const SITE_URL = "https://share2inspire.pt";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-share2inspire.png`;
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex, nofollow, noarchive";

const ptCanonicalMap: Record<string, { en: string; es: string }> = {
  "/": { en: "/en", es: "/es" },
  "/cv-analyser": { en: "/en/cv-analyser", es: "/es/cv-analyser" },
  "/career-path": { en: "/en/career-path", es: "/es/career-path" },
  "/career-intelligence": { en: "/en/career-intelligence", es: "/es/career-intelligence" },
  "/linkedin-roaster": { en: "/en/linkedin-roaster", es: "/es/linkedin-roaster" },
  "/bundle": { en: "/en/bundle", es: "/es/bundle" },
  "/estudante": { en: "/en/student-pack", es: "/es/pack-estudiante" },
  "/servicos": { en: "/en/services", es: "/es/servicios" },
  "/conhecimento": { en: "/en/knowledge", es: "/es/conocimiento" },
  "/sobre": { en: "/en/about", es: "/es/sobre" },
  "/contactos": { en: "/en/contact", es: "/es/contacto" },
  "/politica-privacidade": { en: "/en/privacy-policy", es: "/es/politica-privacidad" },
  "/politica-cookies": { en: "/en/cookie-policy", es: "/es/politica-cookies" },
  "/informacao-legal": { en: "/en/legal-information", es: "/es/informacion-legal" },
  "/termos-condicoes": { en: "/en/terms-and-conditions", es: "/es/terminos-condiciones" },
  "/tratamento-dados": { en: "/en/data-processing", es: "/es/tratamiento-datos" },
};

function getCurrentLang(pathname: string): SupportedLang {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/es" || pathname.startsWith("/es/")) return "es";
  return "pt";
}

function pathForLang(canonicalPtPath: string, lang: SupportedLang): string {
  if (lang === "pt") return canonicalPtPath;
  return ptCanonicalMap[canonicalPtPath]?.[lang] || `/${lang}${canonicalPtPath}`;
}

function toAbsoluteUrl(path: string): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path}`;
}

function getOgLocale(lang: SupportedLang): string {
  if (lang === "en") return "en_GB";
  if (lang === "es") return "es_ES";
  return "pt_PT";
}

function setMeta(selector: string, attr: "name" | "property", value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, selector.match(/\[(?:name|property)="([^"]+)"\]/)?.[1] || "");
    document.head.appendChild(element);
  }
  element.setAttribute(attr, selector.match(/\[(?:name|property)="([^"]+)"\]/)?.[1] || "");
  element.setAttribute("content", value);
}

function setMetaByName(name: string, value: string) {
  setMeta(`meta[name="${name}"]`, "name", value);
}

function setMetaByProperty(property: string, value: string) {
  setMeta(`meta[property="${property}"]`, "property", value);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function setAlternate(hreflang: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", hreflang);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export function usePageSEO({
  canonicalPtPath,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
}: SEOConfig) {
  useEffect(() => {
    const lang = getCurrentLang(window.location.pathname);
    const pageTitle = title[lang];
    const pageDescription = description[lang];
    const canonicalUrl = toAbsoluteUrl(pathForLang(canonicalPtPath, lang));
    const ptUrl = toAbsoluteUrl(pathForLang(canonicalPtPath, "pt"));
    const enUrl = toAbsoluteUrl(pathForLang(canonicalPtPath, "en"));
    const esUrl = toAbsoluteUrl(pathForLang(canonicalPtPath, "es"));

    document.documentElement.lang = lang;
    document.title = pageTitle;

    setMetaByName("description", pageDescription);
    setMetaByName("robots", noindex ? NOINDEX_ROBOTS : DEFAULT_ROBOTS);
    setCanonical(canonicalUrl);
    setAlternate("pt", ptUrl);
    setAlternate("en", enUrl);
    setAlternate("es", esUrl);
    setAlternate("x-default", ptUrl);

    setMetaByProperty("og:title", pageTitle);
    setMetaByProperty("og:description", pageDescription);
    setMetaByProperty("og:image", image);
    setMetaByProperty("og:url", canonicalUrl);
    setMetaByProperty("og:type", type);
    setMetaByProperty("og:locale", getOgLocale(lang));
    setMetaByProperty("og:site_name", SITE_NAME);

    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", pageTitle);
    setMetaByName("twitter:description", pageDescription);
    setMetaByName("twitter:image", image);
    setMetaByName("twitter:url", canonicalUrl);
  }, [
    canonicalPtPath,
    title.pt,
    title.en,
    title.es,
    description.pt,
    description.en,
    description.es,
    image,
    type,
    noindex,
  ]);
}
