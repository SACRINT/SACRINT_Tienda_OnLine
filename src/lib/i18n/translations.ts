// Translation System
// Dictionary-based translations with interpolation

import { Locale, DEFAULT_LOCALE } from "./config";

type TranslationValue = string | Record<string, unknown>;
type TranslationDictionary = Record<string, TranslationValue>;

// Spanish translations (default)
const es: TranslationDictionary = {
  // Navigation
  "nav.home": "Inicio",
  "nav.shop": "Tienda",
  "nav.cart": "Carrito",
  "nav.account": "Mi Cuenta",
  "nav.search": "Buscar",
  "nav.categories": "Categorías",

  // Products
  "product.addToCart": "Agregar al Carrito",
  "product.buyNow": "Comprar Ahora",
  "product.outOfStock": "Agotado",
  "product.inStock": "En Stock",
  "product.price": "Precio",
  "product.quantity": "Cantidad",
  "product.description": "Descripción",
  "product.reviews": "Reseñas",
  "product.related": "Productos Relacionados",

  // Cart
  "cart.empty": "Tu carrito está vacío",
  "cart.total": "Total",
  "cart.subtotal": "Subtotal",
  "cart.shipping": "Envío",
  "cart.tax": "Impuestos",
  "cart.checkout": "Proceder al Pago",
  "cart.continue": "Continuar Comprando",
  "cart.remove": "Eliminar",

  // Checkout
  "checkout.title": "Checkout",
  "checkout.shipping": "Información de Envío",
  "checkout.payment": "Método de Pago",
  "checkout.review": "Revisar Pedido",
  "checkout.confirm": "Confirmar Pedido",
  "checkout.success": "¡Pedido Confirmado!",

  // Account
  "account.orders": "Mis Pedidos",
  "account.addresses": "Direcciones",
  "account.profile": "Perfil",
  "account.settings": "Configuración",
  "account.logout": "Cerrar Sesión",

  // Common
  "common.loading": "Cargando...",
  "common.error": "Error",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.delete": "Eliminar",
  "common.edit": "Editar",
  "common.search": "Buscar",
  "common.filter": "Filtrar",
  "common.sort": "Ordenar",
  "common.all": "Todos",
  "common.none": "Ninguno",
};

// English translations
const en: TranslationDictionary = {
  "nav.home": "Home",
  "nav.shop": "Shop",
  "nav.cart": "Cart",
  "nav.account": "My Account",
  "nav.search": "Search",
  "nav.categories": "Categories",

  "product.addToCart": "Add to Cart",
  "product.buyNow": "Buy Now",
  "product.outOfStock": "Out of Stock",
  "product.inStock": "In Stock",
  "product.price": "Price",
  "product.quantity": "Quantity",
  "product.description": "Description",
  "product.reviews": "Reviews",
  "product.related": "Related Products",

  "cart.empty": "Your cart is empty",
  "cart.total": "Total",
  "cart.subtotal": "Subtotal",
  "cart.shipping": "Shipping",
  "cart.tax": "Tax",
  "cart.checkout": "Proceed to Checkout",
  "cart.continue": "Continue Shopping",
  "cart.remove": "Remove",

  "checkout.title": "Checkout",
  "checkout.shipping": "Shipping Information",
  "checkout.payment": "Payment Method",
  "checkout.review": "Review Order",
  "checkout.confirm": "Confirm Order",
  "checkout.success": "Order Confirmed!",

  "account.orders": "My Orders",
  "account.addresses": "Addresses",
  "account.profile": "Profile",
  "account.settings": "Settings",
  "account.logout": "Log Out",

  "common.loading": "Loading...",
  "common.error": "Error",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.sort": "Sort",
  "common.all": "All",
  "common.none": "None",
};

// All translations
const translations: Record<Locale, TranslationDictionary> = {
  es,
  en,
  fr: en, // Fallback to English
  pt: es, // Fallback to Spanish (similar)
  de: en, // Fallback to English
};

// Get translation
export function t(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  params?: Record<string, string | number>,
): string {
  const dict = translations[locale] || translations[DEFAULT_LOCALE];
  let value =
    (dict[key] as string) ||
    (translations[DEFAULT_LOCALE][key] as string) ||
    key;

  // Interpolate parameters
  if (params) {
    Object.entries(params).forEach(([param, val]) => {
      value = value.replace(
        new RegExp("\\{" + param + "\\}", "g"),
        String(val),
      );
    });
  }

  return value;
}

// Get all translations for a namespace
export function getNamespace(
  namespace: string,
  locale: Locale = DEFAULT_LOCALE,
): Record<string, string> {
  const dict = translations[locale] || translations[DEFAULT_LOCALE];
  const prefix = namespace + ".";
  const result: Record<string, string> = {};

  Object.entries(dict).forEach(([key, value]) => {
    if (key.startsWith(prefix) && typeof value === "string") {
      result[key.replace(prefix, "")] = value;
    }
  });

  return result;
}

// Check if translation exists
export function hasTranslation(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
): boolean {
  const dict = translations[locale] || translations[DEFAULT_LOCALE];
  return key in dict;
}
