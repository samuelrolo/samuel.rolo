export interface CurrencyInfo {
  symbol: string;
  code: string;
  codeUpper: string;
}

const EUR_CURRENCY: CurrencyInfo = {
  symbol: '€',
  code: 'eur',
  codeUpper: 'EUR',
};

export function useCurrency(): CurrencyInfo {
  return EUR_CURRENCY;
}

export async function detectCurrency(): Promise<CurrencyInfo> {
  return EUR_CURRENCY;
}
