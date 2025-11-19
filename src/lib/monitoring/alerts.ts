// Alerting System
// Threshold-based alerts for system monitoring

import { logger } from "./logger";

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  acknowledged: boolean;
  metadata?: Record<string, unknown>;
}

export interface AlertThreshold {
  metric: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  value: number;
  severity: AlertSeverity;
  message: string;
}

// Alert store
const alertStore: Alert[] = [];
const MAX_ALERTS = 500;

// Default thresholds
export const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    metric: "error_rate",
    operator: "gt",
    value: 1,
    severity: "warning",
    message: "Tasa de errores alta: {value}%",
  },
  {
    metric: "error_rate",
    operator: "gt",
    value: 5,
    severity: "critical",
    message: "Tasa de errores crítica: {value}%",
  },
  {
    metric: "response_time",
    operator: "gt",
    value: 2000,
    severity: "warning",
    message: "Tiempo de respuesta alto: {value}ms",
  },
  {
    metric: "response_time",
    operator: "gt",
    value: 5000,
    severity: "critical",
    message: "Tiempo de respuesta crítico: {value}ms",
  },
  {
    metric: "db_connections",
    operator: "gt",
    value: 16,
    severity: "warning",
    message: "Conexiones DB altas: {value}/20",
  },
  {
    metric: "memory_usage",
    operator: "gt",
    value: 80,
    severity: "warning",
    message: "Uso de memoria alto: {value}%",
  },
];

// Check if value triggers threshold
function checkThreshold(
  threshold: AlertThreshold,
  value: number
): boolean {
  switch (threshold.operator) {
    case "gt": return value > threshold.value;
    case "lt": return value < threshold.value;
    case "eq": return value === threshold.value;
    case "gte": return value >= threshold.value;
    case "lte": return value <= threshold.value;
    default: return false;
  }
}

// Create alert
export function createAlert(
  type: string,
  message: string,
  severity: AlertSeverity,
  metadata?: Record<string, unknown>
): Alert {
  const alert: Alert = {
    id: crypto.randomUUID(),
    type,
    message,
    severity,
    timestamp: new Date().toISOString(),
    acknowledged: false,
    metadata,
  };

  alertStore.push(alert);
  if (alertStore.length > MAX_ALERTS) {
    alertStore.shift();
  }

  // Log alert
  logger.warn("ALERT: " + message, {
    alertId: alert.id,
    type,
    severity,
    ...metadata,
  });

  // Send notification
  sendAlertNotification(alert);

  return alert;
}

// Check metrics against thresholds
export function checkMetrics(
  metrics: Record<string, number>,
  thresholds: AlertThreshold[] = DEFAULT_THRESHOLDS
): Alert[] {
  const alerts: Alert[] = [];

  for (const threshold of thresholds) {
    const value = metrics[threshold.metric];
    if (value !== undefined && checkThreshold(threshold, value)) {
      const message = threshold.message.replace("{value}", String(value));
      const alert = createAlert(
        threshold.metric,
        message,
        threshold.severity,
        { value, threshold: threshold.value }
      );
      alerts.push(alert);
    }
  }

  return alerts;
}

// Send alert notification
async function sendAlertNotification(alert: Alert): Promise<void> {
  // In production, send to Slack, email, PagerDuty, etc.
  if (alert.severity === "critical") {
    console.log("[CRITICAL ALERT]", alert.message);
    // await sendSlackNotification(alert);
    // await sendPagerDuty(alert);
  }
}

// Get active alerts
export function getActiveAlerts(): Alert[] {
  return alertStore.filter((a) => !a.acknowledged);
}

// Acknowledge alert
export function acknowledgeAlert(id: string): boolean {
  const alert = alertStore.find((a) => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

// Get alert statistics
export function getAlertStats(): {
  total: number;
  active: number;
  bySeverity: Record<string, number>;
} {
  const bySeverity: Record<string, number> = {
    info: 0,
    warning: 0,
    critical: 0,
  };

  let active = 0;
  for (const alert of alertStore) {
    bySeverity[alert.severity]++;
    if (!alert.acknowledged) active++;
  }

  return {
    total: alertStore.length,
    active,
    bySeverity,
  };
}
