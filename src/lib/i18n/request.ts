/**
 * next-intl Request Configuration
 * Semanas 33-34: Multi-language Support
 * 
 * Configuración de next-intl para App Router
 */

import { getRequestConfig } from 'next-intl/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    locale = DEFAULT_LOCALE;
  }

  return {
    messages: (await import(`../../../messages/${locale}.json`)).default,
    timeZone: 'America/Mexico_City',
    now: new Date(),
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }
      },
      number: {
        currency: {
          style: 'currency',
          currency: locale === 'es' ? 'MXN' : 'USD'
        },
        percent: {
          style: 'percent'
        }
      },
      list: {
        enumeration: {
          style: 'long',
          type: 'conjunction'
        }
      }
    }
  };
});
