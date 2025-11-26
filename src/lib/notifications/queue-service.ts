/**
 * Notification Queue - Tarea 18.6
 * Sistema de cola para envío asíncrono de notificaciones
 */

import { db } from "@/lib/db";

// En producción usar Bull + Redis
// Por ahora implementación simple con base de datos

export interface QueuedEmail {
  to: string;
  subject: string;
  template: string;
  data: any;
  attempts?: number;
  scheduledFor?: Date;
}

export async function queueEmail(email: QueuedEmail): Promise<void> {
  await db.emailQueue.create({
    data: {
      to: email.to,
      subject: email.subject,
      template: email.template,
      data: email.data,
      attempts: email.attempts || 0,
      status: "PENDING",
      scheduledFor: email.scheduledFor || new Date(),
    },
  });
}

export async function processEmailQueue(): Promise<void> {
  const pendingEmails = await db.emailQueue.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: new Date() },
      attempts: { lt: 3 },
    },
    take: 100, // Procesar en lotes
  });

  for (const email of pendingEmails) {
    try {
      // Importar dinámicamente para evitar circular deps
      const { sendEmail } = await import("../email/email-service");
      const templates = await import("../email/templates");

      // Obtener template
      const Template = (templates as any)[email.template];
      if (!Template) {
        throw new Error(`Template ${email.template} not found`);
      }

      // Enviar email
      await sendEmail({
        to: email.to,
        subject: email.subject,
        react: Template(email.data),
      });

      // Marcar como enviado
      await db.emailQueue.update({
        where: { id: email.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error);

      // Incrementar intentos
      await db.emailQueue.update({
        where: { id: email.id },
        data: {
          attempts: { increment: 1 },
          lastError: error instanceof Error ? error.message : "Unknown error",
        },
      });

      // Si alcanzó máximo de intentos, marcar como fallido
      if (email.attempts >= 2) {
        await db.emailQueue.update({
          where: { id: email.id },
          data: { status: "FAILED" },
        });
      }
    }
  }
}

// Modelo Prisma necesario
// model EmailQueue {
//   id           String   @id @default(cuid())
//   to           String
//   subject      String
//   template     String
//   data         Json
//   status       String   @default("PENDING") // PENDING, SENT, FAILED
//   attempts     Int      @default(0)
//   scheduledFor DateTime @default(now())
//   sentAt       DateTime?
//   lastError    String?
//   createdAt    DateTime @default(now())
//   @@index([status, scheduledFor])
// }
