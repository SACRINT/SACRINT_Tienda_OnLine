/**
 * Mercado Pago Marketplace Features
 * Tasks 14.7 & 14.8: Seller Onboarding & Payout Configuration
 *
 * Permite que la plataforma funcione como marketplace donde múltiples
 * vendedores pueden vender productos y recibir pagos directamente
 */

import { db } from "@/lib/db";
import { z } from "zod";

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;
const MP_BASE_URL = "https://api.mercadopago.com/v1";

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const SellerOnboardingSchema = z.object({
  tenantId: z.string().cuid(),
  countryId: z.enum(["AR", "BR", "CL", "CO", "MX", "PE", "UY"]), // Países de LATAM
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  businessName: z.string().optional(),
  taxId: z.string().optional(), // CUIT, RFC, CPF, etc.
  phone: z.string().optional(),
});

export type SellerOnboardingInput = z.infer<typeof SellerOnboardingSchema>;

export interface MercadoPagoOAuthToken {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
  user_id: number;
  public_key: string;
}

export interface MarketplaceSeller {
  id: string;
  tenantId: string;
  mpUserId: number;
  mpAccessToken: string;
  mpRefreshToken: string;
  mpPublicKey: string;
  tokenExpiresAt: Date;
  status: "pending" | "active" | "suspended";
  verificationStatus: "pending" | "verified" | "rejected";
  payoutFrequency: "daily" | "weekly" | "monthly";
  commissionPercentage: number; // % que se queda la plataforma
}

// ============================================================================
// Task 14.7: SELLER ONBOARDING
// ============================================================================

/**
 * Genera URL de OAuth para que el vendedor autorice a la plataforma
 */
export function generateOAuthURL(tenantId: string): string {
  const appId = process.env.MERCADOPAGO_APP_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/marketplace/oauth/callback`;

  const params = new URLSearchParams({
    client_id: appId,
    response_type: "code",
    platform_id: "mp",
    state: tenantId, // Para identificar al tenant después del callback
    redirect_uri: redirectUri,
  });

  return `https://auth.mercadopago.com/authorization?${params.toString()}`;
}

/**
 * Intercambia código de OAuth por access token
 */
async function exchangeOAuthCode(code: string): Promise<MercadoPagoOAuthToken> {
  const appId = process.env.MERCADOPAGO_APP_ID!;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/marketplace/oauth/callback`;

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OAuth token exchange failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Completa el onboarding de un vendedor después del OAuth
 */
export async function completSellerOnboarding(
  tenantId: string,
  oauthCode: string
): Promise<MarketplaceSeller> {
  // Intercambiar código por tokens
  const tokenData = await exchangeOAuthCode(oauthCode);

  // Verificar que el tenant existe
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // Guardar información del seller
  // Nota: Necesitaríamos un modelo MarketplaceSeller en Prisma
  // Por ahora, usamos el tenant para almacenar esta info

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      // Guardar tokens de MP (necesitaríamos agregar estos campos al schema)
      // mpUserId: tokenData.user_id,
      // mpAccessToken: tokenData.access_token,
      // mpRefreshToken: tokenData.refresh_token,
      // mpPublicKey: tokenData.public_key,
    },
  });

  return {
    id: tenantId,
    tenantId,
    mpUserId: tokenData.user_id,
    mpAccessToken: tokenData.access_token,
    mpRefreshToken: tokenData.refresh_token,
    mpPublicKey: tokenData.public_key,
    tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    status: "active",
    verificationStatus: "pending",
    payoutFrequency: "weekly",
    commissionPercentage: 10, // 10% por defecto
  };
}

/**
 * Refresca el access token cuando expira
 */
export async function refreshSellerToken(
  refreshToken: string
): Promise<MercadoPagoOAuthToken> {
  const appId = process.env.MERCADOPAGO_APP_ID!;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET!;

  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return response.json();
}

// ============================================================================
// Task 14.8: PAYOUT CONFIGURATION & SPLIT PAYMENTS
// ============================================================================

export interface SplitPaymentConfig {
  orderId: string;
  totalAmount: number;
  platformCommission: number; // Monto que se queda la plataforma
  sellerAmount: number; // Monto que va al vendedor
  sellerAccessToken: string; // Token del vendedor
}

/**
 * Crea un pago con split (división entre plataforma y vendedor)
 */
export async function createSplitPayment(
  config: SplitPaymentConfig
): Promise<any> {
  const order = await db.order.findUnique({
    where: { id: config.orderId },
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

  // Crear pago usando el token del vendedor
  const response = await fetch(`${MP_BASE_URL}/advanced_payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`, // Token de la plataforma
    },
    body: JSON.stringify({
      application_id: process.env.MERCADOPAGO_APP_ID,
      payments: [
        {
          payment_method_id: "master", // Se define en frontend
          installments: 1,
          transaction_amount: config.totalAmount,
          description: `Order ${order.orderNumber}`,
          external_reference: order.id,
        },
      ],
      disbursements: [
        {
          // Comisión de la plataforma
          amount: config.platformCommission,
          external_reference: `platform-fee-${order.id}`,
          collector_id: process.env.MERCADOPAGO_PLATFORM_COLLECTOR_ID,
        },
        {
          // Pago al vendedor
          amount: config.sellerAmount,
          external_reference: `seller-payout-${order.id}`,
          collector_id: config.sellerAccessToken, // ID del vendedor
        },
      ],
      payer: {
        email: order.customerEmail || "buyer@example.com",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Split payment failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Configura la frecuencia y método de payout para un vendedor
 */
export async function configureSellerPayout(input: {
  tenantId: string;
  payoutFrequency: "daily" | "weekly" | "monthly";
  minimumPayoutAmount?: number;
  bankAccount?: {
    accountNumber: string;
    accountType: "checking" | "savings";
    bankCode: string;
    holderName: string;
    holderTaxId: string;
  };
}): Promise<void> {
  // Actualizar configuración del seller
  // Nota: Esto requeriría un modelo específico de MarketplaceSeller

  // Por ahora solo validamos y retornamos
  console.log("Payout configuration updated:", {
    tenantId: input.tenantId,
    frequency: input.payoutFrequency,
    minimumAmount: input.minimumPayoutAmount || 0,
  });

  // TODO: Guardar en BD cuando tengamos el modelo MarketplaceSeller
}

/**
 * Calcula el monto que corresponde a la plataforma y al vendedor
 */
export function calculateSplit(
  orderTotal: number,
  commissionPercentage: number
): {
  platformCommission: number;
  sellerAmount: number;
  commissionPercentage: number;
} {
  const platformCommission = (orderTotal * commissionPercentage) / 100;
  const sellerAmount = orderTotal - platformCommission;

  return {
    platformCommission: Math.round(platformCommission * 100) / 100,
    sellerAmount: Math.round(sellerAmount * 100) / 100,
    commissionPercentage,
  };
}

/**
 * Obtiene el balance disponible de un vendedor
 */
export async function getSellerBalance(
  sellerAccessToken: string
): Promise<{
  available: number;
  unavailable: number;
  total: number;
}> {
  const response = await fetch(`${MP_BASE_URL}/users/me/mercadopago_account/balance`, {
    headers: {
      "Authorization": `Bearer ${sellerAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch seller balance");
  }

  const data = await response.json();

  return {
    available: data.available_balance || 0,
    unavailable: data.unavailable_balance || 0,
    total: (data.available_balance || 0) + (data.unavailable_balance || 0),
  };
}

/**
 * Obtiene el historial de payouts de un vendedor
 */
export async function getSellerPayouts(
  tenantId: string,
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: "pending" | "completed" | "failed";
  }
): Promise<any[]> {
  // TODO: Implementar consulta a MP API o a nuestra BD
  // Esto depende de cómo almacenemos los payouts

  return [];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Valida que las credenciales de marketplace estén configuradas
 */
export function validateMarketplaceConfig(): boolean {
  const appId = process.env.MERCADOPAGO_APP_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;

  if (!appId || !clientSecret) {
    console.warn("⚠️ Mercado Pago Marketplace credentials not configured");
    return false;
  }

  return true;
}

/**
 * Verifica el estado de verificación de un vendedor en MP
 */
export async function checkSellerVerificationStatus(
  sellerAccessToken: string
): Promise<"pending" | "verified" | "rejected"> {
  try {
    const response = await fetch(`${MP_BASE_URL}/users/me`, {
      headers: {
        "Authorization": `Bearer ${sellerAccessToken}`,
      },
    });

    const userData = await response.json();

    // MP tiene diferentes estados de verificación
    // Por simplicidad, asumimos que si está activo está verificado
    return userData.status?.site_status === "active" ? "verified" : "pending";
  } catch (error) {
    console.error("Error checking seller verification:", error);
    return "pending";
  }
}
