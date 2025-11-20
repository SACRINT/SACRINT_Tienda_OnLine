/**
 * Mercado Pago Payment Integration
 * Implementation for Latin American markets
 * Supports Argentina, Brazil, Chile, Colombia, Mexico, Peru, Uruguay, and more
 */

import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from "mercadopago";
import { logger } from "@/lib/monitoring/logger";

// Initialize Mercado Pago client
let mercadoPagoClient: MercadoPagoConfig | null = null;

function getMercadoPagoClient(): MercadoPagoConfig {
  if (!mercadoPagoClient) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN is not defined in environment variables",
      );
    }

    mercadoPagoClient = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: `mp_${Date.now()}`,
      },
    });
  }

  return mercadoPagoClient;
}

export interface MercadoPagoItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface MercadoPagoPayer {
  email: string;
  name?: string;
  surname?: string;
  phone?: {
    area_code?: string;
    number?: string;
  };
  identification?: {
    type?: string;
    number?: string;
  };
}

export interface MercadoPagoPreferenceData {
  items: MercadoPagoItem[];
  payer?: MercadoPagoPayer;
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: "approved" | "all";
  external_reference?: string;
  notification_url?: string;
  statement_descriptor?: string;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
}

export interface MercadoPagoPreferenceResult {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  external_reference?: string;
  collector_id: number;
  client_id: string;
  date_created: string;
}

/**
 * Creates a Mercado Pago payment preference
 * Similar to Stripe Payment Intent, but redirects to Mercado Pago checkout page
 */
export async function createPaymentPreference(
  data: MercadoPagoPreferenceData,
): Promise<MercadoPagoPreferenceResult> {
  try {
    const client = getMercadoPagoClient();
    const preference = new Preference(client);

    // Build preference request
    const preferenceRequest: any = {
      items: data.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id || "ARS", // Default to Argentine Peso
      })),
      back_urls: data.back_urls || {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending`,
      },
      auto_return: data.auto_return || "approved",
      external_reference: data.external_reference,
      notification_url: data.notification_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      statement_descriptor: data.statement_descriptor || "TIENDA_ONLINE",
      expires: data.expires !== undefined ? data.expires : true,
    };

    // Add payer information if provided
    if (data.payer) {
      preferenceRequest.payer = {
        email: data.payer.email,
        name: data.payer.name,
        surname: data.payer.surname,
        phone: data.payer.phone,
        identification: data.payer.identification,
      };
    }

    // Add expiration dates if provided
    if (data.expiration_date_from) {
      preferenceRequest.expiration_date_from = data.expiration_date_from;
    }
    if (data.expiration_date_to) {
      preferenceRequest.expiration_date_to = data.expiration_date_to;
    }

    logger.info("Creating Mercado Pago preference", {
      external_reference: data.external_reference,
      items_count: data.items.length,
      total_amount: data.items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0,
      ),
    });

    const response = await preference.create({ body: preferenceRequest });

    logger.info("Mercado Pago preference created", {
      preference_id: response.id,
      external_reference: data.external_reference,
    });

    return {
      id: response.id || "",
      init_point: response.init_point || "",
      sandbox_init_point: response.sandbox_init_point || "",
      external_reference: response.external_reference || undefined,
      collector_id: response.collector_id || 0,
      client_id: response.client_id || "",
      date_created: response.date_created || new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error creating Mercado Pago preference", error as Error);

    if (error instanceof Error) {
      throw new Error(`Mercado Pago error: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Retrieves payment information by payment ID
 */
export async function getPayment(paymentId: string): Promise<any> {
  try {
    const client = getMercadoPagoClient();
    const payment = new Payment(client);

    const response = await payment.get({ id: paymentId });

    logger.debug("Retrieved Mercado Pago payment", {
      payment_id: paymentId,
      status: response.status,
    });

    return {
      id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      transaction_amount: response.transaction_amount,
      currency_id: response.currency_id,
      date_created: response.date_created,
      date_approved: response.date_approved,
      external_reference: response.external_reference,
      description: response.description,
      payer: {
        email: response.payer?.email,
        identification: response.payer?.identification,
      },
      payment_method_id: response.payment_method_id,
      payment_type_id: response.payment_type_id,
    };
  } catch (error) {
    logger.error("Error retrieving Mercado Pago payment", error as Error);

    if (error instanceof Error) {
      throw new Error(`Mercado Pago error: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Validates that a payment was approved
 */
export async function validatePayment(paymentId: string): Promise<boolean> {
  try {
    const payment = await getPayment(paymentId);
    return payment.status === "approved";
  } catch (error) {
    logger.error("Error validating Mercado Pago payment", error as Error);
    return false;
  }
}

/**
 * Creates a refund for a payment
 * Mercado Pago supports full and partial refunds
 */
export async function createRefund(
  paymentId: string,
  amount?: number,
): Promise<any> {
  try {
    const client = getMercadoPagoClient();
    const refund = new PaymentRefund(client);

    const refundBody: any = {};

    if (amount) {
      refundBody.amount = amount;
    }

    logger.info("Creating Mercado Pago refund", {
      payment_id: paymentId,
      amount,
    });

    const response = await refund.create({
      payment_id: paymentId,
      body: refundBody,
    });

    logger.info("Mercado Pago refund created", {
      refund_id: response.id,
      payment_id: paymentId,
      status: response.status,
    });

    return {
      id: response.id,
      payment_id: paymentId,
      amount: response.amount,
      status: response.status,
      date_created: response.date_created,
    };
  } catch (error) {
    logger.error("Error creating Mercado Pago refund", error as Error);

    if (error instanceof Error) {
      throw new Error(`Mercado Pago refund error: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Processes Mercado Pago webhook notifications
 * Mercado Pago sends IPN (Instant Payment Notification) for payment updates
 */
export async function processWebhookNotification(
  type: string,
  data: any,
): Promise<{
  orderId: string | null;
  status: string | null;
  paymentId: string | null;
}> {
  try {
    logger.info("Processing Mercado Pago webhook", {
      type,
      data,
    });

    // Mercado Pago sends different notification types
    if (type === "payment") {
      const paymentId = data.id;

      if (!paymentId) {
        throw new Error("Payment ID not found in webhook data");
      }

      // Fetch full payment details
      const payment = await getPayment(paymentId);

      const orderId = payment.external_reference || null;
      const status = payment.status;

      logger.info("Mercado Pago payment webhook processed", {
        payment_id: paymentId,
        order_id: orderId,
        status,
      });

      return {
        orderId,
        status,
        paymentId,
      };
    }

    // Handle other notification types (test, merchant_order, etc.)
    logger.warn("Unhandled Mercado Pago webhook type", { type });

    return {
      orderId: null,
      status: null,
      paymentId: null,
    };
  } catch (error) {
    logger.error("Error processing Mercado Pago webhook", error as Error);

    return {
      orderId: null,
      status: null,
      paymentId: null,
    };
  }
}

/**
 * Gets the public key for frontend integration
 */
export function getPublicKey(): string {
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY is not defined");
  }

  return publicKey;
}

/**
 * Maps Mercado Pago payment status to internal order status
 */
export function mapPaymentStatus(
  mercadoPagoStatus: string,
): "PENDING" | "PAID" | "FAILED" | "REFUNDED" {
  switch (mercadoPagoStatus) {
    case "approved":
      return "PAID";
    case "pending":
    case "in_process":
    case "in_mediation":
      return "PENDING";
    case "rejected":
    case "cancelled":
      return "FAILED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}

/**
 * Helper to determine the appropriate currency based on country
 */
export function getCurrencyForCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    AR: "ARS", // Argentina
    BR: "BRL", // Brazil
    CL: "CLP", // Chile
    CO: "COP", // Colombia
    MX: "MXN", // Mexico
    PE: "PEN", // Peru
    UY: "UYU", // Uruguay
    VE: "VES", // Venezuela
  };

  return currencyMap[country.toUpperCase()] || "USD";
}
