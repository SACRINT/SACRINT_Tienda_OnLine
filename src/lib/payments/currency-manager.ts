/**
 * Multi-Currency Support - Task 13.9
 * Soporte para múltiples monedas en pagos
 */

export const SUPPORTED_CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar", decimals: 2 },
  MXN: { symbol: "$", name: "Mexican Peso", decimals: 2 },
  ARS: { symbol: "$", name: "Argentine Peso", decimals: 2 },
  BRL: { symbol: "R$", name: "Brazilian Real", decimals: 2 },
  CLP: { symbol: "$", name: "Chilean Peso", decimals: 0 },
  COP: { symbol: "$", name: "Colombian Peso", decimals: 0 },
  EUR: { symbol: "€", name: "Euro", decimals: 2 },
  GBP: { symbol: "£", name: "British Pound", decimals: 2 },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

export function formatCurrency(amount: number, currency: CurrencyCode = "USD"): string {
  const config = SUPPORTED_CURRENCIES[currency];
  const formatted = amount.toFixed(config.decimals);
  return `${config.symbol}${formatted}`;
}

export function getCurrencyByCountry(countryCode: string): CurrencyCode {
  const countryToCurrency: Record<string, CurrencyCode> = {
    US: "USD",
    MX: "MXN",
    AR: "ARS",
    BR: "BRL",
    CL: "CLP",
    CO: "COP",
    EU: "EUR",
    GB: "GBP",
  };
  return countryToCurrency[countryCode] || "USD";
}

export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) return amount;

  // In production, use real-time exchange rates API (e.g., exchangerate-api.com)
  const rates: Record<CurrencyCode, number> = {
    USD: 1.0,
    MXN: 17.0,
    ARS: 350.0,
    BRL: 5.0,
    CLP: 900.0,
    COP: 4000.0,
    EUR: 0.92,
    GBP: 0.79,
  };

  const usdAmount = amount / rates[from];
  return usdAmount * rates[to];
}

export function validateCurrencyForPaymentProvider(
  currency: CurrencyCode,
  provider: "STRIPE" | "MERCADO_PAGO"
): boolean {
  const stripeCurrencies: CurrencyCode[] = ["USD", "EUR", "GBP", "MXN"];
  const mpCurrencies: CurrencyCode[] = ["MXN", "ARS", "BRL", "CLP", "COP"];

  if (provider === "STRIPE") return stripeCurrencies.includes(currency);
  if (provider === "MERCADO_PAGO") return mpCurrencies.includes(currency);
  return false;
}
