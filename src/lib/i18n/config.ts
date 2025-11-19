// Internationalization Configuration
// Multi-language support with locale detection

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
