// Locale-aware Formatting Utilities
// Currency, dates, and numbers

import { Locale, LOCALE_CURRENCY } from "./config";

// Format currency
export function formatCurrency(amount: number, locale: Locale = "es"): string {
  const currency = LOCALE_CURRENCY[locale];
  const localeCode =
    locale === "es" ? "es-MX" : locale === "en" ? "en-US" : locale;

  return new Intl.NumberFormat(localeCode, {
    style: "currency",
    currency,
  }).format(amount);
}

// Format number
export function formatNumber(
  value: number,
  locale: Locale = "es",
  options?: Intl.NumberFormatOptions,
): string {
  const localeCode =
    locale === "es" ? "es-MX" : locale === "en" ? "en-US" : locale;
  return new Intl.NumberFormat(localeCode, options).format(value);
}

// Format date
export function formatDate(
  date: Date | string,
  locale: Locale = "es",
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const localeCode =
    locale === "es" ? "es-MX" : locale === "en" ? "en-US" : locale;

  return new Intl.DateTimeFormat(localeCode, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(d);
}

// Format relative time
export function formatRelativeTime(
  date: Date | string,
  locale: Locale = "es",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const localeCode =
    locale === "es" ? "es-MX" : locale === "en" ? "en-US" : locale;

  const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: "auto" });

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return rtf.format(-days, "day");
  if (hours > 0) return rtf.format(-hours, "hour");
  if (minutes > 0) return rtf.format(-minutes, "minute");
  return rtf.format(-seconds, "second");
}

// Format percentage
export function formatPercent(value: number, locale: Locale = "es"): string {
  const localeCode =
    locale === "es" ? "es-MX" : locale === "en" ? "en-US" : locale;
  return new Intl.NumberFormat(localeCode, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
