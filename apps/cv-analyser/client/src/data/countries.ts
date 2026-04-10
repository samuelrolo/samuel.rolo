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
    value: 'Cape Verde',
    code: 'CV',
    currency: 'CVE',
    label: { pt: 'Cabo Verde', en: 'Cape Verde', es: 'Cabo Verde' },
    regions: [
      { value: 'Praia', label: { pt: 'Praia', en: 'Praia', es: 'Praia' } },
      { value: 'Mindelo', label: { pt: 'Mindelo', en: 'Mindelo', es: 'Mindelo' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Guinea-Bissau',
    code: 'GW',
    currency: 'XOF',
    label: { pt: 'Guiné-Bissau', en: 'Guinea-Bissau', es: 'Guinea-Bisáu' },
    regions: [
      { value: 'Bissau', label: { pt: 'Bissau', en: 'Bissau', es: 'Bisáu' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'São Tomé and Príncipe',
    code: 'ST',
    currency: 'STN',
    label: { pt: 'São Tomé e Príncipe', en: 'São Tomé and Príncipe', es: 'Santo Tomé y Príncipe' },
    regions: [
      { value: 'São Tomé', label: { pt: 'São Tomé', en: 'São Tomé', es: 'Santo Tomé' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Timor-Leste',
    code: 'TL',
    currency: 'USD',
    label: { pt: 'Timor-Leste', en: 'Timor-Leste', es: 'Timor Oriental' },
    regions: [
      { value: 'Dili', label: { pt: 'Díli', en: 'Dili', es: 'Dili' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Belgium',
    code: 'BE',
    currency: 'EUR',
    label: { pt: 'Bélgica', en: 'Belgium', es: 'Bélgica' },
    regions: [
      { value: 'Brussels', label: { pt: 'Bruxelas', en: 'Brussels', es: 'Bruselas' } },
      { value: 'Flanders', label: { pt: 'Flandres', en: 'Flanders', es: 'Flandes' } },
      { value: 'Wallonia', label: { pt: 'Valónia', en: 'Wallonia', es: 'Valonia' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Austria',
    code: 'AT',
    currency: 'EUR',
    label: { pt: 'Áustria', en: 'Austria', es: 'Austria' },
    regions: [
      { value: 'Vienna', label: { pt: 'Viena', en: 'Vienna', es: 'Viena' } },
      { value: 'Salzburg', label: { pt: 'Salzburgo', en: 'Salzburg', es: 'Salzburgo' } },
      { value: 'Graz', label: { pt: 'Graz', en: 'Graz', es: 'Graz' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Denmark',
    code: 'DK',
    currency: 'DKK',
    label: { pt: 'Dinamarca', en: 'Denmark', es: 'Dinamarca' },
    regions: [
      { value: 'Copenhagen', label: { pt: 'Copenhaga', en: 'Copenhagen', es: 'Copenhague' } },
      { value: 'Aarhus', label: { pt: 'Aarhus', en: 'Aarhus', es: 'Aarhus' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Norway',
    code: 'NO',
    currency: 'NOK',
    label: { pt: 'Noruega', en: 'Norway', es: 'Noruega' },
    regions: [
      { value: 'Oslo', label: { pt: 'Oslo', en: 'Oslo', es: 'Oslo' } },
      { value: 'Bergen', label: { pt: 'Bergen', en: 'Bergen', es: 'Bergen' } },
      { value: 'Stavanger', label: { pt: 'Stavanger', en: 'Stavanger', es: 'Stavanger' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Poland',
    code: 'PL',
    currency: 'PLN',
    label: { pt: 'Polónia', en: 'Poland', es: 'Polonia' },
    regions: [
      { value: 'Warsaw', label: { pt: 'Varsóvia', en: 'Warsaw', es: 'Varsovia' } },
      { value: 'Kraków', label: { pt: 'Cracóvia', en: 'Kraków', es: 'Cracovia' } },
      { value: 'Wrocław', label: { pt: 'Breslávia', en: 'Wrocław', es: 'Breslavia' } },
      { value: 'Gdańsk', label: { pt: 'Gdańsk', en: 'Gdańsk', es: 'Gdańsk' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Luxembourg',
    code: 'LU',
    currency: 'EUR',
    label: { pt: 'Luxemburgo', en: 'Luxembourg', es: 'Luxemburgo' },
    regions: [
      { value: 'Luxembourg City', label: { pt: 'Cidade do Luxemburgo', en: 'Luxembourg City', es: 'Ciudad de Luxemburgo' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Japan',
    code: 'JP',
    currency: 'JPY',
    label: { pt: 'Japão', en: 'Japan', es: 'Japón' },
    regions: [
      { value: 'Tokyo', label: { pt: 'Tóquio', en: 'Tokyo', es: 'Tokio' } },
      { value: 'Osaka', label: { pt: 'Osaka', en: 'Osaka', es: 'Osaka' } },
      { value: 'Nagoya', label: { pt: 'Nagoia', en: 'Nagoya', es: 'Nagoya' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'South Korea',
    code: 'KR',
    currency: 'KRW',
    label: { pt: 'Coreia do Sul', en: 'South Korea', es: 'Corea del Sur' },
    regions: [
      { value: 'Seoul', label: { pt: 'Seul', en: 'Seoul', es: 'Seúl' } },
      { value: 'Busan', label: { pt: 'Busan', en: 'Busan', es: 'Busan' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Mexico',
    code: 'MX',
    currency: 'MXN',
    label: { pt: 'México', en: 'Mexico', es: 'México' },
    regions: [
      { value: 'Mexico City', label: { pt: 'Cidade do México', en: 'Mexico City', es: 'Ciudad de México' } },
      { value: 'Monterrey', label: { pt: 'Monterrey', en: 'Monterrey', es: 'Monterrey' } },
      { value: 'Guadalajara', label: { pt: 'Guadalajara', en: 'Guadalajara', es: 'Guadalajara' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'South Africa',
    code: 'ZA',
    currency: 'ZAR',
    label: { pt: 'África do Sul', en: 'South Africa', es: 'Sudáfrica' },
    regions: [
      { value: 'Johannesburg', label: { pt: 'Joanesburgo', en: 'Johannesburg', es: 'Johannesburgo' } },
      { value: 'Cape Town', label: { pt: 'Cidade do Cabo', en: 'Cape Town', es: 'Ciudad del Cabo' } },
      { value: 'Durban', label: { pt: 'Durban', en: 'Durban', es: 'Durban' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'New Zealand',
    code: 'NZ',
    currency: 'NZD',
    label: { pt: 'Nova Zelândia', en: 'New Zealand', es: 'Nueva Zelanda' },
    regions: [
      { value: 'Auckland', label: { pt: 'Auckland', en: 'Auckland', es: 'Auckland' } },
      { value: 'Wellington', label: { pt: 'Wellington', en: 'Wellington', es: 'Wellington' } },
      { value: 'Christchurch', label: { pt: 'Christchurch', en: 'Christchurch', es: 'Christchurch' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Colombia',
    code: 'CO',
    currency: 'COP',
    label: { pt: 'Colômbia', en: 'Colombia', es: 'Colombia' },
    regions: [
      { value: 'Bogotá', label: { pt: 'Bogotá', en: 'Bogotá', es: 'Bogotá' } },
      { value: 'Medellín', label: { pt: 'Medellín', en: 'Medellín', es: 'Medellín' } },
      { value: 'Cali', label: { pt: 'Cali', en: 'Cali', es: 'Cali' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Chile',
    code: 'CL',
    currency: 'CLP',
    label: { pt: 'Chile', en: 'Chile', es: 'Chile' },
    regions: [
      { value: 'Santiago', label: { pt: 'Santiago', en: 'Santiago', es: 'Santiago' } },
      { value: 'Valparaíso', label: { pt: 'Valparaíso', en: 'Valparaíso', es: 'Valparaíso' } },
      { value: 'Other', label: otherLabel },
    ],
  },
  {
    value: 'Argentina',
    code: 'AR',
    currency: 'ARS',
    label: { pt: 'Argentina', en: 'Argentina', es: 'Argentina' },
    regions: [
      { value: 'Buenos Aires', label: { pt: 'Buenos Aires', en: 'Buenos Aires', es: 'Buenos Aires' } },
      { value: 'Córdoba', label: { pt: 'Córdoba', en: 'Córdoba', es: 'Córdoba' } },
      { value: 'Rosario', label: { pt: 'Rosário', en: 'Rosario', es: 'Rosario' } },
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

// --- Helper Functions ---

export function getCountryName(codeOrValue: string, lang: SupportedLanguage): string {
  const country = getCountryDefinition(codeOrValue);
  return country ? country.label[lang] : codeOrValue;
}

export function getRegionName(countryCodeOrValue: string, regionValue: string, lang: SupportedLanguage): string {
  const country = getCountryDefinition(countryCodeOrValue);
  if (!country) return regionValue;
  const region = country.regions.find(r => r.value === regionValue);
  return region ? region.label[lang] : regionValue;
}

export function getCountries(lang: SupportedLanguage): Array<{ code: string; value: string; label: string }> {
  return countryDefinitions.map(c => ({
    code: c.code,
    value: c.value,
    label: c.label[lang]
  }));
}

export function getRegions(countryCodeOrValue: string, lang: SupportedLanguage): Array<{ value: string; label: string }> {
  const country = getCountryDefinition(countryCodeOrValue);
  if (!country) return [];
  return country.regions.map(r => ({
    value: r.value,
    label: r.label[lang]
  }));
}
