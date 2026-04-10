/**
 * @deprecated This file is kept for backwards compatibility only.
 * All country and region data has been centralised in `@/data/countries`.
 * Please import from `@/data/countries` directly.
 *
 * Re-exports the legacy `CountryRegion` shape and the `countries` array
 * (English names, for any code that still depends on the old interface)
 * so that existing imports do not break during the migration period.
 */

export type { SupportedLanguage, LocalizedLabel, CountryRegionDefinition } from '@/data/countries';
export {
  countryDefinitions,
  EU_COUNTRY_CODES,
  getLocalizedCountries,
  getCountryDefinition,
  getCountryLabel,
  getRegionLabel,
  getDefaultCountryByLanguage,
  isEUCountry,
  getCountryName,
  getRegionName,
  getCountries,
  getRegions,
} from '@/data/countries';

// Legacy interface kept for backwards compatibility
export interface CountryRegion {
  country: string;
  code: string;
  currency: string;
  regions: string[];
}

// Legacy array kept for backwards compatibility (English names only)
import { countryDefinitions as _defs } from '@/data/countries';
export const countries: CountryRegion[] = _defs.map(c => ({
  country: c.value,
  code: c.code,
  currency: c.currency,
  regions: c.regions.map(r => r.value),
}));
