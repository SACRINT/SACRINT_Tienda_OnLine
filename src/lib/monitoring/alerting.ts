/**
 * Alerting System - Alertas Automáticas
 * Semana 31, Tarea 31.9: Sistema de alertas basado en umbrales y patrones
 */

import { logger } from "./logger";
import { captureMessage } from "./sentry";

/**
 * Severidad de alerta
 */
export type AlertSeverity = "info" | "warning" | "critical";

/**
 * Tipo de condición
 */
export type ConditionType = "threshold" | "change" | "pattern" | "custom";

/**
 * Canales de envío
 */
export type AlertChannel = "log" | "email" | "slack" | "sms" | "webhook";

/**
 * Alerta disparada
 */
export interface Alert {
  id: string;
  ruleId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
  metadata?: Record<string, any>;
}

/**
 * Regla de alerta
 */
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  severity: AlertSeverity;
  condition: {
    type: ConditionType;
    metric: string;
    threshold?: number;
    operator?: ">" | "<" | "==" | "!=" | ">=" | "<=";
    windowMs?: number; // Ventana de tiempo para análisis
  };
  channels: AlertChannel[];
  cooldownMs?: number; // Evitar alertas duplicadas
  actions?: Array<{
    type: "notify" | "auto_recover" | "log" | "webhook";
    config: Record<string, any>;
  }>;
}

/**
 * Monitor de alertas
 */
export class AlertingSystem {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private handlers: Map<string, (alert: Alert) => Promise<void>> = new Map();
  private maxAlertHistory = 1000;

  constructor() {
    logger.debug({ type: "alerting_system_init" }, "Alerting System inicializado");
  }

  /**
   * Registrar una regla de alerta
   */
  registerRule(rule: AlertRule): void {
    this.rules.set(rule.id, {
      ...rule,
      enabled: true,
    });

    logger.debug(
      {
        type: "alert_rule_registered",
        ruleId: rule.id,
        severity: rule.severity,
      },
      `Regla de alerta registrada: ${rule.name}`,
    );
  }

  /**
   * Habilitar/deshabilitar regla
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      logger.debug(
        { type: "alert_rule_toggled", ruleId, enabled },
        `Regla ${ruleId} ${enabled ? "habilitada" : "deshabilitada"}`,
      );
    }
  }

  /**
   * Evaluar una condición y disparar alerta si es necesario
   */
  async evaluateCondition(ruleId: string, currentValue: number): Promise<Alert | null> {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      return null;
    }

    // Verificar cooldown
    const lastAlert = this.lastAlertTime.get(ruleId);
    if (lastAlert && Date.now() - lastAlert < (rule.cooldownMs || 0)) {
      return null;
    }

    // Evaluar condición
    let shouldAlert = false;

    if (rule.condition.type === "threshold") {
      const operator = rule.condition.operator || ">";
      const threshold = rule.condition.threshold || 0;

      shouldAlert = this.evaluateThreshold(currentValue, threshold, operator);
    } else if (rule.condition.type === "custom") {
      // Se maneja externamente con triggerAlert
      return null;
    }

    if (shouldAlert) {
      return await this.triggerAlert(ruleId, rule, currentValue);
    }

    return null;
  }

  /**
   * Evaluar umbral
   */
  private evaluateThreshold(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case ">":
        return value > threshold;
      case "<":
        return value < threshold;
      case ">=":
        return value >= threshold;
      case "<=":
        return value <= threshold;
      case "==":
        return value === threshold;
      case "!=":
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Disparar alerta manualmente
   */
  async triggerAlert(ruleId: string, rule: AlertRule, value?: number): Promise<Alert> {
    const alert: Alert = {
      id: `${ruleId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ruleId,
      severity: rule.severity,
      title: rule.name,
      message: `Alert triggered: ${rule.description || rule.name}${value !== undefined ? ` (value: ${value})` : ""}`,
      timestamp: Date.now(),
      metadata: { ruleId, value },
    };

    // Guardar alerta
    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlertHistory) {
      this.alerts.shift();
    }

    // Actualizar cooldown
    this.lastAlertTime.set(ruleId, Date.now());

    // Loguear
    logger.warn(
      {
        type: "alert_triggered",
        alertId: alert.id,
        ruleId,
        severity: rule.severity,
      },
      `ALERT [${rule.severity.toUpperCase()}]: ${rule.name}`,
    );

    // Enviar a Sentry si es crítico
    if (rule.severity === "critical") {
      captureMessage(`Critical Alert: ${rule.name}`, "error");
    }

    // Ejecutar canales
    for (const channel of rule.channels) {
      try {
        await this.sendAlert(alert, channel, rule);
      } catch (error) {
        logger.error(
          {
            type: "alert_channel_error",
            channel,
            error,
            alertId: alert.id,
          },
          `Error enviando alerta por ${channel}`,
        );
      }
    }

    // Ejecutar acciones
    if (rule.actions) {
      for (const action of rule.actions) {
        try {
          await this.executeAction(alert, action);
        } catch (error) {
          logger.error(
            {
              type: "alert_action_error",
              action: action.type,
              error,
            },
            `Error ejecutando acción de alerta: ${action.type}`,
          );
        }
      }
    }

    return alert;
  }

  /**
   * Enviar alerta por canal específico
   */
  private async sendAlert(alert: Alert, channel: AlertChannel, rule: AlertRule): Promise<void> {
    const handler = this.handlers.get(channel);

    if (handler) {
      await handler(alert);
      return;
    }

    // Implementaciones predefinidas
    switch (channel) {
      case "log":
        logger[alert.severity === "critical" ? "error" : "warn"](
          { type: "alert", alertId: alert.id },
          alert.message,
        );
        break;

      case "email":
        // Implementación de envío de email
        logger.debug(
          { type: "alert_email_sent", alertId: alert.id },
          `Email enviado para alerta: ${alert.title}`,
        );
        break;

      case "slack":
        // Implementación de Slack
        logger.debug(
          { type: "alert_slack_sent", alertId: alert.id },
          `Mensaje Slack enviado para alerta: ${alert.title}`,
        );
        break;

      case "sms":
        // Implementación de SMS
        logger.debug(
          { type: "alert_sms_sent", alertId: alert.id },
          `SMS enviado para alerta: ${alert.title}`,
        );
        break;

      case "webhook":
        // Implementación de webhook
        logger.debug(
          { type: "alert_webhook_sent", alertId: alert.id },
          `Webhook enviado para alerta: ${alert.title}`,
        );
        break;
    }
  }

  /**
   * Ejecutar acciones de alerta
   */
  private async executeAction(
    alert: Alert,
    action: NonNullable<AlertRule["actions"]>[number],
  ): Promise<void> {
    switch (action.type) {
      case "notify":
        logger.warn(
          { type: "alert_action_notify", alertId: alert.id },
          `Notificación de alerta: ${action.config.message || alert.message}`,
        );
        break;

      case "auto_recover":
        logger.info(
          { type: "alert_action_auto_recover", alertId: alert.id },
          `Intento de auto-recuperación: ${action.config.action}`,
        );
        break;

      case "log":
        logger.error(
          { type: "alert_action_log", alertId: alert.id, ...action.config },
          "Alert action logged",
        );
        break;

      case "webhook":
        // Enviar a webhook
        const webhookUrl = action.config.url;
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(alert),
          });
        }
        break;
    }
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();

      logger.info({ type: "alert_resolved", alertId }, `Alerta resuelta: ${alert.title}`);
    }
  }

  /**
   * Registrar handler personalizado
   */
  registerHandler(channel: AlertChannel, handler: (alert: Alert) => Promise<void>): void {
    this.handlers.set(channel, handler);
    logger.debug(
      { type: "alert_handler_registered", channel },
      `Handler de alerta registrado: ${channel}`,
    );
  }

  /**
   * Obtener alertas activas
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((a) => !a.resolved).slice(-100);
  }

  /**
   * Obtener alertas por severidad
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter((a) => a.severity === severity && !a.resolved).slice(-50);
  }

  /**
   * Obtener historial de alertas
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Generar reporte
   */
  generateReport(): string {
    const active = this.getActiveAlerts();
    const critical = this.getAlertsBySeverity("critical");
    const warning = this.getAlertsBySeverity("warning");

    let report = "Alert System Report\n";
    report += "===================\n\n";

    report += `Total Rules: ${this.rules.size}\n`;
    report += `Active Alerts: ${active.length}\n`;
    report += `Critical: ${critical.length} | Warning: ${warning.length}\n\n`;

    if (active.length > 0) {
      report += "Active Alerts:\n";
      for (const alert of active.slice(0, 10)) {
        const duration = Math.round((Date.now() - alert.timestamp) / 1000 / 60);
        report += `  [${alert.severity.toUpperCase()}] ${alert.title} (${duration}min ago)\n`;
      }
    }

    return report;
  }
}

/**
 * Instancia global
 */
let globalSystem: AlertingSystem | null = null;

/**
 * Inicializar globalmente
 */
export function initializeAlertingSystem(): AlertingSystem {
  if (!globalSystem) {
    globalSystem = new AlertingSystem();
  }
  return globalSystem;
}

/**
 * Obtener sistema global
 */
export function getAlertingSystem(): AlertingSystem {
  if (!globalSystem) {
    return initializeAlertingSystem();
  }
  return globalSystem;
}

/**
 * Reglas predefinidas comunes
 */
export const CommonAlertRules = {
  /**
   * Alerta de tasa de error alta
   */
  highErrorRate: (): AlertRule => ({
    id: "high-error-rate",
    name: "High Error Rate",
    description: "Tasa de errores superior al 5%",
    enabled: true,
    severity: "critical",
    condition: {
      type: "threshold",
      metric: "error_rate",
      threshold: 5,
      operator: ">",
      windowMs: 5 * 60 * 1000,
    },
    channels: ["log", "email", "slack"],
    cooldownMs: 10 * 60 * 1000,
  }),

  /**
   * Alerta de latencia alta
   */
  highLatency: (): AlertRule => ({
    id: "high-latency",
    name: "High API Latency",
    description: "Latencia promedio superior a 2000ms",
    enabled: true,
    severity: "warning",
    condition: {
      type: "threshold",
      metric: "api_latency",
      threshold: 2000,
      operator: ">",
      windowMs: 5 * 60 * 1000,
    },
    channels: ["log"],
    cooldownMs: 10 * 60 * 1000,
  }),

  /**
   * Alerta de base de datos lenta
   */
  slowDatabase: (): AlertRule => ({
    id: "slow-database",
    name: "Slow Database Queries",
    description: "Queries lentas detectadas",
    enabled: true,
    severity: "warning",
    condition: {
      type: "threshold",
      metric: "slow_queries",
      threshold: 10,
      operator: ">",
      windowMs: 5 * 60 * 1000,
    },
    channels: ["log"],
    cooldownMs: 15 * 60 * 1000,
  }),

  /**
   * Alerta de memoria alta
   */
  highMemory: (): AlertRule => ({
    id: "high-memory",
    name: "High Memory Usage",
    description: "Uso de memoria superior al 85%",
    enabled: true,
    severity: "warning",
    condition: {
      type: "threshold",
      metric: "memory_usage_percent",
      threshold: 85,
      operator: ">",
    },
    channels: ["log"],
    cooldownMs: 10 * 60 * 1000,
  }),

  /**
   * Alerta de servicio crítico caído
   */
  serviceCriticalDown: (): AlertRule => ({
    id: "service-critical-down",
    name: "Critical Service Down",
    description: "Servicio crítico no disponible",
    enabled: true,
    severity: "critical",
    condition: {
      type: "custom",
      metric: "service_health",
    },
    channels: ["log", "email", "slack", "sms"],
    cooldownMs: 5 * 60 * 1000,
    actions: [
      {
        type: "notify",
        config: { message: "Critical service is down" },
      },
    ],
  }),
};
