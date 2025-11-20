/**
 * Internationalization Request Handler
 * Configures next-intl for server-side rendering
 */

import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

// Supported locales
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = "es"; // Spanish as default for Latin America

export default getRequestConfig(async ({ locale }) => {
  // Use default locale if none provided
  const currentLocale = locale || defaultLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(currentLocale as Locale)) {
    notFound();
  }

  return {
    locale: currentLocale,
    messages: (await import(`./messages/${currentLocale}.json`)).default,
    timeZone: "America/Mexico_City", // Default timezone
    now: new Date(),
  };
});
