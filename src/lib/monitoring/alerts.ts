/**
 * Alert System
 * Send notifications for critical events
 */

import { logger } from "./logger";

export type AlertSeverity = "info" | "warning" | "error" | "critical";
export type AlertChannel = "email" | "slack" | "sms" | "pagerduty";

interface Alert {
  title: string;
  message: string;
  severity: AlertSeverity;
  metadata?: Record<string, unknown>;
  channels?: AlertChannel[];
}

class AlertManager {
  private alertThresholds: Map<string, number> = new Map();
  private alertCounts: Map<string, number> = new Map();
  private alertLastSent: Map<string, number> = new Map();

  // Rate limiting: max 1 alert of same type per 5 minutes
  private readonly RATE_LIMIT_MS = 5 * 60 * 1000;

  /**
   * Send an alert
   */
  async send(alert: Alert): Promise<void> {
    const alertKey = this.getAlertKey(alert);

    // Check rate limit
    if (this.isRateLimited(alertKey)) {
      logger.debug(
        {
          type: "alert_rate_limited",
          alert: alertKey,
        },
        "Alert rate limited",
      );
      return;
    }

    // Log alert
    logger[this.mapSeverityToLogLevel(alert.severity)](
      {
        type: "alert",
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        metadata: alert.metadata,
        channels: alert.channels,
      },
      `Alert: \${alert.title}`,
    );

    // Send to configured channels
    const channels = alert.channels || this.getDefaultChannels(alert.severity);

    await Promise.all(channels.map((channel) => this.sendToChannel(channel, alert)));

    // Update rate limit tracking
    this.alertLastSent.set(alertKey, Date.now());
  }

  /**
   * Send email alert
   */
  private async sendEmail(alert: Alert): Promise<void> {
    // In production, integrate with email service (Resend, SendGrid, etc.)
    if (process.env.NODE_ENV === "production") {
      // await emailService.send({
      //   to: process.env.ALERT_EMAIL,
      //   subject: `[\${alert.severity.toUpperCase()}] \${alert.title}`,
      //   body: alert.message,
      // });
    }

    logger.info({ alert }, "Email alert would be sent");
  }

  /**
   * Send Slack alert
   */
  private async sendSlack(alert: Alert): Promise<void> {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      logger.warn("Slack webhook URL not configured");
      return;
    }

    const color = this.getSlackColor(alert.severity);
    const payload = {
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: alert.metadata
            ? Object.entries(alert.metadata).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              }))
            : undefined,
          footer: "Tienda Online Monitoring",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: \${response.statusText}`);
      }
    } catch (error) {
      logger.error({ error }, "Failed to send Slack alert");
    }
  }

  /**
   * Send SMS alert
   */
  private async sendSMS(alert: Alert): Promise<void> {
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    if (process.env.NODE_ENV === "production") {
      // await smsService.send({
      //   to: process.env.ALERT_PHONE,
      //   message: `[\${alert.severity}] \${alert.title}: \${alert.message}`,
      // });
    }

    logger.info({ alert }, "SMS alert would be sent");
  }

  /**
   * Send PagerDuty alert
   */
  private async sendPagerDuty(alert: Alert): Promise<void> {
    const pagerDutyKey = process.env.PAGERDUTY_INTEGRATION_KEY;

    if (!pagerDutyKey) {
      logger.warn("PagerDuty integration key not configured");
      return;
    }

    const payload = {
      routing_key: pagerDutyKey,
      event_action: "trigger",
      payload: {
        summary: alert.title,
        severity: alert.severity,
        source: "tienda-online-app",
        custom_details: {
          message: alert.message,
          ...alert.metadata,
        },
      },
    };

    try {
      const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API error: \${response.statusText}`);
      }
    } catch (error) {
      logger.error({ error }, "Failed to send PagerDuty alert");
    }
  }

  /**
   * Route alert to appropriate channel
   */
  private async sendToChannel(channel: AlertChannel, alert: Alert): Promise<void> {
    switch (channel) {
      case "email":
        return this.sendEmail(alert);
      case "slack":
        return this.sendSlack(alert);
      case "sms":
        return this.sendSMS(alert);
      case "pagerduty":
        return this.sendPagerDuty(alert);
      default:
        logger.warn({ channel }, "Unknown alert channel");
    }
  }

  /**
   * Get default channels based on severity
   */
  private getDefaultChannels(severity: AlertSeverity): AlertChannel[] {
    switch (severity) {
      case "critical":
        return ["slack", "pagerduty", "email", "sms"];
      case "error":
        return ["slack", "email"];
      case "warning":
        return ["slack"];
      case "info":
      default:
        return ["slack"];
    }
  }

  /**
   * Check if alert is rate limited
   */
  private isRateLimited(alertKey: string): boolean {
    const lastSent = this.alertLastSent.get(alertKey);

    if (!lastSent) {
      return false;
    }

    return Date.now() - lastSent < this.RATE_LIMIT_MS;
  }

  /**
   * Generate alert key for rate limiting
   */
  private getAlertKey(alert: Alert): string {
    return `\${alert.severity}:\${alert.title}`;
  }

  /**
   * Map severity to log level
   */
  private mapSeverityToLogLevel(severity: AlertSeverity): "info" | "warn" | "error" {
    switch (severity) {
      case "critical":
      case "error":
        return "error";
      case "warning":
        return "warn";
      case "info":
      default:
        return "info";
    }
  }

  /**
   * Get Slack color for severity
   */
  private getSlackColor(severity: AlertSeverity): string {
    switch (severity) {
      case "critical":
        return "#ff0000"; // Red
      case "error":
        return "#ff6600"; // Orange
      case "warning":
        return "#ffcc00"; // Yellow
      case "info":
      default:
        return "#36a64f"; // Green
    }
  }
}

// Global alert manager instance
export const alertManager = new AlertManager();

// Convenience functions for common alerts

export async function alertDatabaseDown(error: Error): Promise<void> {
  await alertManager.send({
    title: "Database Connection Failed",
    message: `Unable to connect to database: \${error.message}`,
    severity: "critical",
    metadata: {
      error: error.message,
      stack: error.stack,
    },
    channels: ["slack", "pagerduty", "email"],
  });
}

export async function alertHighErrorRate(errorRate: number, threshold: number): Promise<void> {
  await alertManager.send({
    title: "High Error Rate Detected",
    message: `Error rate (\${errorRate}%) exceeds threshold (\${threshold}%)`,
    severity: "error",
    metadata: {
      errorRate,
      threshold,
    },
  });
}

export async function alertSlowResponse(endpoint: string, duration: number): Promise<void> {
  await alertManager.send({
    title: "Slow Response Time",
    message: `Endpoint \${endpoint} responded in \${duration}ms`,
    severity: "warning",
    metadata: {
      endpoint,
      duration,
    },
  });
}

export async function alertHighMemoryUsage(percentage: number): Promise<void> {
  await alertManager.send({
    title: "High Memory Usage",
    message: `Memory usage at \${percentage}%`,
    severity: percentage > 90 ? "critical" : "warning",
    metadata: {
      percentage,
    },
  });
}

export async function alertPaymentFailed(orderId: string, error: string): Promise<void> {
  await alertManager.send({
    title: "Payment Processing Failed",
    message: `Payment failed for order \${orderId}: \${error}`,
    severity: "error",
    metadata: {
      orderId,
      error,
    },
    channels: ["slack", "email"],
  });
}

export default alertManager;
