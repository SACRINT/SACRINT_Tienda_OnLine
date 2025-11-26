"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { SUPPORTED_LOCALES, LOCALE_NAMES, LOCALE_FLAGS, type Locale } from '@/lib/i18n/config';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    const segments = pathname.split('/');
    if (SUPPORTED_LOCALES.includes(segments[1] as Locale)) segments.splice(1, 1);
    router.push(`/${newLocale}${segments.join('/') || '/'}`);
  };

  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value as Locale)}>
      {SUPPORTED_LOCALES.map((loc) => <option key={loc} value={loc}>{LOCALE_FLAGS[loc]} {LOCALE_NAMES[loc]}</option>)}
    </select>
  );
}
