/**
 * Error Tracking - Semana 27
 * Monitoreo y tracking de errores
 */

export interface ErrorLog {
  message: string;
  stack?: string;
  context?: any;
  userId?: string;
  timestamp: Date;
}

const errors: ErrorLog[] = [];

export function logError(error: Error | string, context?: any) {
  const errorLog: ErrorLog = {
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'object' ? error.stack : undefined,
    context,
    timestamp: new Date(),
  };

  errors.push(errorLog);
  console.error('[ERROR]', errorLog);

  // En producción: enviar a Sentry, LogRocket, etc.
}

export function getRecentErrors(limit: number = 50) {
  return errors.slice(-limit);
}

export function clearErrorLogs() {
  errors.length = 0;
}
