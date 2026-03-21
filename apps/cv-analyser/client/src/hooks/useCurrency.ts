import { useState, useEffect } from 'react';

// Euro zone countries (ISO 3166-1 alpha-2)
const EUR_COUNTRIES = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU',
  'MT','NL','PT','SK','SI','ES','HR','AD','MC','SM','VA','ME','XK',
]);

const GBP_COUNTRIES = new Set(['GB','GG','JE','IM']);

export interface CurrencyInfo {
  symbol: string;   // €, $, £
  code: string;     // eur, usd, gbp
  codeUpper: string; // EUR, USD, GBP
}

const DEFAULTS: Record<string, CurrencyInfo> = {
  eur: { symbol: '€', code: 'eur', codeUpper: 'EUR' },
  usd: { symbol: '$', code: 'usd', codeUpper: 'USD' },
  gbp: { symbol: '£', code: 'gbp', codeUpper: 'GBP' },
};

const STORAGE_KEY = 's2i_currency';

function getCurrencyForCountry(countryCode: string): CurrencyInfo {
  const cc = countryCode.toUpperCase();
  if (EUR_COUNTRIES.has(cc)) return DEFAULTS.eur;
  if (GBP_COUNTRIES.has(cc)) return DEFAULTS.gbp;
  return DEFAULTS.usd;
}

export function useCurrency(): CurrencyInfo {
  const [currency, setCurrency] = useState<CurrencyInfo>(() => {
    // Check localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.symbol && parsed.code) return parsed;
      }
    } catch {}
    // Default to EUR until IP detection completes
    return DEFAULTS.eur;
  });

  useEffect(() => {
    // Skip if already detected and saved
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.detected) return; // Already detected by IP
      }
    } catch {}

    // Detect country by IP
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) throw new Error('IP API error');
        const data = await res.json();
        if (data.country_code) {
          const detected = getCurrencyForCountry(data.country_code);
          setCurrency(detected);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...detected, detected: true }));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        // Fallback: try navigator.language
        try {
          const lang = navigator.language || '';
          if (lang.endsWith('-GB') || lang.endsWith('-UK')) {
            setCurrency(DEFAULTS.gbp);
          } else if (lang.endsWith('-US') || lang.endsWith('-CA') || lang.endsWith('-AU')) {
            setCurrency(DEFAULTS.usd);
          }
          // Otherwise keep EUR default
        } catch {}
      }
    })();

    return () => controller.abort();
  }, []);

  return currency;
}

// Standalone function for non-React contexts (HTML pages)
export async function detectCurrency(): Promise<CurrencyInfo> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.detected) return parsed;
    }
  } catch {}

  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    if (data.country_code) {
      const detected = getCurrencyForCountry(data.country_code);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...detected, detected: true }));
      return detected;
    }
  } catch {}

  return DEFAULTS.eur;
}
