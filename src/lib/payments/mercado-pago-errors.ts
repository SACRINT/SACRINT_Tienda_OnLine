/**
 * Mercado Pago Error Handling
 * Task 14.11: Error Handling
 *
 * Centraliza el manejo de errores de la API de Mercado Pago
 * con mensajes user-friendly y logging estructurado
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export class MercadoPagoError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly cause?: string;
  public readonly originalError?: any;

  constructor(
    message: string,
    code: string,
    status?: number,
    cause?: string,
    originalError?: any
  ) {
    super(message);
    this.name = "MercadoPagoError";
    this.code = code;
    this.status = status;
    this.cause = cause;
    this.originalError = originalError;

    // Mantener stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MercadoPagoError);
    }
  }
}

export class MercadoPagoAPIError extends MercadoPagoError {
  constructor(message: string, status: number, cause?: string, originalError?: any) {
    super(message, "API_ERROR", status, cause, originalError);
    this.name = "MercadoPagoAPIError";
  }
}

export class MercadoPagoAuthError extends MercadoPagoError {
  constructor(message: string = "Authentication failed", originalError?: any) {
    super(message, "AUTH_ERROR", 401, "Invalid credentials", originalError);
    this.name = "MercadoPagoAuthError";
  }
}

export class MercadoPagoValidationError extends MercadoPagoError {
  public readonly validationErrors: Record<string, string[]>;

  constructor(
    message: string,
    validationErrors: Record<string, string[]> = {},
    originalError?: any
  ) {
    super(message, "VALIDATION_ERROR", 400, "Invalid input", originalError);
    this.name = "MercadoPagoValidationError";
    this.validationErrors = validationErrors;
  }
}

export class MercadoPagoPaymentError extends MercadoPagoError {
  public readonly paymentId?: string;
  public readonly orderId?: string;

  constructor(
    message: string,
    code: string,
    paymentId?: string,
    orderId?: string,
    originalError?: any
  ) {
    super(message, code, 400, "Payment processing failed", originalError);
    this.name = "MercadoPagoPaymentError";
    this.paymentId = paymentId;
    this.orderId = orderId;
  }
}

export class MercadoPagoWebhookError extends MercadoPagoError {
  public readonly eventId?: string;
  public readonly eventType?: string;

  constructor(
    message: string,
    eventId?: string,
    eventType?: string,
    originalError?: any
  ) {
    super(message, "WEBHOOK_ERROR", 500, "Webhook processing failed", originalError);
    this.name = "MercadoPagoWebhookError";
    this.eventId = eventId;
    this.eventType = eventType;
  }
}

// ============================================================================
// ERROR CODES MAPPING
// ============================================================================

/**
 * Códigos de error comunes de Mercado Pago
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/error-responses
 */
export const MP_ERROR_CODES = {
  // Authentication
  INVALID_ACCESS_TOKEN: "invalid_access_token",
  EXPIRED_ACCESS_TOKEN: "expired_access_token",
  INVALID_CLIENT_ID: "invalid_client_id",

  // Payment Errors
  REJECTED_HIGH_RISK: "cc_rejected_high_risk",
  REJECTED_INSUFFICIENT_AMOUNT: "cc_rejected_insufficient_amount",
  REJECTED_BAD_FILLED_CARD_NUMBER: "cc_rejected_bad_filled_card_number",
  REJECTED_BAD_FILLED_DATE: "cc_rejected_bad_filled_date",
  REJECTED_BAD_FILLED_SECURITY_CODE: "cc_rejected_bad_filled_security_code",
  REJECTED_CALL_FOR_AUTHORIZE: "cc_rejected_call_for_authorize",
  REJECTED_CARD_DISABLED: "cc_rejected_card_disabled",
  REJECTED_DUPLICATED_PAYMENT: "cc_rejected_duplicated_payment",
  REJECTED_MAX_ATTEMPTS: "cc_rejected_max_attempts",
  REJECTED_BLACKLIST: "cc_rejected_blacklist",

  // Other Errors
  AMOUNT_TOO_LOW: "amount_too_low",
  INVALID_PARAMETER: "invalid_parameter",
  NOT_FOUND: "not_found",
  PROCESSING_ERROR: "processing_error",
} as const;

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Mapea códigos de error de MP a mensajes user-friendly
 */
export function getUserFriendlyMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    // Authentication
    [MP_ERROR_CODES.INVALID_ACCESS_TOKEN]: "Payment service is temporarily unavailable. Please try again later.",
    [MP_ERROR_CODES.EXPIRED_ACCESS_TOKEN]: "Payment service is temporarily unavailable. Please try again later.",
    [MP_ERROR_CODES.INVALID_CLIENT_ID]: "Payment service configuration error. Please contact support.",

    // Card Rejections
    [MP_ERROR_CODES.REJECTED_HIGH_RISK]: "Payment rejected due to security reasons. Please try a different payment method.",
    [MP_ERROR_CODES.REJECTED_INSUFFICIENT_AMOUNT]: "Insufficient funds. Please use a different card or payment method.",
    [MP_ERROR_CODES.REJECTED_BAD_FILLED_CARD_NUMBER]: "Invalid card number. Please check and try again.",
    [MP_ERROR_CODES.REJECTED_BAD_FILLED_DATE]: "Invalid card expiration date. Please check and try again.",
    [MP_ERROR_CODES.REJECTED_BAD_FILLED_SECURITY_CODE]: "Invalid security code (CVV). Please check and try again.",
    [MP_ERROR_CODES.REJECTED_CALL_FOR_AUTHORIZE]: "Payment rejected. Please contact your card issuer for authorization.",
    [MP_ERROR_CODES.REJECTED_CARD_DISABLED]: "This card is disabled. Please use a different payment method.",
    [MP_ERROR_CODES.REJECTED_DUPLICATED_PAYMENT]: "This payment appears to be a duplicate. Please check your order history.",
    [MP_ERROR_CODES.REJECTED_MAX_ATTEMPTS]: "Too many payment attempts. Please try again later or use a different card.",
    [MP_ERROR_CODES.REJECTED_BLACKLIST]: "Payment rejected. Please contact support for assistance.",

    // Other
    [MP_ERROR_CODES.AMOUNT_TOO_LOW]: "Payment amount is too low. Minimum amount required.",
    [MP_ERROR_CODES.INVALID_PARAMETER]: "Invalid payment information. Please check your details and try again.",
    [MP_ERROR_CODES.NOT_FOUND]: "Payment or order not found. Please try again or contact support.",
    [MP_ERROR_CODES.PROCESSING_ERROR]: "An error occurred while processing your payment. Please try again.",
  };

  return messages[errorCode] || "An unexpected error occurred. Please try again or contact support.";
}

// ============================================================================
// ERROR PARSERS
// ============================================================================

/**
 * Parsea respuesta de error de la API de Mercado Pago
 */
export function parseMercadoPagoAPIError(error: any): MercadoPagoError {
  // Si ya es un MercadoPagoError, retornar
  if (error instanceof MercadoPagoError) {
    return error;
  }

  // Error de HTTP fetch
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data || {};

    // Error de autenticación
    if (status === 401 || status === 403) {
      return new MercadoPagoAuthError(
        data.message || "Authentication failed",
        error
      );
    }

    // Error de validación
    if (status === 400 && data.cause) {
      const validationErrors: Record<string, string[]> = {};

      if (Array.isArray(data.cause)) {
        data.cause.forEach((err: any) => {
          const field = err.code || "unknown";
          const message = err.description || err.message || "Invalid value";
          validationErrors[field] = [message];
        });
      }

      return new MercadoPagoValidationError(
        data.message || "Validation failed",
        validationErrors,
        error
      );
    }

    // Error de pago rechazado
    if (data.status === "rejected" || data.status_detail) {
      const code = data.status_detail || "payment_rejected";
      const message = getUserFriendlyMessage(code);

      return new MercadoPagoPaymentError(
        message,
        code,
        data.id?.toString(),
        data.external_reference,
        error
      );
    }

    // Error genérico de API
    return new MercadoPagoAPIError(
      data.message || `API Error: ${status}`,
      status,
      data.cause?.[0]?.description,
      error
    );
  }

  // Error de red
  if (error.message?.includes("fetch") || error.message?.includes("network")) {
    return new MercadoPagoError(
      "Network error. Please check your internet connection and try again.",
      "NETWORK_ERROR",
      0,
      "Network failure",
      error
    );
  }

  // Error desconocido
  return new MercadoPagoError(
    error.message || "An unexpected error occurred",
    "UNKNOWN_ERROR",
    500,
    "Unknown error",
    error
  );
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Registra error de Mercado Pago en logs estructurados
 */
export function logMercadoPagoError(error: MercadoPagoError, context?: Record<string, any>) {
  const logData = {
    timestamp: new Date().toISOString(),
    errorName: error.name,
    errorCode: error.code,
    errorMessage: error.message,
    errorStatus: error.status,
    errorCause: error.cause,
    context,
  };

  // En producción, enviar a servicio de logging (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === "production") {
    // TODO: Integrar con servicio de logging
    console.error("[MercadoPago Error]", JSON.stringify(logData, null, 2));
  } else {
    console.error("[MercadoPago Error]", logData);
  }

  // Si el error es crítico, alertar al equipo
  if (isCriticalError(error)) {
    alertTeam(error, context);
  }
}

/**
 * Determina si un error es crítico y requiere alerta inmediata
 */
function isCriticalError(error: MercadoPagoError): boolean {
  const criticalCodes = [
    "AUTH_ERROR",
    "WEBHOOK_ERROR",
    "PROCESSING_ERROR",
  ];

  return criticalCodes.includes(error.code) || (error.status && error.status >= 500);
}

/**
 * Alerta al equipo sobre errores críticos
 */
function alertTeam(error: MercadoPagoError, context?: Record<string, any>) {
  // TODO: Integrar con Slack, PagerDuty, etc.
  console.error("🚨 CRITICAL MERCADO PAGO ERROR 🚨", {
    error: error.message,
    code: error.code,
    context,
  });
}

// ============================================================================
// ERROR RECOVERY
// ============================================================================

/**
 * Determina si un error es recuperable (retry-able)
 */
export function isRecoverableError(error: MercadoPagoError): boolean {
  const recoverableCodes = [
    "NETWORK_ERROR",
    "PROCESSING_ERROR",
    MP_ERROR_CODES.EXPIRED_ACCESS_TOKEN,
  ];

  return recoverableCodes.includes(error.code) || (error.status && error.status >= 500);
}

/**
 * Sugiere próximos pasos para el usuario basado en el error
 */
export function getSuggestedAction(error: MercadoPagoError): string {
  if (error instanceof MercadoPagoPaymentError) {
    const code = error.code;

    if (code === MP_ERROR_CODES.REJECTED_INSUFFICIENT_AMOUNT) {
      return "Try using a different payment method or check your account balance.";
    }

    if (code === MP_ERROR_CODES.REJECTED_BAD_FILLED_CARD_NUMBER ||
        code === MP_ERROR_CODES.REJECTED_BAD_FILLED_DATE ||
        code === MP_ERROR_CODES.REJECTED_BAD_FILLED_SECURITY_CODE) {
      return "Please double-check your card details and try again.";
    }

    if (code === MP_ERROR_CODES.REJECTED_CALL_FOR_AUTHORIZE) {
      return "Contact your card issuer to authorize this payment, then try again.";
    }

    if (code === MP_ERROR_CODES.REJECTED_MAX_ATTEMPTS) {
      return "Wait a few minutes before trying again, or use a different payment method.";
    }

    return "Try using a different payment method or contact support for help.";
  }

  if (error instanceof MercadoPagoAuthError) {
    return "Our payment service is experiencing technical difficulties. Please try again later or contact support.";
  }

  if (error.code === "NETWORK_ERROR") {
    return "Check your internet connection and try again.";
  }

  if (isRecoverableError(error)) {
    return "This is a temporary error. Please try again in a few moments.";
  }

  return "Contact support with error code: " + error.code;
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number; // ms
  maxDelay?: number; // ms
  backoffFactor?: number;
}

/**
 * Ejecuta una función con retry automático en caso de errores recuperables
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const mpError = parseMercadoPagoAPIError(error);
      lastError = mpError;

      // Si no es recuperable, lanzar inmediatamente
      if (!isRecoverableError(mpError)) {
        throw mpError;
      }

      // Si es el último intento, lanzar
      if (attempt === maxAttempts) {
        throw mpError;
      }

      // Log retry attempt
      console.warn(`Retry attempt ${attempt}/${maxAttempts} after error:`, mpError.code);

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError!;
}
