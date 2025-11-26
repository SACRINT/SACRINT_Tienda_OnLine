/**
 * Internationalization Configuration
 * Semanas 33-34: Multi-language Support - Calidad Mundial
 *
 * Configuración exhaustiva de i18n con next-intl
 * Soporta: Español, English, Français, Português, Deutsch
 *
 * Referencias:
 * - https://next-intl-docs.vercel.app/
 * - https://nextjs.org/docs/app/building-your-application/routing/internationalization
 */

export type Locale = "es" | "en" | "fr" | "pt" | "de";

export const DEFAULT_LOCALE: Locale = "es";

export const SUPPORTED_LOCALES: Locale[] = ["es", "en", "fr", "pt", "de"];

export const LOCALE_NAMES: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  pt: "Português",
  de: "Deutsch",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  es: "🇲🇽",
  en: "🇺🇸",
  fr: "🇫🇷",
  pt: "🇧🇷",
  de: "🇩🇪",
};

// Currency by locale
export const LOCALE_CURRENCY: Record<Locale, string> = {
  es: "MXN",
  en: "USD",
  fr: "EUR",
  pt: "BRL",
  de: "EUR",
};

// Date format by locale
export const LOCALE_DATE_FORMAT: Record<Locale, string> = {
  es: "dd/MM/yyyy",
  en: "MM/dd/yyyy",
  fr: "dd/MM/yyyy",
  pt: "dd/MM/yyyy",
  de: "dd.MM.yyyy",
};

// Detect locale from request
export function detectLocale(
  acceptLanguage?: string | null,
  cookieLocale?: string | null,
): Locale {
  // Priority: cookie > accept-language > default
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale as Locale;
  }

  if (acceptLanguage) {
    const languages = acceptLanguage.split(",");
    for (const lang of languages) {
      const code = lang.split(";")[0].trim().substring(0, 2).toLowerCase();
      if (isValidLocale(code)) {
        return code as Locale;
      }
    }
  }

  return DEFAULT_LOCALE;
}

// Validate locale
export function isValidLocale(locale: string): boolean {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

// Get locale from path
export function getLocaleFromPath(path: string): Locale | null {
  const segments = path.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isValidLocale(firstSegment)) {
    return firstSegment as Locale;
  }

  return null;
}

// Remove locale from path
export function removeLocaleFromPath(path: string): string {
  const locale = getLocaleFromPath(path);
  if (locale) {
    return path.replace(new RegExp("^/" + locale), "") || "/";
  }
  return path;
}

// Add locale to path
export function addLocaleToPath(path: string, locale: Locale): string {
  const cleanPath = removeLocaleFromPath(path);
  return "/" + locale + cleanPath;
}

// ============================================================================
// NEXT-INTL SPECIFIC UTILITIES
// ============================================================================

/**
 * Get number format options by locale
 */
export function getNumberFormatOptions(locale: Locale): Intl.NumberFormatOptions {
  return {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
}

/**
 * Get currency format options by locale
 */
export function getCurrencyFormatOptions(locale: Locale): Intl.NumberFormatOptions {
  return {
    style: 'currency',
    currency: LOCALE_CURRENCY[locale],
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
}

/**
 * Get date format options by locale
 */
export function getDateFormatOptions(locale: Locale): Intl.DateTimeFormatOptions {
  return {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
}

/**
 * Get date-time format options by locale
 */
export function getDateTimeFormatOptions(locale: Locale): Intl.DateTimeFormatOptions {
  return {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale === 'en', // 12-hour format for English, 24-hour for others
  };
}

/**
 * Get relative time format options
 */
export function getRelativeTimeFormatOptions(): Intl.RelativeTimeFormatOptions {
  return {
    numeric: 'auto',
    style: 'long',
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, getCurrencyFormatOptions(locale)).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, getDateFormatOptions(locale)).format(date);
}

/**
 * Format date-time for display
 */
export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, getDateTimeFormatOptions(locale)).format(date);
}

/**
 * Get locale direction (LTR or RTL)
 * Currently all supported locales are LTR, but this is extensible for Arabic, Hebrew, etc.
 */
export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  const rtlLocales: Locale[] = []; // Add 'ar', 'he', etc. when supported
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}

/**
 * Get locale for Intl APIs (with region code)
 */
export function getIntlLocale(locale: Locale): string {
  const localeMap: Record<Locale, string> = {
    es: 'es-MX',
    en: 'en-US',
    fr: 'fr-FR',
    pt: 'pt-BR',
    de: 'de-DE',
  };
  return localeMap[locale] || locale;
}

/**
 * Default export for easy import
 */
export default {
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localeNames: LOCALE_NAMES,
  localeFlags: LOCALE_FLAGS,
  detectLocale,
  isValidLocale,
  getLocaleFromPath,
  removeLocaleFromPath,
  addLocaleToPath,
  formatCurrency,
  formatDate,
  formatDateTime,
  getLocaleDirection,
  getIntlLocale,
};
