/**
 * Push Notifications Service - Tarea 18.4
 * Web Push Notifications con VAPID
 */

import webpush from "web-push";
import { db } from "@/lib/db";

// Configurar VAPID
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "test_public_key",
  process.env.VAPID_PRIVATE_KEY || "test_private_key"
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: any;
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    console.log("Push notification sent:", payload.title);
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription expirada - eliminar de BD
      console.log("Push subscription expired, removing...");
      // await removePushSubscription(subscription.endpoint);
    } else {
      console.error("Error sending push notification:", error);
    }
  }
}

// Enviar a múltiples subscripciones
export async function sendPushToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    const promises = subscriptions.map(sub =>
      sendPushNotification(sub.subscription as any, payload)
    );

    await Promise.all(promises);
  } catch (error) {
    console.error("Error sending push to user:", error);
  }
}

// Registrar nueva subscripción
export async function registerPushSubscription(
  userId: string,
  subscription: webpush.PushSubscription
): Promise<void> {
  await db.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      subscription: subscription as any,
    },
  });
}

// Modelo Prisma necesario
// model PushSubscription {
//   id           String   @id @default(cuid())
//   userId       String
//   user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
//   endpoint     String   @unique
//   subscription Json     // PushSubscription object
//   createdAt    DateTime @default(now())
//   @@index([userId])
// }
