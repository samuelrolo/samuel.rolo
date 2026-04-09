// Country and region data for geolocalised analysis
export interface CountryRegion {
  country: string;
  code: string;
  currency: string;
  regions: string[];
}

// EU member state codes
export const EU_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

export function isEUCountry(countryName: string): boolean {
  const c = countries.find(x => x.country === countryName);
  return c ? EU_COUNTRY_CODES.includes(c.code) : false;
}

export const countries: CountryRegion[] = [
  {
    country: "United States",
    code: "US",
    currency: "USD",
    regions: ["California", "New York", "Texas", "Florida", "Illinois", "Massachusetts", "Washington", "Colorado", "Georgia", "Other"],
  },
  {
    country: "United Kingdom",
    code: "GB",
    currency: "GBP",
    regions: ["London", "South East", "North West", "Scotland", "West Midlands", "Yorkshire", "East of England", "Other"],
  },
  {
    country: "Germany",
    code: "DE",
    currency: "EUR",
    regions: ["Bavaria", "Berlin", "Hamburg", "North Rhine-Westphalia", "Baden-Württemberg", "Hesse", "Other"],
  },
  {
    country: "France",
    code: "FR",
    currency: "EUR",
    regions: ["Île-de-France (Paris)", "Auvergne-Rhône-Alpes", "Provence-Alpes-Côte d'Azur", "Occitanie", "Nouvelle-Aquitaine", "Other"],
  },
  {
    country: "Netherlands",
    code: "NL",
    currency: "EUR",
    regions: ["Randstad (Amsterdam/Rotterdam/The Hague)", "North Brabant", "Gelderland", "Other"],
  },
  {
    country: "Spain",
    code: "ES",
    currency: "EUR",
    regions: ["Madrid", "Catalonia (Barcelona)", "Andalusia", "Valencia", "Basque Country", "Other"],
  },
  {
    country: "Switzerland",
    code: "CH",
    currency: "CHF",
    regions: ["Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Other"],
  },
  {
    country: "Canada",
    code: "CA",
    currency: "CAD",
    regions: ["Ontario (Toronto)", "British Columbia (Vancouver)", "Quebec (Montreal)", "Alberta (Calgary)", "Other"],
  },
  {
    country: "Australia",
    code: "AU",
    currency: "AUD",
    regions: ["New South Wales (Sydney)", "Victoria (Melbourne)", "Queensland (Brisbane)", "Western Australia (Perth)", "Other"],
  },
  {
    country: "Ireland",
    code: "IE",
    currency: "EUR",
    regions: ["Dublin", "Cork", "Galway", "Limerick", "Other"],
  },
  {
    country: "Brazil",
    code: "BR",
    currency: "BRL",
    regions: ["São Paulo", "Rio de Janeiro", "Minas Gerais", "Paraná", "Other"],
  },
  {
    country: "Portugal",
    code: "PT",
    currency: "EUR",
    regions: ["Lisboa", "Porto", "Algarve", "Coimbra", "Other"],
  },
  {
    country: "Italy",
    code: "IT",
    currency: "EUR",
    regions: ["Lombardy (Milan)", "Lazio (Rome)", "Veneto", "Piedmont (Turin)", "Other"],
  },
  {
    country: "Sweden",
    code: "SE",
    currency: "SEK",
    regions: ["Stockholm", "Gothenburg", "Malmö", "Other"],
  },
  {
    country: "Singapore",
    code: "SG",
    currency: "SGD",
    regions: ["Central", "East", "West", "Other"],
  },
  {
    country: "UAE",
    code: "AE",
    currency: "AED",
    regions: ["Dubai", "Abu Dhabi", "Sharjah", "Other"],
  },
  {
    country: "India",
    code: "IN",
    currency: "INR",
    regions: ["Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Other"],
  },
  // ─── PALOPs + Lusophone ─────────────────────────────────────────
  {
    country: "Angola",
    code: "AO",
    currency: "AOA",
    regions: ["Luanda", "Benguela", "Huambo", "Lobito", "Other"],
  },
  {
    country: "Mozambique",
    code: "MZ",
    currency: "MZN",
    regions: ["Maputo", "Beira", "Nampula", "Other"],
  },
  {
    country: "Cape Verde",
    code: "CV",
    currency: "CVE",
    regions: ["Praia", "Mindelo", "Other"],
  },
  {
    country: "Guinea-Bissau",
    code: "GW",
    currency: "XOF",
    regions: ["Bissau", "Other"],
  },
  {
    country: "São Tomé and Príncipe",
    code: "ST",
    currency: "STN",
    regions: ["São Tomé", "Other"],
  },
  {
    country: "Timor-Leste",
    code: "TL",
    currency: "USD",
    regions: ["Dili", "Other"],
  },
  // ─── Additional International ───────────────────────────────────
  {
    country: "Belgium",
    code: "BE",
    currency: "EUR",
    regions: ["Brussels", "Flanders", "Wallonia", "Other"],
  },
  {
    country: "Austria",
    code: "AT",
    currency: "EUR",
    regions: ["Vienna", "Salzburg", "Graz", "Other"],
  },
  {
    country: "Denmark",
    code: "DK",
    currency: "DKK",
    regions: ["Copenhagen", "Aarhus", "Other"],
  },
  {
    country: "Norway",
    code: "NO",
    currency: "NOK",
    regions: ["Oslo", "Bergen", "Stavanger", "Other"],
  },
  {
    country: "Poland",
    code: "PL",
    currency: "PLN",
    regions: ["Warsaw", "Kraków", "Wrocław", "Gdańsk", "Other"],
  },
  {
    country: "Luxembourg",
    code: "LU",
    currency: "EUR",
    regions: ["Luxembourg City", "Other"],
  },
  {
    country: "Japan",
    code: "JP",
    currency: "JPY",
    regions: ["Tokyo", "Osaka", "Nagoya", "Other"],
  },
  {
    country: "South Korea",
    code: "KR",
    currency: "KRW",
    regions: ["Seoul", "Busan", "Other"],
  },
  {
    country: "Mexico",
    code: "MX",
    currency: "MXN",
    regions: ["Mexico City", "Monterrey", "Guadalajara", "Other"],
  },
  {
    country: "South Africa",
    code: "ZA",
    currency: "ZAR",
    regions: ["Johannesburg", "Cape Town", "Durban", "Other"],
  },
  {
    country: "New Zealand",
    code: "NZ",
    currency: "NZD",
    regions: ["Auckland", "Wellington", "Christchurch", "Other"],
  },
  {
    country: "Colombia",
    code: "CO",
    currency: "COP",
    regions: ["Bogotá", "Medellín", "Cali", "Other"],
  },
  {
    country: "Chile",
    code: "CL",
    currency: "CLP",
    regions: ["Santiago", "Valparaíso", "Other"],
  },
  {
    country: "Argentina",
    code: "AR",
    currency: "ARS",
    regions: ["Buenos Aires", "Córdoba", "Rosario", "Other"],
  },
  {
    country: "Other",
    code: "XX",
    currency: "USD",
    regions: ["Other"],
  },
];
