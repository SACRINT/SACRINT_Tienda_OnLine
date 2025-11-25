# WebSocket Real-Time Notifications

Sistema de notificaciones en tiempo real implementado con Socket.IO para la plataforma de e-commerce.

## 🎯 Características

- ✅ Notificaciones en tiempo real vía WebSocket
- ✅ Fallback automático a long polling si WebSocket no está disponible
- ✅ Soporte multi-tenant con aislamiento de datos
- ✅ Persistencia local con localStorage
- ✅ Notificaciones del navegador (push notifications)
- ✅ Sistema de preferencias por canal (email, push, in-app)
- ✅ Reconexión automática
- ✅ Indicadores visuales de estado de conexión
- ✅ Soporte para dark mode

## 📦 Componentes

### Servidor (`/src/lib/websocket/server.ts`)

Servidor WebSocket basado en Socket.IO que gestiona:

- Conexiones de clientes
- Suscripciones a tenants
- Emisión de eventos tipados
- Gestión de rooms por tenant

**Tipos de notificaciones soportadas:**

- `ORDER_CREATED` - Nueva orden recibida
- `ORDER_UPDATED` - Estado de orden actualizado
- `ORDER_PAID` - Pago confirmado
- `ORDER_SHIPPED` - Orden enviada
- `ORDER_DELIVERED` - Orden entregada
- `INVENTORY_LOW` - Inventario bajo
- `INVENTORY_OUT` - Producto agotado
- `PAYMENT_FAILED` - Pago fallido
- `REFUND_PROCESSED` - Reembolso procesado
- `NEW_REVIEW` - Nueva reseña recibida
- `SYSTEM_ALERT` - Alerta del sistema

### Cliente (`/src/lib/websocket/client.ts`)

Cliente WebSocket que gestiona:

- Inicialización de conexión
- Suscripción/desuscripción de tenants
- Marcado de notificaciones como leídas
- Reconexión automática

### Hook React (`/src/hooks/useNotifications.ts`)

Hook personalizado para integración con componentes React:

```typescript
const {
  notifications,
  unreadCount,
  isConnected,
  markAsRead,
  markAllAsRead,
  clearAll,
  removeNotification,
} = useNotifications({ tenantId: "tenant-123" });
```

### Componente UI (`/src/components/notifications/NotificationCenter.tsx`)

Centro de notificaciones con:

- Popover con lista de notificaciones
- Badge con contador de no leídas
- Indicador de estado de conexión
- Acciones: marcar como leída, eliminar, limpiar todas

## 🚀 Uso

### 1. Inicializar en el servidor

**IMPORTANTE:** Socket.IO requiere un servidor HTTP personalizado. En Next.js, esto se hace a través de `server.js` o en las Edge Functions si se usa Vercel.

```typescript
// server.ts (custom server)
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initializeWebSocketServer } from "@/lib/websocket/server";

const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Inicializar WebSocket
  initializeWebSocketServer(server);

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
});
```

### 2. Usar en componentes React

```typescript
"use client";

import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  if (!session?.user?.tenantId) return null;

  return (
    <header>
      <nav>
        {/* ... otros elementos ... */}
        <NotificationCenter tenantId={session.user.tenantId} />
      </nav>
    </header>
  );
}
```

### 3. Emitir notificaciones desde el backend

```typescript
import {
  emitOrderCreated,
  emitOrderUpdated,
  emitLowInventory,
  emitPaymentCompleted,
} from "@/lib/websocket/server";

// Después de crear una orden
await db.order.create({ data: orderData });
emitOrderCreated(tenantId, order.id, order.total);

// Después de actualizar estado de orden
await db.order.update({
  where: { id: orderId },
  data: { status: "SHIPPED" },
});
emitOrderUpdated(tenantId, orderId, "SHIPPED");

// Al detectar inventario bajo
if (product.stock <= product.lowStockThreshold) {
  emitLowInventory(tenantId, product.id, product.name, product.stock);
}

// Después de confirmar pago
emitPaymentCompleted(tenantId, order.id, payment.amount);
```

### 4. Emitir notificaciones personalizadas

```typescript
import { emitToTenant, type Notification } from "@/lib/websocket/server";

const notification: Notification = {
  id: `custom-${Date.now()}`,
  type: "SYSTEM_ALERT",
  title: "Mantenimiento programado",
  message: "El sistema estará en mantenimiento esta noche",
  tenantId: "tenant-123",
  read: false,
  createdAt: new Date(),
  data: {
    maintenanceStart: "2024-01-15T22:00:00Z",
    maintenanceEnd: "2024-01-15T23:00:00Z",
  },
};

emitToTenant("tenant-123", notification);
```

## 🎨 Personalización

### Agregar nuevos tipos de notificación

1. Agregar el tipo en `server.ts`:

```typescript
export type NotificationType = "ORDER_CREATED" | "YOUR_NEW_TYPE"; // Agregar aquí
```

2. Agregar el ícono en `NotificationCenter.tsx`:

```typescript
const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "YOUR_NEW_TYPE":
      return <YourIcon className="w-4 h-4" />;
    // ...
  }
};
```

3. Agregar el color:

```typescript
const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "YOUR_NEW_TYPE":
      return "bg-purple-50 dark:bg-purple-900/20 border-purple-200";
    // ...
  }
};
```

### Configurar preferencias de notificación

```typescript
import { getNotificationPreferences, saveNotificationPreferences } from "@/lib/notifications";

// Obtener preferencias actuales
const prefs = getNotificationPreferences();

// Actualizar preferencias
saveNotificationPreferences({
  email: {
    orders: true,
    promotions: false,
    newsletter: false,
    priceAlerts: true,
    stockAlerts: true,
  },
  push: {
    orders: true,
    promotions: false,
    priceAlerts: true,
  },
  inApp: {
    orders: true,
    promotions: true,
    system: true,
  },
});
```

## 📊 Eventos WebSocket

### Cliente → Servidor

- `subscribe(tenantId)` - Suscribirse a notificaciones de un tenant
- `unsubscribe(tenantId)` - Desuscribirse
- `notification:read(notificationId)` - Marcar como leída
- `notification:readAll(tenantId)` - Marcar todas como leídas

### Servidor → Cliente

- `notification(notification)` - Nueva notificación genérica
- `order:created({ orderId, total })` - Nueva orden
- `order:updated({ orderId, status })` - Orden actualizada
- `inventory:low({ productId, stock })` - Inventario bajo
- `payment:completed({ orderId, amount })` - Pago completado
- `connect_error(error)` - Error de conexión

## 🔒 Seguridad

1. **Aislamiento por tenant:** Las notificaciones solo se emiten a sockets suscritos al tenant correspondiente
2. **Validación de sesión:** Se debe validar la sesión del usuario antes de permitir suscripciones
3. **Rate limiting:** Implementar limitación de emisión de notificaciones por tenant
4. **Sanitización:** Siempre sanitizar datos antes de emitir notificaciones

## ⚡ Rendimiento

### Optimizaciones implementadas:

1. **Rooms de Socket.IO:** Uso de rooms para emitir solo a clientes relevantes
2. **Reconexión inteligente:** Backoff exponencial (1s, 2s, 4s, 8s, max 10s)
3. **Límite de notificaciones:** Máximo 50 notificaciones en memoria por cliente
4. **Persistencia:** localStorage para mantener notificaciones entre sesiones
5. **Lazy loading:** Hook solo se activa cuando autoConnect=true

### Métricas esperadas:

- Latencia de entrega: < 100ms
- Throughput: > 1000 notificaciones/segundo
- Conexiones concurrentes: > 10,000 clientes
- RAM por conexión: ~10KB

## 🧪 Testing

### Testing del servidor:

```typescript
import { initializeWebSocketServer, emitToTenant } from "@/lib/websocket/server";
import { createServer } from "http";
import { io as Client } from "socket.io-client";

describe("WebSocket Server", () => {
  let httpServer;
  let socketServer;
  let clientSocket;

  beforeAll((done) => {
    httpServer = createServer();
    socketServer = initializeWebSocketServer(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    clientSocket.close();
    httpServer.close();
  });

  it("should emit notification to subscribed tenant", (done) => {
    clientSocket.emit("subscribe", "tenant-123");
    clientSocket.on("notification", (notification) => {
      expect(notification.type).toBe("ORDER_CREATED");
      done();
    });

    emitToTenant("tenant-123", {
      id: "test-1",
      type: "ORDER_CREATED",
      title: "Test",
      message: "Test message",
      tenantId: "tenant-123",
      read: false,
      createdAt: new Date(),
    });
  });
});
```

## 🐛 Troubleshooting

### Problema: Las notificaciones no llegan

**Solución:**

1. Verificar que el servidor WebSocket esté inicializado
2. Verificar que el cliente esté conectado: `isWebSocketConnected()`
3. Verificar que el tenant ID sea correcto
4. Revisar los logs del servidor para errores

### Problema: Reconexión frecuente

**Solución:**

1. Verificar configuración de CORS
2. Verificar que el path `/api/socket` sea accesible
3. Revisar configuración de proxy/load balancer
4. Incrementar timeout de conexión

### Problema: Notificaciones duplicadas

**Solución:**

1. Verificar que no haya múltiples suscripciones al mismo tenant
2. Implementar deduplicación por ID de notificación
3. Limpiar suscripciones al desmontar componentes

## 📚 Referencias

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Next.js Custom Server](https://nextjs.org/docs/advanced-features/custom-server)
- [Web Push Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## 🔄 Roadmap

- [ ] Persistencia de notificaciones en base de datos
- [ ] Sistema de templates para notificaciones
- [ ] Notificaciones programadas (scheduled notifications)
- [ ] Integración con servicios externos (FCM, OneSignal)
- [ ] Dashboard de analytics de notificaciones
- [ ] A/B testing de mensajes
- [ ] Notificaciones por SMS/WhatsApp
- [ ] Rate limiting avanzado por tipo de notificación
- [ ] Agrupación de notificaciones similares

---

**Última actualización:** Noviembre 2025
**Autor:** Sistema de desarrollo autónomo
**Estado:** ✅ Implementado y funcional
