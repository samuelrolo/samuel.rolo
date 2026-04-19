import type { Lang } from '@/i18n/translations';

export type PageId =
  | 'home'
  | 'cv-analyser'
  | 'career-path'
  | 'career-intelligence'
  | 'linkedin-roaster'
  | 'bundle'
  | 'estudante'
  | 'conhecimento'
  | 'blog'
  | 'servicos'
  | 'sobre'
  | 'contactos'
  | 'politica-privacidade'
  | 'politica-cookies'
  | 'informacao-legal'
  | 'termos-condicoes'
  | 'tratamento-dados'
  | 'area-cliente';

export type RouteGroup = 'menu' | 'service' | 'utility';

export type LocalizedRoute = Record<Lang, string>;

type LocalizedLabels = Record<Lang, string>;

type LocaleVariant = {
  path: string;
  aliases?: string[];
  label?: string;
  menuVisible?: boolean;
};

export type RouteDefinition = {
  id: PageId;
  group: RouteGroup;
  activeMenuId?: PageId;
  allowChildren?: boolean;
  localized: Record<Lang, LocaleVariant>;
};

type FlattenedRouteEntry = {
  pageId: PageId;
  lang: Lang;
  path: string;
  canonicalPath: string;
  isAlias: boolean;
  allowChildren: boolean;
  activeMenuId: PageId;
  group: RouteGroup;
  label?: string;
  menuVisible: boolean;
};

export const MENU_PAGE_IDS: PageId[] = ['home', 'servicos', 'conhecimento', 'blog', 'sobre', 'contactos'];
export const SERVICE_PAGE_IDS = new Set<PageId>([
  'cv-analyser',
  'career-path',
  'career-intelligence',
  'linkedin-roaster',
  'bundle',
  'estudante',
]);

export const routeManifest: RouteDefinition[] = [
  {
    id: 'home',
    group: 'menu',
    localized: {
      pt: { path: '/', aliases: ['/pt'], label: 'Início', menuVisible: true },
      en: { path: '/en', aliases: ['/en/'], label: 'Home', menuVisible: true },
      es: { path: '/es', aliases: ['/es/'], label: 'Inicio', menuVisible: true },
    },
  },
  {
    id: 'cv-analyser',
    group: 'service',
    activeMenuId: 'servicos',
    allowChildren: true,
    localized: {
      pt: { path: '/cv-analyser', label: 'CV Analyser' },
      en: { path: '/en/cv-analyser', label: 'CV Analyser' },
      es: { path: '/es/cv-analyser', label: 'CV Analyser' },
    },
  },
  {
    id: 'career-path',
    group: 'service',
    activeMenuId: 'servicos',
    allowChildren: true,
    localized: {
      pt: { path: '/career-path', label: 'Career Path' },
      en: { path: '/en/career-path', label: 'Career Path' },
      es: { path: '/es/career-path', label: 'Career Path' },
    },
  },
  {
    id: 'career-intelligence',
    group: 'service',
    activeMenuId: 'servicos',
    allowChildren: true,
    localized: {
      pt: { path: '/career-intelligence', label: 'Career Intelligence' },
      en: { path: '/en/career-intelligence', label: 'Career Intelligence' },
      es: { path: '/es/career-intelligence', label: 'Career Intelligence' },
    },
  },
  {
    id: 'linkedin-roaster',
    group: 'service',
    activeMenuId: 'servicos',
    allowChildren: true,
    localized: {
      pt: { path: '/linkedin-roaster', label: 'LinkedIn Roaster' },
      en: { path: '/en/linkedin-roaster', label: 'LinkedIn Roaster' },
      es: { path: '/es/linkedin-roaster', label: 'LinkedIn Roaster' },
    },
  },
  {
    id: 'bundle',
    group: 'service',
    activeMenuId: 'servicos',
    localized: {
      pt: { path: '/bundle', label: 'Bundle' },
      en: { path: '/en/bundle', label: 'Bundle' },
      es: { path: '/es/bundle', label: 'Bundle' },
    },
  },
  {
    id: 'estudante',
    group: 'service',
    activeMenuId: 'servicos',
    allowChildren: true,
    localized: {
      pt: { path: '/estudante', aliases: ['/student-pack'], label: 'Pacote para Estudantes' },
      en: { path: '/en/student-pack', label: 'Student Pack' },
      es: { path: '/es/pack-estudiante', aliases: ['/es/student-pack'], label: 'Pack de Estudiante' },
    },
  },
  {
    id: 'conhecimento',
    group: 'menu',
    localized: {
      pt: { path: '/conhecimento', aliases: ['/knowledge'], label: 'Knowledge Hub', menuVisible: true },
      en: { path: '/en/knowledge', aliases: ['/en/conhecimento', '/en/pages/knowledge'], label: 'Knowledge Hub', menuVisible: true },
      es: { path: '/es/conocimiento', aliases: ['/es/knowledge'], label: 'Hub de Conocimiento', menuVisible: true },
    },
  },
  {
    id: 'servicos',
    group: 'menu',
    localized: {
      pt: { path: '/servicos', aliases: ['/services'], label: 'Serviços', menuVisible: true },
      en: { path: '/en/services', aliases: ['/en/servicos', '/en/pages/services'], label: 'Services', menuVisible: true },
      es: { path: '/es/servicios', aliases: ['/es/servicos', '/es/services', '/servicios'], label: 'Servicios', menuVisible: true },
    },
  },
  {
    id: 'blog',
    group: 'menu',
    allowChildren: true,
    localized: {
      pt: { path: '/blog', label: 'Blog', menuVisible: true },
      en: { path: '/en/blog', label: 'Blog', menuVisible: true },
      es: { path: '/es/blog', label: 'Blog', menuVisible: true },
    },
  },
  {
    id: 'sobre',
    group: 'menu',
    localized: {
      pt: { path: '/sobre', aliases: ['/about'], label: 'Sobre', menuVisible: true },
      en: { path: '/en/about', aliases: ['/en/sobre'], label: 'About', menuVisible: true },
      es: { path: '/es/sobre', aliases: ['/es/acerca-de', '/es/about', '/acerca-de'], label: 'Acerca de', menuVisible: true },
    },
  },
  {
    id: 'contactos',
    group: 'menu',
    localized: {
      pt: { path: '/contactos', aliases: ['/contact', '/contacto'], label: 'Contactos', menuVisible: true },
      en: { path: '/en/contact', aliases: ['/en/contactos'], label: 'Contact', menuVisible: true },
      es: { path: '/es/contacto', aliases: ['/es/contact', '/contacto'], label: 'Contacto', menuVisible: true },
    },
  },
  {
    id: 'politica-privacidade',
    group: 'utility',
    localized: {
      pt: { path: '/politica-privacidade', label: 'Privacidade' },
      en: { path: '/en/privacy-policy', aliases: ['/en/politica-privacidade'], label: 'Privacy Policy' },
      es: { path: '/es/politica-privacidad', aliases: ['/es/privacy-policy'], label: 'Privacidad' },
    },
  },
  {
    id: 'politica-cookies',
    group: 'utility',
    localized: {
      pt: { path: '/politica-cookies', label: 'Cookies' },
      en: { path: '/en/cookie-policy', aliases: ['/en/politica-cookies'], label: 'Cookies' },
      es: { path: '/es/politica-cookies', aliases: ['/es/cookie-policy'], label: 'Cookies' },
    },
  },
  {
    id: 'informacao-legal',
    group: 'utility',
    localized: {
      pt: { path: '/informacao-legal', label: 'Informação Legal' },
      en: { path: '/en/legal-information', aliases: ['/en/informacao-legal'], label: 'Legal Information' },
      es: { path: '/es/informacion-legal', aliases: ['/es/informacao-legal'], label: 'Información Legal' },
    },
  },
  {
    id: 'termos-condicoes',
    group: 'utility',
    localized: {
      pt: { path: '/termos-condicoes', label: 'Termos e Condições' },
      en: { path: '/en/terms-and-conditions', aliases: ['/en/termos-condicoes'], label: 'Terms & Conditions' },
      es: { path: '/es/terminos-condiciones', aliases: ['/es/termos-condicoes'], label: 'Términos y Condiciones' },
    },
  },
  {
    id: 'tratamento-dados',
    group: 'utility',
    localized: {
      pt: { path: '/tratamento-dados', label: 'Tratamento de Dados' },
      en: { path: '/en/data-processing', aliases: ['/en/tratamento-dados'], label: 'Data Processing' },
      es: { path: '/es/tratamiento-datos', aliases: ['/es/tratamento-dados'], label: 'Tratamiento de Datos' },
    },
  },
  {
    id: 'area-cliente',
    group: 'utility',
    localized: {
      pt: { path: '/area-cliente/' },
      en: { path: '/area-cliente/?lang=en' },
      es: { path: '/area-cliente/?lang=es' },
    },
  },
];

const pageMap = new Map<PageId, RouteDefinition>(routeManifest.map(route => [route.id, route]));

const localizedLabels: Record<Lang, LocalizedLabels> = {
  pt: { pt: 'PT — Português', en: 'EN — Inglês', es: 'ES — Espanhol' },
  en: { pt: 'PT — Portuguese', en: 'EN — English', es: 'ES — Spanish' },
  es: { pt: 'PT — Portugués', en: 'EN — Inglés', es: 'ES — Español' },
};

function joinSegments(segments: string[]): string {
  return segments.length ? `/${segments.join('/')}` : '/';
}

export function normalizePath(path: string): string {
  if (!path) return '/';
  const [pathname] = path.split(/[?#]/);
  const cleaned = pathname.replace(/\/+/g, '/');
  if (cleaned === '/' || cleaned === '') return '/';
  return cleaned.endsWith('/') ? cleaned.slice(0, -1) : cleaned;
}

export function splitPathSegments(path: string): string[] {
  const normalized = normalizePath(path);
  if (normalized === '/') return [];
  return normalized.slice(1).split('/').filter(Boolean);
}

export function getLocaleFromPath(path: string): Lang {
  const [first] = splitPathSegments(path);
  if (first === 'en' || first === 'es') return first;
  return 'pt';
}

export function stripLocalePrefix(path: string): string {
  const segments = splitPathSegments(path);
  if (segments[0] === 'en' || segments[0] === 'es') {
    return joinSegments(segments.slice(1));
  }
  return joinSegments(segments);
}

function matchesRoute(targetPath: string, basePath: string, allowChildren: boolean): boolean {
  const targetSegments = splitPathSegments(targetPath);
  const baseSegments = splitPathSegments(basePath);

  if (baseSegments.length === 0) {
    return targetSegments.length === 0;
  }

  if (targetSegments.length < baseSegments.length) {
    return false;
  }

  for (let index = 0; index < baseSegments.length; index += 1) {
    if (targetSegments[index] !== baseSegments[index]) {
      return false;
    }
  }

  return allowChildren ? true : targetSegments.length === baseSegments.length;
}

const routeEntries: FlattenedRouteEntry[] = routeManifest
  .flatMap(route => {
    const entries: FlattenedRouteEntry[] = [];

    (['pt', 'en', 'es'] as Lang[]).forEach(lang => {
      const variant = route.localized[lang];
      const canonicalPath = normalizePath(variant.path);
      const entryBase = {
        pageId: route.id,
        lang,
        canonicalPath,
        allowChildren: Boolean(route.allowChildren),
        activeMenuId: route.activeMenuId ?? route.id,
        group: route.group,
        label: variant.label,
        menuVisible: Boolean(variant.menuVisible),
      };

      entries.push({
        ...entryBase,
        path: canonicalPath,
        isAlias: false,
      });

      (variant.aliases || []).forEach(alias => {
        entries.push({
          ...entryBase,
          path: normalizePath(alias),
          isAlias: true,
        });
      });
    });

    return entries;
  })
  .sort((left, right) => {
    const segmentDelta = splitPathSegments(right.path).length - splitPathSegments(left.path).length;
    if (segmentDelta !== 0) return segmentDelta;
    const lengthDelta = right.path.length - left.path.length;
    if (lengthDelta !== 0) return lengthDelta;
    return Number(left.isAlias) - Number(right.isAlias);
  });

export type ResolvedRoute = {
  pageId: PageId;
  lang: Lang;
  canonicalPath: string;
  matchedPath: string;
  isAlias: boolean;
  allowChildren: boolean;
  activeMenuId: PageId;
  group: RouteGroup;
  remainderPath: string;
};

export function getRouteDefinition(pageId: PageId): RouteDefinition | undefined {
  return pageMap.get(pageId);
}

export function resolveRoute(path: string): ResolvedRoute | null {
  const normalized = normalizePath(path);
  const matched = routeEntries.find(entry => matchesRoute(normalized, entry.path, entry.allowChildren));

  if (!matched) {
    return null;
  }

  const targetSegments = splitPathSegments(normalized);
  const matchedSegments = splitPathSegments(matched.path);
  const remainderSegments = targetSegments.slice(matchedSegments.length);

  return {
    pageId: matched.pageId,
    lang: matched.lang,
    canonicalPath: matched.canonicalPath,
    matchedPath: matched.path,
    isAlias: matched.isAlias,
    allowChildren: matched.allowChildren,
    activeMenuId: matched.activeMenuId,
    group: matched.group,
    remainderPath: joinSegments(remainderSegments),
  };
}

export function resolvePageId(path: string): PageId | null {
  return resolveRoute(path)?.pageId || null;
}

export function getLocalizedPath(pageId: PageId, lang: Lang): string {
  const route = getRouteDefinition(pageId);
  if (!route) {
    return lang === 'pt' ? '/' : `/${lang}`;
  }
  return route.localized[lang].path;
}

function appendRemainder(basePath: string, remainderPath: string): string {
  if (!remainderPath || remainderPath === '/') {
    return basePath;
  }

  const normalizedBase = normalizePath(basePath);
  return normalizedBase === '/'
    ? remainderPath
    : `${normalizedBase}${remainderPath}`;
}

export function getCanonicalPtPath(path: string): string {
  const resolved = resolveRoute(path);
  if (!resolved) {
    return stripLocalePrefix(path);
  }

  const canonicalPt = getLocalizedPath(resolved.pageId, 'pt');
  return resolved.allowChildren ? appendRemainder(canonicalPt, resolved.remainderPath) : canonicalPt;
}

export function switchPathToLang(path: string, targetLang: Lang): string {
  const resolved = resolveRoute(path);
  if (!resolved) {
    const stripped = stripLocalePrefix(path);
    if (targetLang === 'pt') return stripped;
    return stripped === '/' ? `/${targetLang}` : `/${targetLang}${stripped}`;
  }

  const localizedBasePath = getLocalizedPath(resolved.pageId, targetLang);
  return resolved.allowChildren ? appendRemainder(localizedBasePath, resolved.remainderPath) : localizedBasePath;
}

export function getMenuItems(lang: Lang): Array<{ id: PageId; href: string; label: string }> {
  return MENU_PAGE_IDS.map(pageId => {
    const route = getRouteDefinition(pageId);
    const variant = route?.localized[lang];

    if (!route || !variant?.label || !variant.menuVisible) {
      throw new Error(`Menu route "${pageId}" is missing visible localized labels.`);
    }

    return {
      id: pageId,
      href: variant.path,
      label: variant.label,
    };
  });
}

export function getLanguageOptions(currentLang: Lang): Array<{ code: Lang; label: string }> {
  return (['pt', 'en', 'es'] as Lang[]).map(code => ({
    code,
    label: localizedLabels[currentLang][code],
  }));
}

export function getLanguageLinks(path: string, currentLang: Lang = getLocaleFromPath(path)) {
  const resolved = resolveRoute(path);

  return getLanguageOptions(currentLang).map(option => ({
    ...option,
    href: switchPathToLang(path, option.code),
    available: resolved ? Boolean(getRouteDefinition(resolved.pageId)?.localized[option.code]) : true,
    pageId: resolved?.pageId || null,
  }));
}

export function normalizeActivePage(activePage: string): PageId | '' {
  if (!activePage) return '';

  const aliases: Record<string, PageId> = {
    'knowledge-hub': 'conhecimento',
    'student-pack': 'estudante',
    'services': 'servicos',
    'about': 'sobre',
    'contact': 'contactos',
  };

  const normalizedId = (aliases[activePage] || activePage) as PageId;
  const route = getRouteDefinition(normalizedId);
  if (!route) return '';
  return route.activeMenuId ?? normalizedId;
}

export function getMenuLabels(lang: Lang) {
  return {
    langSection: lang === 'en' ? 'Language' : 'Idioma',
    closeMenu: lang === 'en' ? 'Close menu' : lang === 'es' ? 'Cerrar menú' : 'Fechar menu',
    login: 'Login',
    memberArea: lang === 'en' ? 'Member Area' : lang === 'es' ? 'Área de Miembro' : 'Área de Membro',
    menu: lang === 'en' ? 'Menu' : lang === 'es' ? 'Menú' : 'Menu',
    logoAlt: 'Share2Inspire',
  };
}
