/**
 * Mercado Pago Payment Integration
 * Week 14 - Tasks 14.1-14.6
 *
 * SDK oficial de Mercado Pago para procesar pagos en LATAM
 * Soporta múltiples métodos de pago locales
 */

import { db } from "@/lib/db";
import { z } from "zod";

// Mercado Pago SDK (REST API client)
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;
const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!;
const MP_BASE_URL = "https://api.mercadopago.com/v1";

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const MercadoPagoPaymentSchema = z.object({
  orderId: z.string().cuid(),
  amount: z.number().positive(),
  description: z.string(),
  payerEmail: z.string().email(),
  payerName: z.string().optional(),
  paymentMethodId: z.string().optional(),
  installments: z.number().int().min(1).max(24).default(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type MercadoPagoPaymentInput = z.infer<typeof MercadoPagoPaymentSchema>;

export interface MercadoPagoPreference {
  id: string;
  init_point: string; // URL de checkout
  sandbox_init_point: string;
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  payer?: {
    name?: string;
    email: string;
  };
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: "approved" | "all";
  external_reference?: string;
  notification_url?: string;
}

export interface MercadoPagoPayment {
  id: number;
  status:
    | "pending"
    | "approved"
    | "authorized"
    | "in_process"
    | "in_mediation"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back";
  status_detail: string;
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payment_type_id: string;
  date_created: string;
  date_approved: string | null;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  metadata: Record<string, any>;
  external_reference?: string;
}

export interface MercadoPagoRefund {
  id: number;
  payment_id: number;
  amount: number;
  source: {
    type: string;
    id: string;
  };
  date_created: string;
}

// ============================================================================
// Task 14.1: SDK SETUP & HELPER FUNCTIONS
// ============================================================================

/**
 * Realiza petición HTTP a Mercado Pago API
 */
async function mpRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any,
): Promise<T> {
  const url = `${MP_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Mercado Pago API Error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Convierte status de MP a nuestro enum PaymentStatus
 */
export function mapMPStatusToPaymentStatus(
  mpStatus: MercadoPagoPayment["status"],
): "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" {
  switch (mpStatus) {
    case "approved":
    case "authorized":
      return "COMPLETED";
    case "rejected":
    case "cancelled":
      return "FAILED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    case "pending":
    case "in_process":
    case "in_mediation":
    default:
      return "PENDING";
  }
}

/**
 * Convierte status de MP a nuestro enum OrderStatus
 */
export function mapMPStatusToOrderStatus(
  mpStatus: MercadoPagoPayment["status"],
): "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" {
  switch (mpStatus) {
    case "approved":
    case "authorized":
      return "PROCESSING";
    case "rejected":
    case "cancelled":
      return "CANCELLED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

// ============================================================================
// Task 14.2: PAYMENT CREATION (CHECKOUT PRO)
// ============================================================================

/**
 * Crea una preferencia de pago (Checkout Pro)
 * Esto genera un link de pago donde el usuario puede pagar
 */
export async function createPaymentPreference(
  input: MercadoPagoPaymentInput,
): Promise<MercadoPagoPreference> {
  // Validar input
  const validated = MercadoPagoPaymentSchema.parse(input);

  // Obtener orden
  const order = await db.order.findUnique({
    where: { id: validated.orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Crear preferencia de pago
  const preference = await mpRequest<MercadoPagoPreference>("/checkout/preferences", "POST", {
    items: order.items.map((item) => ({
      title: item.product?.name || "Product",
      quantity: item.quantity,
      unit_price: Number(item.priceAtPurchase),
      currency_id: "USD", // o configurar por tenant
    })),
    payer: {
      name: validated.payerName,
      email: validated.payerEmail,
    },
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${order.id}`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure?orderId=${order.id}`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending?orderId=${order.id}`,
    },
    auto_return: "approved",
    external_reference: order.id,
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercado-pago`,
    metadata: {
      orderId: order.id,
      tenantId: order.tenantId,
      ...validated.metadata,
    },
    statement_descriptor: "TIENDA ONLINE", // Aparece en extracto bancario
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
  });

  // Actualizar orden con preferencia de MP
  await db.order.update({
    where: { id: order.id },
    data: {
      paymentId: preference.id,
      paymentMethod: "MERCADO_PAGO",
    },
  });

  return preference;
}

/**
 * Crea un pago directo (sin redirección - requiere datos de tarjeta)
 * Usado para integración transparente (no Checkout Pro)
 */
export async function createDirectPayment(
  input: MercadoPagoPaymentInput & {
    token: string; // Card token del frontend
  },
): Promise<MercadoPagoPayment> {
  const validated = MercadoPagoPaymentSchema.parse(input);

  const payment = await mpRequest<MercadoPagoPayment>("/payments", "POST", {
    transaction_amount: validated.amount,
    description: validated.description,
    payment_method_id: validated.paymentMethodId || "visa",
    token: input.token,
    installments: validated.installments,
    payer: {
      email: validated.payerEmail,
    },
    external_reference: validated.orderId,
    metadata: {
      orderId: validated.orderId,
      ...validated.metadata,
    },
  });

  // Actualizar orden
  await db.order.update({
    where: { id: validated.orderId },
    data: {
      paymentId: payment.id.toString(),
      paymentMethod: "MERCADO_PAGO",
      paymentStatus: mapMPStatusToPaymentStatus(payment.status),
      status: mapMPStatusToOrderStatus(payment.status),
    },
  });

  return payment;
}

// ============================================================================
// Task 14.4: PAYMENT STATUS CHECK
// ============================================================================

/**
 * Consulta el estado de un pago
 */
export async function getPaymentStatus(paymentId: string): Promise<MercadoPagoPayment> {
  return mpRequest<MercadoPagoPayment>(`/payments/${paymentId}`);
}

/**
 * Actualiza el estado de una orden basado en el pago de MP
 */
export async function syncOrderWithPaymentStatus(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { paymentId: true },
  });

  if (!order?.paymentId) {
    throw new Error("Order has no associated payment");
  }

  const payment = await getPaymentStatus(order.paymentId);

  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: mapMPStatusToPaymentStatus(payment.status),
      status: mapMPStatusToOrderStatus(payment.status),
    },
  });
}

// ============================================================================
// Task 14.5: REFUNDS
// ============================================================================

/**
 * Crea un reembolso (total o parcial)
 */
export async function createMPRefund(
  orderId: string,
  amount?: number, // Si no se especifica, es reembolso total
): Promise<MercadoPagoRefund> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentId: true, total: true },
  });

  if (!order?.paymentId) {
    throw new Error("Order has no payment to refund");
  }

  const refundAmount = amount || Number(order.total);

  const refund = await mpRequest<MercadoPagoRefund>(
    `/payments/${order.paymentId}/refunds`,
    "POST",
    {
      amount: refundAmount,
    },
  );

  // Actualizar orden
  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "REFUNDED",
      status: "REFUNDED",
    },
  });

  return refund;
}

// ============================================================================
// Task 14.6: SUBSCRIPTIONS (PREAPROBACIONES)
// ============================================================================

export interface MercadoPagoSubscription {
  id: string;
  payer_id: number;
  status: "authorized" | "paused" | "cancelled" | "pending";
  reason: string;
  external_reference: string;
  date_created: string;
  last_modified: string;
  init_point: string;
  back_url: string;
  auto_recurring: {
    frequency: number;
    frequency_type: "days" | "months";
    transaction_amount: number;
    currency_id: string;
    start_date?: string;
    end_date?: string;
  };
}

/**
 * Crea una suscripción recurrente (preaprobación)
 */
export async function createSubscription(input: {
  userId: string;
  tenantId: string;
  planName: string;
  amount: number;
  frequency: number; // Cada cuántos días/meses
  frequencyType: "days" | "months";
  startDate?: Date;
  endDate?: Date;
}): Promise<MercadoPagoSubscription> {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const subscription = await mpRequest<MercadoPagoSubscription>("/preapproval", "POST", {
    reason: input.planName,
    external_reference: `${input.userId}-${Date.now()}`,
    payer_email: user.email,
    back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions`,
    auto_recurring: {
      frequency: input.frequency,
      frequency_type: input.frequencyType,
      transaction_amount: input.amount,
      currency_id: "USD",
      start_date: input.startDate?.toISOString(),
      end_date: input.endDate?.toISOString(),
    },
  });

  // Guardar suscripción en BD
  await db.subscription.create({
    data: {
      userId: input.userId,
      tenantId: input.tenantId,
      stripeId: subscription.id, // Reusar campo (renombrar a `externalId` sería mejor)
      stripeCustomerId: input.userId, // Usar userId como customer ID
      stripePriceId: "mercado_pago", // Placeholder para MP
      status: subscription.status === "authorized" ? "active" : "incomplete",
      currentPeriodStart: new Date(),
      currentPeriodEnd: input.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return subscription;
}

/**
 * Cancela una suscripción
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await mpRequest(`/preapproval/${subscriptionId}`, "PUT", {
    status: "cancelled",
  });

  // Actualizar en BD
  await db.subscription.updateMany({
    where: { stripeId: subscriptionId },
    data: {
      status: "canceled",
      canceledAt: new Date(),
    },
  });
}

/**
 * Obtiene información de una suscripción
 */
export async function getSubscription(subscriptionId: string): Promise<MercadoPagoSubscription> {
  return mpRequest<MercadoPagoSubscription>(`/preapproval/${subscriptionId}`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Valida que las credenciales de MP estén configuradas
 */
export function validateMercadoPagoConfig(): boolean {
  if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN === "APP_USR-TEST_TOKEN") {
    console.warn("⚠️ Mercado Pago Access Token not configured");
    return false;
  }

  if (!MP_PUBLIC_KEY || MP_PUBLIC_KEY === "APP_USR-TEST_PUBLIC_KEY") {
    console.warn("⚠️ Mercado Pago Public Key not configured");
    return false;
  }

  return true;
}

/**
 * Detecta el país del tenant para configurar currency_id correcto
 */
export async function getTenantCurrency(tenantId: string): Promise<string> {
  // TODO: Implementar lógica de detección de país/currency por tenant
  // Por ahora retornamos USD por defecto
  return "USD";
}
