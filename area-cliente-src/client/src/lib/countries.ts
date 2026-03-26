/**
 * countries.ts
 * Country list with ISO codes and regions for Career Path / Career Intelligence tools.
 */

export interface Country {
  code: string;
  country: string;
  regions: string[];
}

export const countries: Country[] = [
  {
    code: 'PT', country: 'Portugal',
    regions: ['Lisboa', 'Porto', 'Braga', 'Coimbra', 'Faro', 'Aveiro', 'Setúbal', 'Leiria', 'Viseu', 'Funchal', 'Ponta Delgada'],
  },
  {
    code: 'BR', country: 'Brasil',
    regions: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Brasília', 'Salvador', 'Recife', 'Fortaleza', 'Florianópolis'],
  },
  {
    code: 'ES', country: 'Espanha',
    regions: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza'],
  },
  {
    code: 'FR', country: 'França',
    regions: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux'],
  },
  {
    code: 'DE', country: 'Alemanha',
    regions: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Düsseldorf'],
  },
  {
    code: 'GB', country: 'Reino Unido',
    regions: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Bristol', 'Leeds'],
  },
  {
    code: 'NL', country: 'Países Baixos',
    regions: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  },
  {
    code: 'BE', country: 'Bélgica',
    regions: ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liège'],
  },
  {
    code: 'CH', country: 'Suíça',
    regions: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
  },
  {
    code: 'IT', country: 'Itália',
    regions: ['Milan', 'Rome', 'Turin', 'Florence', 'Bologna', 'Naples'],
  },
  {
    code: 'US', country: 'Estados Unidos',
    regions: ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston', 'Seattle', 'Austin', 'Miami', 'Washington DC'],
  },
  {
    code: 'CA', country: 'Canadá',
    regions: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary'],
  },
  {
    code: 'AU', country: 'Austrália',
    regions: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  },
  {
    code: 'AT', country: 'Áustria',
    regions: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'],
  },
  {
    code: 'PL', country: 'Polónia',
    regions: ['Warsaw', 'Krakow', 'Wroclaw', 'Gdansk', 'Poznan'],
  },
  {
    code: 'IE', country: 'Irlanda',
    regions: ['Dublin', 'Cork', 'Galway', 'Limerick'],
  },
  {
    code: 'LU', country: 'Luxemburgo',
    regions: ['Luxembourg City'],
  },
  {
    code: 'SG', country: 'Singapura',
    regions: ['Singapore'],
  },
  {
    code: 'AE', country: 'Emirados Árabes Unidos',
    regions: ['Dubai', 'Abu Dhabi'],
  },
];
