const PRODUCT_ALIAS_GROUPS = {
  all: ['all', 'todos', 'todas'],
  cv_analyser: ['cv_analyser', 'cv analyser', 'cv analyzer', 'cv_report', 'cv report', 'cv'],
  career_path: ['career_path', 'career path', 'career'],
  career_intelligence_full: [
    'career_intelligence_full',
    'career intelligence full',
    'career_intelligence',
    'career intelligence',
    'ci full',
    'ci_full',
    'ci'
  ],
  career_intelligence_pro: [
    'career_intelligence_pro',
    'career intelligence pro',
    'career_intelligence_member_pro',
    'career intelligence member pro',
    'ci pro',
    'ci_pro'
  ],
  bundle: ['bundle', 'complete', 'bundle cv analyser career path'],
  student_pack: ['student_pack', 'student pack', 'student', 'pack estudante', 'pack estudiante'],
  linkedin_roaster: ['linkedin_roaster', 'linkedin roaster', 'linkedin_roast', 'linkedin roast', 'linkedin_analysis', 'linkedin analysis', 'roaster'],
  salary_check: ['salary_check', 'salary check', 'salarycheck', 'salary checker'],
  subscription: ['subscription', 'subscricao', 'subscrição', 'subscricao mensal', 'subscrição mensal']
} as const;

type CanonicalProduct = keyof typeof PRODUCT_ALIAS_GROUPS;

const CANONICAL_TO_ALIASES = new Map<CanonicalProduct, Set<string>>(
  (Object.entries(PRODUCT_ALIAS_GROUPS) as Array<[CanonicalProduct, readonly string[]]>).map(([canonical, aliases]) => [
    canonical,
    new Set(aliases.map(normalizeProductToken))
  ])
);

const ALIAS_TO_CANONICAL = new Map<string, CanonicalProduct>();

for (const [canonical, aliases] of CANONICAL_TO_ALIASES.entries()) {
  for (const alias of aliases) {
    ALIAS_TO_CANONICAL.set(alias, canonical);
  }
}

function normalizeProductToken(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[+]/g, ' plus ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function resolveCanonicalProduct(value: string): CanonicalProduct | null {
  const normalized = normalizeProductToken(value);
  return ALIAS_TO_CANONICAL.get(normalized) || null;
}

export function couponSupportsProduct(
  applicableProducts: string[] | null | undefined,
  requestedProducts: string | string[]
): boolean {
  const requested = Array.isArray(requestedProducts) ? requestedProducts : [requestedProducts];
  const requestedCanonicals = new Set(
    requested
      .map(resolveCanonicalProduct)
      .filter((value): value is CanonicalProduct => Boolean(value))
  );

  if (requestedCanonicals.size === 0) {
    return false;
  }

  const rawProducts = Array.isArray(applicableProducts)
    ? applicableProducts.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : [];

  if (rawProducts.length === 0) {
    return true;
  }

  const canonicalProducts = new Set<CanonicalProduct>();
  for (const product of rawProducts) {
    const canonical = resolveCanonicalProduct(product);
    if (canonical) {
      canonicalProducts.add(canonical);
    }
  }

  if (canonicalProducts.size === 0) {
    return rawProducts.some((product) => {
      const normalizedProduct = normalizeProductToken(product);
      return requested.some((requestedProduct) => normalizeProductToken(requestedProduct) === normalizedProduct);
    });
  }

  if (canonicalProducts.has('all')) {
    return true;
  }

  for (const requestedCanonical of requestedCanonicals) {
    if (canonicalProducts.has(requestedCanonical)) {
      return true;
    }

    if (
      requestedCanonical === 'career_intelligence_full' &&
      canonicalProducts.has('career_intelligence_pro')
    ) {
      return true;
    }

    if (
      requestedCanonical === 'career_intelligence_pro' &&
      canonicalProducts.has('career_intelligence_full')
    ) {
      return true;
    }
  }

  return false;
}

export function getCouponProductRequestAliases(product: string | string[]): string[] {
  const requested = Array.isArray(product) ? product : [product];
  const aliases = new Set<string>();

  for (const value of requested) {
    aliases.add(value);
    const canonical = resolveCanonicalProduct(value);
    if (canonical) {
      aliases.add(canonical);
      for (const alias of CANONICAL_TO_ALIASES.get(canonical) || []) {
        aliases.add(alias);
      }
    }
  }

  return Array.from(aliases);
}
