/**
 * Multi-language Support
 * Semana 41, Tarea 41.11: Multi-language Support
 */

import { logger } from "@/lib/monitoring";

export interface TranslationKey {
  key: string;
  language: string;
  value: string;
  context?: string;
  updatedAt: Date;
}

export interface LanguageConfig {
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  supportedRegions: string[];
}

export interface TicketTranslation {
  ticketId: string;
  originalLanguage: string;
  translatedLanguage: string;
  subject: string;
  description: string;
  translatedAt: Date;
  translationQuality: number;
}

export class MultiLanguageSupportManager {
  private translations: Map<string, TranslationKey> = new Map();
  private languages: Map<string, LanguageConfig> = new Map();
  private ticketTranslations: Map<string, TicketTranslation> = new Map();
  private translationCache: Map<string, string> = new Map();

  constructor() {
    logger.debug({ type: "multilanguage_init" }, "Multi-language Support Manager inicializado");
    this.initializeDefaultLanguages();
  }

  /**
   * Inicializar idiomas por defecto
   */
  private initializeDefaultLanguages(): void {
    const defaultLanguages = [
      { code: "es", name: "Español", isDefault: true },
      { code: "en", name: "English", isDefault: false },
      { code: "pt", name: "Português", isDefault: false },
      { code: "fr", name: "Français", isDefault: false },
      { code: "de", name: "Deutsch", isDefault: false },
    ];

    for (const lang of defaultLanguages) {
      this.languages.set(lang.code, {
        code: lang.code,
        name: lang.name,
        isActive: true,
        isDefault: lang.isDefault,
        supportedRegions: [lang.code.toUpperCase()],
      });
    }
  }

  /**
   * Registrar traducción
   */
  registerTranslation(
    key: string,
    language: string,
    value: string,
    context?: string,
  ): TranslationKey {
    const translationKey = `${key}:${language}`;
    const translation: TranslationKey = {
      key,
      language,
      value,
      context,
      updatedAt: new Date(),
    };

    this.translations.set(translationKey, translation);
    this.translationCache.delete(translationKey);

    logger.debug(
      { type: "translation_registered", key, language },
      `Traducción registrada: ${key} (${language})`,
    );

    return translation;
  }

  /**
   * Obtener traducción
   */
  getTranslation(key: string, language: string): string {
    const cacheKey = `${key}:${language}`;
    const cached = this.translationCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const translation = this.translations.get(cacheKey);
    if (translation) {
      this.translationCache.set(cacheKey, translation.value);
      return translation.value;
    }

    // Fallback a idioma por defecto
    const defaultLang = Array.from(this.languages.values()).find((l) => l.isDefault);
    if (defaultLang && defaultLang.code !== language) {
      const fallbackKey = `${key}:${defaultLang.code}`;
      const fallback = this.translations.get(fallbackKey);
      if (fallback) {
        return fallback.value;
      }
    }

    return key; // Return key if no translation found
  }

  /**
   * Traducir objeto
   */
  translateObject<T extends Record<string, any>>(obj: T, fields: string[], language: string): T {
    const translated = { ...obj };

    for (const field of fields) {
      const key: string = (obj.constructor.name as string) + "." + field;
      (translated as any)[field] = this.getTranslation(key, language);
    }

    return translated;
  }

  /**
   * Traducir ticket
   */
  translateTicket(
    ticketId: string,
    subject: string,
    description: string,
    targetLanguage: string,
  ): TicketTranslation | null {
    const cacheKey = `ticket_${ticketId}_${targetLanguage}`;
    const cached = this.ticketTranslations.get(cacheKey);

    if (cached) {
      return cached;
    }

    // Simular traducción automática
    const translation: TicketTranslation = {
      ticketId,
      originalLanguage: "es",
      translatedLanguage: targetLanguage,
      subject: this.simulateTranslation(subject, targetLanguage),
      description: this.simulateTranslation(description, targetLanguage),
      translatedAt: new Date(),
      translationQuality: 85 + Math.random() * 15, // 85-100
    };

    this.ticketTranslations.set(cacheKey, translation);

    logger.info(
      {
        type: "ticket_translated",
        ticketId,
        targetLanguage,
        quality: Math.round(translation.translationQuality),
      },
      `Ticket traducido a ${targetLanguage}`,
    );

    return translation;
  }

  /**
   * Simular traducción (en producción usar API externa)
   */
  private simulateTranslation(text: string, language: string): string {
    // Simple placeholder for translation
    const translations: Record<string, Record<string, string>> = {
      en: {
        Hola: "Hello",
        Gracias: "Thank you",
        Ayuda: "Help",
        Problema: "Problem",
      },
      pt: {
        Hola: "Olá",
        Gracias: "Obrigado",
        Ayuda: "Ajuda",
        Problema: "Problema",
      },
    };

    let translated = text;
    const langMap = translations[language] || {};

    for (const [es, trans] of Object.entries(langMap)) {
      translated = translated.replace(new RegExp(es, "gi"), trans);
    }

    return translated;
  }

  /**
   * Detectar idioma
   */
  detectLanguage(text: string): string {
    // Simple heuristic for language detection
    const spanishIndicators = ["hola", "gracias", "por favor", "qué", "cómo"];
    const englishIndicators = ["hello", "thank you", "please", "what", "how"];

    let spanishCount = 0;
    let englishCount = 0;

    const lowerText = text.toLowerCase();
    spanishIndicators.forEach((word) => {
      if (lowerText.includes(word)) spanishCount++;
    });
    englishIndicators.forEach((word) => {
      if (lowerText.includes(word)) englishCount++;
    });

    if (englishCount > spanishCount) return "en";
    if (spanishCount > 0) return "es";

    return "es"; // Default
  }

  /**
   * Obtener idiomas soportados
   */
  getSupportedLanguages(): LanguageConfig[] {
    return Array.from(this.languages.values()).filter((l) => l.isActive);
  }

  /**
   * Activar/Desactivar idioma
   */
  setLanguageActive(languageCode: string, isActive: boolean): boolean {
    const lang = this.languages.get(languageCode);
    if (lang) {
      lang.isActive = isActive;
      logger.info(
        { type: "language_status_changed", languageCode, isActive },
        `Estado del idioma ${languageCode} cambiado a: ${isActive}`,
      );
      return true;
    }
    return false;
  }

  /**
   * Generar reporte de traducciones
   */
  generateTranslationReport(): string {
    const supportedLanguages = this.getSupportedLanguages();
    const translationStats: Record<string, number> = {};

    for (const trans of this.translations.values()) {
      translationStats[trans.language] = (translationStats[trans.language] || 0) + 1;
    }

    const report = `
=== REPORTE DE SOPORTE MULTILINGÜE ===

IDIOMAS SOPORTADOS:
${supportedLanguages.map((l) => `- ${l.name} (${l.code})${l.isDefault ? " [Predeterminado]" : ""}`).join("\n")}

ESTADÍSTICAS DE TRADUCCIÓN:
${Object.entries(translationStats)
  .map(([lang, count]) => `- ${lang}: ${count} traducciones`)
  .join("\n")}

TRADUCCIONES DE TICKETS:
- Total: ${this.ticketTranslations.size}
- Calidad Promedio: ${
      this.ticketTranslations.size > 0
        ? (
            Array.from(this.ticketTranslations.values()).reduce(
              (sum, t) => sum + t.translationQuality,
              0,
            ) / this.ticketTranslations.size
          ).toFixed(2)
        : "0"
    }%
    `;

    logger.info({ type: "translation_report_generated" }, "Reporte de traducciones generado");
    return report;
  }

  /**
   * Exportar traducciones
   */
  exportTranslations(language: string): Record<string, string> {
    const translations: Record<string, string> = {};

    for (const trans of this.translations.values()) {
      if (trans.language === language) {
        translations[trans.key] = trans.value;
      }
    }

    return translations;
  }

  /**
   * Importar traducciones
   */
  importTranslations(language: string, translations: Record<string, string>): void {
    for (const [key, value] of Object.entries(translations)) {
      this.registerTranslation(key, language, value);
    }

    logger.info(
      { type: "translations_imported", language, count: Object.keys(translations).length },
      `Traducciones importadas para ${language}`,
    );
  }
}

let globalMultiLanguageSupportManager: MultiLanguageSupportManager | null = null;

export function initializeMultiLanguageSupportManager(): MultiLanguageSupportManager {
  if (!globalMultiLanguageSupportManager) {
    globalMultiLanguageSupportManager = new MultiLanguageSupportManager();
  }
  return globalMultiLanguageSupportManager;
}

export function getMultiLanguageSupportManager(): MultiLanguageSupportManager {
  if (!globalMultiLanguageSupportManager) {
    return initializeMultiLanguageSupportManager();
  }
  return globalMultiLanguageSupportManager;
}
