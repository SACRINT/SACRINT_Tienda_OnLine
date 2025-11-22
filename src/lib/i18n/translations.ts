/**
 * Internationalization (i18n)
 * Sistema de traducciones multi-idioma
 */

export type Locale = "es" | "en" | "pt" | "fr";

export interface TranslationKey {
  es: string;
  en: string;
  pt?: string;
  fr?: string;
}

/**
 * Diccionario de traducciones
 */
export const translations = {
  common: {
    loading: { es: "Cargando...", en: "Loading...", pt: "Carregando...", fr: "Chargement..." },
    error: { es: "Error", en: "Error", pt: "Erro", fr: "Erreur" },
    success: { es: "Éxito", en: "Success", pt: "Sucesso", fr: "Succès" },
    cancel: { es: "Cancelar", en: "Cancel", pt: "Cancelar", fr: "Annuler" },
    save: { es: "Guardar", en: "Save", pt: "Salvar", fr: "Enregistrer" },
    delete: { es: "Eliminar", en: "Delete", pt: "Excluir", fr: "Supprimer" },
    edit: { es: "Editar", en: "Edit", pt: "Editar", fr: "Modifier" },
    search: { es: "Buscar", en: "Search", pt: "Buscar", fr: "Rechercher" },
  },
  nav: {
    home: { es: "Inicio", en: "Home", pt: "Início", fr: "Accueil" },
    shop: { es: "Tienda", en: "Shop", pt: "Loja", fr: "Boutique" },
    cart: { es: "Carrito", en: "Cart", pt: "Carrinho", fr: "Panier" },
    account: { es: "Cuenta", en: "Account", pt: "Conta", fr: "Compte" },
    logout: { es: "Cerrar sesión", en: "Logout", pt: "Sair", fr: "Déconnexion" },
  },
  products: {
    addToCart: {
      es: "Agregar al carrito",
      en: "Add to cart",
      pt: "Adicionar ao carrinho",
      fr: "Ajouter au panier",
    },
    outOfStock: { es: "Agotado", en: "Out of stock", pt: "Esgotado", fr: "Rupture de stock" },
    inStock: { es: "En stock", en: "In stock", pt: "Em estoque", fr: "En stock" },
    price: { es: "Precio", en: "Price", pt: "Preço", fr: "Prix" },
    reviews: { es: "Reseñas", en: "Reviews", pt: "Avaliações", fr: "Avis" },
  },
  checkout: {
    title: { es: "Finalizar compra", en: "Checkout", pt: "Finalizar compra", fr: "Paiement" },
    shipping: { es: "Envío", en: "Shipping", pt: "Envio", fr: "Livraison" },
    payment: { es: "Pago", en: "Payment", pt: "Pagamento", fr: "Paiement" },
    total: { es: "Total", en: "Total", pt: "Total", fr: "Total" },
    placeOrder: {
      es: "Realizar pedido",
      en: "Place order",
      pt: "Fazer pedido",
      fr: "Passer commande",
    },
  },
  errors: {
    generic: {
      es: "Algo salió mal. Por favor, inténtalo de nuevo.",
      en: "Something went wrong. Please try again.",
      pt: "Algo deu errado. Por favor, tente novamente.",
      fr: "Quelque chose s'est mal passé. Veuillez réessayer.",
    },
    notFound: { es: "No encontrado", en: "Not found", pt: "Não encontrado", fr: "Non trouvé" },
    unauthorized: {
      es: "No autorizado",
      en: "Unauthorized",
      pt: "Não autorizado",
      fr: "Non autorisé",
    },
    validation: {
      es: "Por favor, revisa los campos del formulario.",
      en: "Please check the form fields.",
      pt: "Por favor, verifique os campos do formulário.",
      fr: "Veuillez vérifier les champs du formulaire.",
    },
  },
} as const;

/**
 * Obtener traducción
 */
export function t(key: string, locale: Locale = "es"): string {
  const keys = key.split(".");
  let current: any = translations;

  for (const k of keys) {
    if (current[k]) {
      current = current[k];
    } else {
      return key;
    }
  }

  return current[locale] || current.es || key;
}

/**
 * Formatear moneda
 */
export function formatCurrency(amount: number, locale: Locale = "es"): string {
  const localeMap: Record<Locale, string> = {
    es: "es-ES",
    en: "en-US",
    pt: "pt-BR",
    fr: "fr-FR",
  };

  const currencyMap: Record<Locale, string> = {
    es: "EUR",
    en: "USD",
    pt: "BRL",
    fr: "EUR",
  };

  return new Intl.NumberFormat(localeMap[locale], {
    style: "currency",
    currency: currencyMap[locale],
  }).format(amount);
}

/**
 * Formatear fecha
 */
export function formatDate(date: Date, locale: Locale = "es"): string {
  const localeMap: Record<Locale, string> = {
    es: "es-ES",
    en: "en-US",
    pt: "pt-BR",
    fr: "fr-FR",
  };

  return new Intl.DateTimeFormat(localeMap[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Formatear número
 */
export function formatNumber(num: number, locale: Locale = "es"): string {
  const localeMap: Record<Locale, string> = {
    es: "es-ES",
    en: "en-US",
    pt: "pt-BR",
    fr: "fr-FR",
  };

  return new Intl.NumberFormat(localeMap[locale]).format(num);
}

/**
 * Pluralización
 */
export function plural(
  count: number,
  singular: string,
  plural: string,
  locale: Locale = "es",
): string {
  const rules = new Intl.PluralRules(locale);
  const rule = rules.select(count);
  return rule === "one" ? singular : plural;
}

export default {
  t,
  formatCurrency,
  formatDate,
  formatNumber,
  plural,
  translations,
};
