/**
 * Locale Switcher Component
 * Allows users to switch between different languages
 */

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales, type Locale } from "@/i18n/request";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
};

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Remove current locale prefix from pathname
    const pathnameWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";

    // Add new locale prefix only if it's not the default
    const newPath =
      newLocale === "es"
        ? pathnameWithoutLocale
        : `/${newLocale}${pathnameWithoutLocale}`;

    router.push(newPath);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          aria-label="Switch language"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{localeNames[locale]}</span>
          <span className="sm:hidden">{localeFlags[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span>{localeFlags[loc]}</span>
            <span>{localeNames[loc]}</span>
            {loc === locale && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
