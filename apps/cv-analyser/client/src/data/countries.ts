export type SupportedLanguage = 'pt' | 'en' | 'es';

export interface LocalizedLabel {
  pt: string;
  en: string;
  es: string;
}

export interface CountryRegionDefinition {
  value: string;
  code: string;
  currency: string;
  label: LocalizedLabel;
  regions: Array<{
    value: string;
    label: LocalizedLabel;
  }>;
}

export interface LocalizedCountryRegion {
  country: string;
  label: string;
  code: string;
  currency: string;
  regions: Array<{
    value: string;
    label: string;
  }>;
}

export const EU_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

const otherLabel: LocalizedLabel = {
  pt: 'Outra',
  en: 'Other',
  es: 'Otra',
};

export const countryDefinitions: CountryRegionDefinition[] = [
  {
    value: 'United States',
    code: 'US',
    currency: 'USD',
    label: { pt: 'Estados Unidos', en: 'United States', es: 'Estados Unidos' },
    regions: [
      { value: 'California', label: { pt: 'Califórnia', en: 'California', es: 'California' } },
      { value: 'New York', label: { pt: 'Nova Iorque', en: 'New York', es: 'Nueva York' } },
      { value: 'Texas', label: { pt: 'Texas', en: 'Texas', es: 'Texas' } },
      { value: 'Florida', label: { pt: 'Flórida', en: 'Florida', es: 'Florida' } },
      { value: 'Illinois', label: { pt: 'Illinois', en: 'Illinois', es: 'Illinois' } },
      { value: 'Massachusetts', label: { pt: 'Massachusetts', en: 'Massachusetts', es: 'Massachusetts' } },
      { value: 'Washington', label: { pt: 'Washington', en: 'Washington', es: 'Washington' } },
      { value: 'Colorado', label: { pt: 'Colorado', en: 'Colorado', es: 'Colorado' } },
      { value: 'Georgia', label: { pt: 'Geórgia', en: 'Georgia', es: 'Georgia' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'United Kingdom',
    code: 'GB',
    currency: 'GBP',
    label: { pt: 'Reino Unido', en: 'United Kingdom', es: 'Reino Unido' },
    regions: [
      { value: 'London', label: { pt: 'Londres', en: 'London', es: 'Londres' } },
      { value: 'South East', label: { pt: 'Sudeste', en: 'South East', es: 'Sudeste' } },
      { value: 'North West', label: { pt: 'Noroeste', en: 'North West', es: 'Noroeste' } },
      { value: 'Scotland', label: { pt: 'Escócia', en: 'Scotland', es: 'Escocia' } },
      { value: 'West Midlands', label: { pt: 'West Midlands', en: 'West Midlands', es: 'West Midlands' } },
      { value: 'Yorkshire', label: { pt: 'Yorkshire', en: 'Yorkshire', es: 'Yorkshire' } },
      { value: 'East of England', label: { pt: 'Leste de Inglaterra', en: 'East of England', es: 'Este de Inglaterra' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Germany',
    code: 'DE',
    currency: 'EUR',
    label: { pt: 'Alemanha', en: 'Germany', es: 'Alemania' },
    regions: [
      { value: 'Bavaria', label: { pt: 'Baviera', en: 'Bavaria', es: 'Baviera' } },
      { value: 'Berlin', label: { pt: 'Berlim', en: 'Berlin', es: 'Berlín' } },
      { value: 'Hamburg', label: { pt: 'Hamburgo', en: 'Hamburg', es: 'Hamburgo' } },
      { value: 'North Rhine-Westphalia', label: { pt: 'Renânia do Norte-Vestfália', en: 'North Rhine-Westphalia', es: 'Renania del Norte-Westfalia' } },
      { value: 'Baden-Württemberg', label: { pt: 'Baden-Württemberg', en: 'Baden-Württemberg', es: 'Baden-Württemberg' } },
      { value: 'Hesse', label: { pt: 'Hesse', en: 'Hesse', es: 'Hesse' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'France',
    code: 'FR',
    currency: 'EUR',
    label: { pt: 'França', en: 'France', es: 'Francia' },
    regions: [
      { value: 'Île-de-France (Paris)', label: { pt: 'Île-de-France (Paris)', en: 'Île-de-France (Paris)', es: 'Île-de-France (París)' } },
      { value: 'Auvergne-Rhône-Alpes', label: { pt: 'Auvergne-Rhône-Alpes', en: 'Auvergne-Rhône-Alpes', es: 'Auvergne-Rhône-Alpes' } },
      { value: 'Provence-Alpes-Côte d\'Azur', label: { pt: 'Provence-Alpes-Côte d\'Azur', en: 'Provence-Alpes-Côte d\'Azur', es: 'Provence-Alpes-Côte d\'Azur' } },
      { value: 'Occitanie', label: { pt: 'Occitânia', en: 'Occitanie', es: 'Occitania' } },
      { value: 'Nouvelle-Aquitaine', label: { pt: 'Nouvelle-Aquitaine', en: 'Nouvelle-Aquitaine', es: 'Nueva Aquitania' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Netherlands',
    code: 'NL',
    currency: 'EUR',
    label: { pt: 'Países Baixos', en: 'Netherlands', es: 'Países Bajos' },
    regions: [
      { value: 'Randstad (Amsterdam/Rotterdam/The Hague)', label: { pt: 'Randstad (Amesterdão/Roterdão/Haia)', en: 'Randstad (Amsterdam/Rotterdam/The Hague)', es: 'Randstad (Ámsterdam/Róterdam/La Haya)' } },
      { value: 'North Brabant', label: { pt: 'Brabante do Norte', en: 'North Brabant', es: 'Brabante Septentrional' } },
      { value: 'Gelderland', label: { pt: 'Gelderland', en: 'Gelderland', es: 'Gelderland' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Spain',
    code: 'ES',
    currency: 'EUR',
    label: { pt: 'Espanha', en: 'Spain', es: 'España' },
    regions: [
      { value: 'Madrid', label: { pt: 'Madrid', en: 'Madrid', es: 'Madrid' } },
      { value: 'Catalonia (Barcelona)', label: { pt: 'Catalunha (Barcelona)', en: 'Catalonia (Barcelona)', es: 'Cataluña (Barcelona)' } },
      { value: 'Andalusia', label: { pt: 'Andaluzia', en: 'Andalusia', es: 'Andalucía' } },
      { value: 'Valencia', label: { pt: 'Valência', en: 'Valencia', es: 'Valencia' } },
      { value: 'Basque Country', label: { pt: 'País Basco', en: 'Basque Country', es: 'País Vasco' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Switzerland',
    code: 'CH',
    currency: 'CHF',
    label: { pt: 'Suíça', en: 'Switzerland', es: 'Suiza' },
    regions: [
      { value: 'Zurich', label: { pt: 'Zurique', en: 'Zurich', es: 'Zúrich' } },
      { value: 'Geneva', label: { pt: 'Genebra', en: 'Geneva', es: 'Ginebra' } },
      { value: 'Basel', label: { pt: 'Basileia', en: 'Basel', es: 'Basilea' } },
      { value: 'Bern', label: { pt: 'Berna', en: 'Bern', es: 'Berna' } },
      { value: 'Lausanne', label: { pt: 'Lausana', en: 'Lausanne', es: 'Lausana' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Canada',
    code: 'CA',
    currency: 'CAD',
    label: { pt: 'Canadá', en: 'Canada', es: 'Canadá' },
    regions: [
      { value: 'Ontario (Toronto)', label: { pt: 'Ontário (Toronto)', en: 'Ontario (Toronto)', es: 'Ontario (Toronto)' } },
      { value: 'British Columbia (Vancouver)', label: { pt: 'Colúmbia Britânica (Vancouver)', en: 'British Columbia (Vancouver)', es: 'Columbia Británica (Vancouver)' } },
      { value: 'Quebec (Montreal)', label: { pt: 'Quebeque (Montreal)', en: 'Quebec (Montreal)', es: 'Quebec (Montreal)' } },
      { value: 'Alberta (Calgary)', label: { pt: 'Alberta (Calgary)', en: 'Alberta (Calgary)', es: 'Alberta (Calgary)' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Australia',
    code: 'AU',
    currency: 'AUD',
    label: { pt: 'Austrália', en: 'Australia', es: 'Australia' },
    regions: [
      { value: 'New South Wales (Sydney)', label: { pt: 'Nova Gales do Sul (Sydney)', en: 'New South Wales (Sydney)', es: 'Nueva Gales del Sur (Sídney)' } },
      { value: 'Victoria (Melbourne)', label: { pt: 'Vitória (Melbourne)', en: 'Victoria (Melbourne)', es: 'Victoria (Melbourne)' } },
      { value: 'Queensland (Brisbane)', label: { pt: 'Queensland (Brisbane)', en: 'Queensland (Brisbane)', es: 'Queensland (Brisbane)' } },
      { value: 'Western Australia (Perth)', label: { pt: 'Austrália Ocidental (Perth)', en: 'Western Australia (Perth)', es: 'Australia Occidental (Perth)' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Ireland',
    code: 'IE',
    currency: 'EUR',
    label: { pt: 'Irlanda', en: 'Ireland', es: 'Irlanda' },
    regions: [
      { value: 'Dublin', label: { pt: 'Dublim', en: 'Dublin', es: 'Dublín' } },
      { value: 'Cork', label: { pt: 'Cork', en: 'Cork', es: 'Cork' } },
      { value: 'Galway', label: { pt: 'Galway', en: 'Galway', es: 'Galway' } },
      { value: 'Limerick', label: { pt: 'Limerick', en: 'Limerick', es: 'Limerick' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Brazil',
    code: 'BR',
    currency: 'BRL',
    label: { pt: 'Brasil', en: 'Brazil', es: 'Brasil' },
    regions: [
      { value: 'São Paulo', label: { pt: 'São Paulo', en: 'São Paulo', es: 'São Paulo' } },
      { value: 'Rio de Janeiro', label: { pt: 'Rio de Janeiro', en: 'Rio de Janeiro', es: 'Río de Janeiro' } },
      { value: 'Minas Gerais', label: { pt: 'Minas Gerais', en: 'Minas Gerais', es: 'Minas Gerais' } },
      { value: 'Paraná', label: { pt: 'Paraná', en: 'Paraná', es: 'Paraná' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Portugal',
    code: 'PT',
    currency: 'EUR',
    label: { pt: 'Portugal', en: 'Portugal', es: 'Portugal' },
    regions: [
      { value: 'Lisboa', label: { pt: 'Lisboa', en: 'Lisboa', es: 'Lisboa' } },
      { value: 'Porto', label: { pt: 'Porto', en: 'Porto', es: 'Oporto' } },
      { value: 'Algarve', label: { pt: 'Algarve', en: 'Algarve', es: 'Algarve' } },
      { value: 'Coimbra', label: { pt: 'Coimbra', en: 'Coimbra', es: 'Coimbra' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Italy',
    code: 'IT',
    currency: 'EUR',
    label: { pt: 'Itália', en: 'Italy', es: 'Italia' },
    regions: [
      { value: 'Lombardy (Milan)', label: { pt: 'Lombardia (Milão)', en: 'Lombardy (Milan)', es: 'Lombardía (Milán)' } },
      { value: 'Lazio (Rome)', label: { pt: 'Lácio (Roma)', en: 'Lazio (Rome)', es: 'Lacio (Roma)' } },
      { value: 'Veneto', label: { pt: 'Véneto', en: 'Veneto', es: 'Véneto' } },
      { value: 'Piedmont (Turin)', label: { pt: 'Piemonte (Turim)', en: 'Piedmont (Turin)', es: 'Piamonte (Turín)' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Sweden',
    code: 'SE',
    currency: 'SEK',
    label: { pt: 'Suécia', en: 'Sweden', es: 'Suecia' },
    regions: [
      { value: 'Stockholm', label: { pt: 'Estocolmo', en: 'Stockholm', es: 'Estocolmo' } },
      { value: 'Gothenburg', label: { pt: 'Gotemburgo', en: 'Gothenburg', es: 'Gotemburgo' } },
      { value: 'Malmö', label: { pt: 'Malmö', en: 'Malmö', es: 'Malmö' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Singapore',
    code: 'SG',
    currency: 'SGD',
    label: { pt: 'Singapura', en: 'Singapore', es: 'Singapur' },
    regions: [
      { value: 'Central', label: { pt: 'Central', en: 'Central', es: 'Central' } },
      { value: 'East', label: { pt: 'Este', en: 'East', es: 'Este' } },
      { value: 'West', label: { pt: 'Oeste', en: 'West', es: 'Oeste' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'UAE',
    code: 'AE',
    currency: 'AED',
    label: { pt: 'Emirados Árabes Unidos', en: 'UAE', es: 'Emiratos Árabes Unidos' },
    regions: [
      { value: 'Dubai', label: { pt: 'Dubai', en: 'Dubai', es: 'Dubái' } },
      { value: 'Abu Dhabi', label: { pt: 'Abu Dhabi', en: 'Abu Dhabi', es: 'Abu Dabi' } },
      { value: 'Sharjah', label: { pt: 'Sharjah', en: 'Sharjah', es: 'Sharjah' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'India',
    code: 'IN',
    currency: 'INR',
    label: { pt: 'Índia', en: 'India', es: 'India' },
    regions: [
      { value: 'Bangalore', label: { pt: 'Bangalore', en: 'Bangalore', es: 'Bangalore' } },
      { value: 'Mumbai', label: { pt: 'Mumbai', en: 'Mumbai', es: 'Bombay' } },
      { value: 'Delhi NCR', label: { pt: 'Deli NCR', en: 'Delhi NCR', es: 'Delhi NCR' } },
      { value: 'Hyderabad', label: { pt: 'Hyderabad', en: 'Hyderabad', es: 'Hyderabad' } },
      { value: 'Pune', label: { pt: 'Pune', en: 'Pune', es: 'Pune' } },
      { value: 'Chennai', label: { pt: 'Chennai', en: 'Chennai', es: 'Chennai' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Angola',
    code: 'AO',
    currency: 'AOA',
    label: { pt: 'Angola', en: 'Angola', es: 'Angola' },
    regions: [
      { value: 'Luanda', label: { pt: 'Luanda', en: 'Luanda', es: 'Luanda' } },
      { value: 'Benguela', label: { pt: 'Benguela', en: 'Benguela', es: 'Benguela' } },
      { value: 'Huambo', label: { pt: 'Huambo', en: 'Huambo', es: 'Huambo' } },
      { value: 'Lobito', label: { pt: 'Lobito', en: 'Lobito', es: 'Lobito' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Mozambique',
    code: 'MZ',
    currency: 'MZN',
    label: { pt: 'Moçambique', en: 'Mozambique', es: 'Mozambique' },
    regions: [
      { value: 'Maputo', label: { pt: 'Maputo', en: 'Maputo', es: 'Maputo' } },
      { value: 'Beira', label: { pt: 'Beira', en: 'Beira', es: 'Beira' } },
      { value: 'Nampula', label: { pt: 'Nampula', en: 'Nampula', es: 'Nampula' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Other',
    code: 'XX',
    currency: 'USD',
    label: { pt: 'Outro', en: 'Other', es: 'Otro' },
    regions: [{ value: 'Other', label: otherLabel }],
  },
];

export function getLocalizedCountries(lang: SupportedLanguage): LocalizedCountryRegion[] {
  return countryDefinitions.map((country) => ({
    country: country.value,
    label: country.label[lang],
    code: country.code,
    currency: country.currency,
    regions: country.regions.map((region) => ({
      value: region.value,
      label: region.label[lang],
    })),
  }));
}

export function getCountryDefinition(countryValue?: string | null): CountryRegionDefinition | undefined {
  if (!countryValue) return undefined;
  return countryDefinitions.find((country) => country.value === countryValue || country.code === countryValue);
}

export function getCountryLabel(countryValue: string, lang: SupportedLanguage): string {
  return getCountryDefinition(countryValue)?.label[lang] || countryValue;
}

export function getRegionLabel(countryValue: string, regionValue: string, lang: SupportedLanguage): string {
  const region = getCountryDefinition(countryValue)?.regions.find((item) => item.value === regionValue);
  return region?.label[lang] || regionValue;
}

export function getDefaultCountryByLanguage(lang: SupportedLanguage): string {
  if (lang === 'pt') return 'Portugal';
  if (lang === 'es') return 'Spain';
  return '';
}

export function isEUCountry(countryValue: string): boolean {
  const country = getCountryDefinition(countryValue);
  return country ? EU_COUNTRY_CODES.includes(country.code) : false;
}
