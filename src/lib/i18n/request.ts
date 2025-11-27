/**
 * next-intl Request Configuration
 * Semanas 33-34: Multi-language Support
 *
 * Configuración de next-intl para App Router
 */

import { getRequestConfig } from "next-intl/server";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from "./config";

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  let validLocale = locale;
  if (!validLocale || !SUPPORTED_LOCALES.includes(validLocale as Locale)) {
    validLocale = DEFAULT_LOCALE;
  }

  return {
    locale: validLocale,
    messages: (await import(`../../../messages/${validLocale}.json`)).default,
    timeZone: "America/Mexico_City",
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
        long: {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        },
      },
      number: {
        currency: {
          style: "currency",
          currency: validLocale === "es" ? "MXN" : "USD",
        },
        percent: {
          style: "percent",
        },
      },
      list: {
        enumeration: {
          style: "long",
          type: "conjunction",
        },
      },
    },
  };
});
