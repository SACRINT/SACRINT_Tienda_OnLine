// Payment Service Layer
// Types, configurations, and utilities for payment processing

export type PaymentMethodType = "card" | "mercadopago" | "oxxo" | "transfer";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  minAmount?: number;
  maxAmount?: number;
  commission?: number;
  processingTime: string;
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethodType;
  metadata?: Record<string, string>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CardPaymentData {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
  saveCard?: boolean;
}

export interface OXXOPaymentData {
  reference: string;
  barcode: string;
  expiresAt: Date;
  instructions: string[];
}

export interface TransferPaymentData {
  bank: string;
  clabe: string;
  beneficiary: string;
  reference: string;
  concept: string;
}

// Available payment methods configuration
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "card",
    type: "card",
    name: "Tarjeta de Crédito/Débito",
    description: "Visa, Mastercard, American Express",
    icon: "credit-card",
    enabled: true,
    processingTime: "Inmediato",
  },
  {
    id: "mercadopago",
    type: "mercadopago",
    name: "Mercado Pago",
    description: "Paga con tu cuenta de Mercado Pago",
    icon: "smartphone",
    enabled: true,
    processingTime: "Inmediato",
  },
  {
    id: "oxxo",
    type: "oxxo",
    name: "OXXO Pay",
    description: "Paga en efectivo en cualquier OXXO",
    icon: "store",
    enabled: true,
    commission: 15,
    maxAmount: 10000,
    processingTime: "1-3 horas hábiles",
  },
  {
    id: "transfer",
    type: "transfer",
    name: "Transferencia Bancaria",
    description: "SPEI o transferencia interbancaria",
    icon: "building",
    enabled: true,
    processingTime: "1-24 horas hábiles",
  },
];

// Bank transfer configuration (would come from tenant settings)
export const BANK_TRANSFER_CONFIG: TransferPaymentData = {
  bank: "BBVA México",
  clabe: "012180001234567890",
  beneficiary: "SACRINT SA de CV",
  reference: "",
  concept: "Compra en tienda online",
};

// Generate OXXO payment reference
export function generateOXXOReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `OXO${timestamp}${random}`;
}

// Generate order reference for bank transfers
export function generateOrderReference(orderId: string): string {
  return `ORD-${orderId.slice(-8).toUpperCase()}`;
}

// Calculate OXXO expiration (72 hours)
export function calculateOXXOExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 72);
  return expiration;
}

// Format card number for display
export function formatCardNumber(number: string): string {
  const cleaned = number.replace(/\s/g, "");
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(" ");
}

// Mask card number for display
export function maskCardNumber(number: string): string {
  const cleaned = number.replace(/\s/g, "");
  return `•••• •••• •••• ${cleaned.slice(-4)}`;
}

// Get card type from number
export function getCardType(number: string): string {
  const cleaned = number.replace(/\s/g, "");

  if (/^4/.test(cleaned)) return "Visa";
  if (/^5[1-5]/.test(cleaned)) return "Mastercard";
  if (/^3[47]/.test(cleaned)) return "American Express";
  if (/^6011|^65|^64[4-9]|^622/.test(cleaned)) return "Discover";

  return "Unknown";
}

// Validate card number using Luhn algorithm
export function validateCardNumber(number: string): boolean {
  const cleaned = number.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Validate expiry date
export function validateExpiryDate(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const expiryDate = new Date(year, month);

  return expiryDate > now;
}

// Validate CVC
export function validateCVC(cvc: string, cardType?: string): boolean {
  if (cardType === "American Express") {
    return /^\d{4}$/.test(cvc);
  }
  return /^\d{3}$/.test(cvc);
}

// Format price in MXN
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

// Get payment method by ID
export function getPaymentMethod(id: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((method) => method.id === id);
}

// Get enabled payment methods
export function getEnabledPaymentMethods(): PaymentMethod[] {
  return PAYMENT_METHODS.filter((method) => method.enabled);
}

// Check if amount is valid for payment method
export function isAmountValidForMethod(
  amount: number,
  methodId: string
): boolean {
  const method = getPaymentMethod(methodId);
  if (!method) return false;

  if (method.minAmount && amount < method.minAmount) return false;
  if (method.maxAmount && amount > method.maxAmount) return false;

  return true;
}

// Payment status labels in Spanish
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  completed: "Completado",
  failed: "Fallido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

// Payment status colors
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "warning",
  processing: "accent",
  completed: "success",
  failed: "error",
  cancelled: "muted",
  refunded: "info",
};
