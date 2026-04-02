// Vercel Edge Function — returns geolocation from Vercel's built-in headers
// These headers are populated by Vercel's edge network automatically for every request
// No external API needed — works even in LinkedIn webview

export const config = { runtime: 'edge' };

export default function handler(request) {
  const country = request.headers.get('x-vercel-ip-country') || null;
  const city = request.headers.get('x-vercel-ip-city') || null;
  const region = request.headers.get('x-vercel-ip-country-region') || null;
  const latitude = request.headers.get('x-vercel-ip-latitude') || null;
  const longitude = request.headers.get('x-vercel-ip-longitude') || null;

  const countryNames = {
    PT: 'Portugal', BR: 'Brazil', US: 'United States', GB: 'United Kingdom',
    ES: 'Spain', FR: 'France', DE: 'Germany', IT: 'Italy', NL: 'Netherlands',
    IN: 'India', CA: 'Canada', AU: 'Australia', JP: 'Japan', CN: 'China',
    KR: 'South Korea', MX: 'Mexico', AR: 'Argentina', CO: 'Colombia',
    CL: 'Chile', PE: 'Peru', AO: 'Angola', MZ: 'Mozambique', CV: 'Cape Verde',
    IE: 'Ireland', BE: 'Belgium', CH: 'Switzerland', AT: 'Austria',
    SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', PL: 'Poland',
    CZ: 'Czech Republic', RO: 'Romania', HU: 'Hungary', GR: 'Greece',
    TR: 'Turkey', RU: 'Russia', UA: 'Ukraine', ZA: 'South Africa',
    NG: 'Nigeria', EG: 'Egypt', MA: 'Morocco', TN: 'Tunisia',
    SG: 'Singapore', TH: 'Thailand', PH: 'Philippines', ID: 'Indonesia',
    MY: 'Malaysia', VN: 'Vietnam', PK: 'Pakistan', BD: 'Bangladesh',
    LK: 'Sri Lanka', NZ: 'New Zealand', IL: 'Israel', AE: 'United Arab Emirates',
    SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', LU: 'Luxembourg',
  };

  const countryName = country ? (countryNames[country] || country) : null;
  const decodedCity = city ? decodeURIComponent(city) : null;

  return new Response(
    JSON.stringify({
      country: countryName,
      country_code: country,
      city: decodedCity,
      region: region,
      latitude: latitude,
      longitude: longitude,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    }
  );
}
