/**
 * Error Handling & Recovery
 * Semana 35, Tarea 35.11: Error Handling & Recovery
 */

import { logger } from '@/lib/monitoring'

export class ApplicationError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}

export class PaymentError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super('PAYMENT_ERROR', message, 402, details)
    this.name = 'PaymentError'
  }
}

export class FraudDetectionError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super('FRAUD_DETECTED', message, 403, details)
    this.name = 'FraudDetectionError'
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} with id ${id} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
    this.name = 'UnauthorizedError'
  }
}

export interface ErrorContext {
  userId?: string
  requestId?: string
  endpoint?: string
  timestamp: Date
  userAgent?: string
  ip?: string
}

export class ErrorHandler {
  private retryableErrors = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH']
  private maxRetries = 3
  private retryDelays = [1000, 2000, 4000] // exponential backoff

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: ErrorContext,
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        const isRetryable = this.isRetryableError(error)

        if (!isRetryable || attempt === this.maxRetries) {
          logger.error(
            {
              type: 'operation_failed',
              operation: operationName,
              attempt: attempt + 1,
              error: lastError.message,
              context,
            },
            `Operation ${operationName} failed after ${attempt + 1} attempts`,
          )
          throw error
        }

        const delayMs = this.retryDelays[attempt]
        logger.warn(
          {
            type: 'operation_retry',
            operation: operationName,
            attempt: attempt + 1,
            delayMs,
            error: lastError.message,
          },
          `Retrying operation ${operationName} in ${delayMs}ms`,
        )

        await this.sleep(delayMs)
      }
    }

    throw lastError || new Error(`Operation ${operationName} failed`)
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false

    // Check error code
    if (error.code && this.retryableErrors.includes(error.code)) {
      return true
    }

    // Check if it's a network error
    if (error.message && error.message.toLowerCase().includes('network')) {
      return true
    }

    // Check if it's a temporary error (5xx)
    if (error.statusCode >= 500 && error.statusCode < 600) {
      return true
    }

    return false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  handleError(error: unknown, context?: ErrorContext): ApplicationError {
    if (error instanceof ApplicationError) {
      logger.error(
        {
          type: error.code,
          statusCode: error.statusCode,
          details: error.details,
          context,
        },
        error.message,
      )
      return error
    }

    if (error instanceof Error) {
      logger.error(
        {
          type: 'UNHANDLED_ERROR',
          errorType: error.name,
          message: error.message,
          stack: error.stack,
          context,
        },
        `Unhandled error: ${error.message}`,
      )

      return new ApplicationError('INTERNAL_ERROR', 'An unexpected error occurred', 500, {
        originalError: error.message,
      })
    }

    logger.error(
      {
        type: 'UNKNOWN_ERROR',
        error: String(error),
        context,
      },
      'Unknown error type',
    )

    return new ApplicationError('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }

  logErrorWithContext(error: Error, context: ErrorContext): void {
    logger.error(
      {
        type: 'error_with_context',
        errorMessage: error.message,
        errorStack: error.stack,
        ...context,
      },
      `Error occurred in ${context.endpoint || 'unknown'} endpoint`,
    )
  }

  createErrorResponse(error: ApplicationError) {
    return {
      error: true,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: new Date().toISOString(),
    }
  }
}

export const errorHandler = new ErrorHandler()
