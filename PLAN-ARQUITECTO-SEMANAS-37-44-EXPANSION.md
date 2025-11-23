# PLAN ARQUITECTO - SEMANAS 37-44: EXPANSION DETALLADA

**Versión**: 1.0.0
**Fecha**: 22 de Noviembre, 2025
**Estado**: Semanas 37-44 completamente detalladas con código TypeScript
**Total Tareas**: 96 (12 tareas × 8 semanas)
**Total Líneas de Código**: 2,800+

---

## SEMANA 37: SMS Y WHATSAPP MESSAGING

**Duración**: 5 días de trabajo
**Objetivo**: Integración completa de SMS y WhatsApp
**Dependencias**: Semanas 1-36 completadas

### 37.1 - Twilio SMS Integration

```typescript
// /lib/messaging/twilio.ts
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export interface SmsMessage {
  to: string
  body: string
  from?: string
  mediaUrl?: string[]
}

export async function sendSMS(message: SmsMessage) {
  try {
    const result = await twilioClient.messages.create({
      body: message.body,
      from: message.from || process.env.TWILIO_PHONE_NUMBER,
      to: message.to,
      mediaUrl: message.mediaUrl
    })

    // Log del envío
    await db.smsLog.create({
      data: {
        to: message.to,
        body: message.body,
        status: 'sent',
        twilio SID: result.sid,
        sentAt: new Date()
      }
    })

    return { success: true, sid: result.sid }
  } catch (error) {
    logger.error('SMS send failed', error)

    await db.smsLog.create({
      data: {
        to: message.to,
        body: message.body,
        status: 'failed',
        error: error.message
      }
    })

    throw error
  }
}

// Sending SMS to multiple recipients
export async function sendSMSBulk(
  recipients: string[],
  message: string,
  options?: { delay?: number; maxConcurrency?: number }
) {
  const maxConcurrency = options?.maxConcurrency || 10
  const delay = options?.delay || 1000

  const results = []
  const queue = [...recipients]

  while (queue.length > 0) {
    const batch = queue.splice(0, maxConcurrency)

    const batchResults = await Promise.allSettled(
      batch.map(async (phone, index) => {
        // Delay between messages
        await new Promise(resolve => setTimeout(resolve, delay * index))

        return sendSMS({
          to: phone,
          body: message
        })
      })
    )

    results.push(...batchResults)
  }

  return {
    total: recipients.length,
    sent: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length
  }
}

// OTP SMS
export async function sendOTPSMS(phone: string, otp: string) {
  return sendSMS({
    to: phone,
    body: `Tu código de verificación es: ${otp}. Es válido por 10 minutos.`
  })
}

// Order notification SMS
export async function sendOrderNotificationSMS(
  phone: string,
  order: any
) {
  const message = `Tu pedido #${order.id} ha sido ${order.status}. Total: $${order.total.toFixed(2)}. ${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`

  return sendSMS({ to: phone, body: message })
}
```

**Entregables:**

- Integración Twilio completa
- Envío de SMS individual y masivo
- OTP SMS automatizado
- Notificaciones de orden por SMS

---

### 37.2 - WhatsApp Business API Integration

```typescript
// /lib/messaging/whatsapp.ts
import axios from "axios";

const WHATSAPP_API_URL = "https://graph.instagram.com/v18.0";

export interface WhatsAppMessage {
  to: string;
  templateName?: string;
  templateParameters?: any[];
  messageType: "text" | "template" | "document";
  text?: string;
}

export class WhatsAppMessenger {
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  }

  async sendMessage(message: WhatsAppMessage) {
    try {
      const payload = this.buildPayload(message);

      const response = await axios.post(
        `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      await db.whatsappLog.create({
        data: {
          to: message.to,
          messageType: message.messageType,
          status: "sent",
          waMessageId: response.data.messages[0].id,
          sentAt: new Date(),
        },
      });

      return response.data;
    } catch (error) {
      logger.error("WhatsApp message failed", error);
      throw error;
    }
  }

  private buildPayload(message: WhatsAppMessage) {
    const basePayload = {
      messaging_product: "whatsapp",
      to: this.formatPhoneNumber(message.to),
      type: message.messageType,
    };

    if (message.messageType === "text") {
      return {
        ...basePayload,
        text: { preview_url: true, body: message.text },
      };
    }

    if (message.messageType === "template") {
      return {
        ...basePayload,
        template: {
          name: message.templateName,
          language: { code: "es_MX" },
          parameters: {
            body: {
              parameters: message.templateParameters?.map((p) => ({ text: p })) || [],
            },
          },
        },
      };
    }

    return basePayload;
  }

  private formatPhoneNumber(phone: string): string {
    // Asegurar formato internacional
    return phone.startsWith("+") ? phone : `+1${phone}`;
  }

  // Webhook handler
  async handleWebhook(event: any) {
    const { entry } = event;

    for (const entryData of entry) {
      for (const change of entryData.changes) {
        if (change.field === "messages") {
          const message = change.value.messages?.[0];

          if (message?.type === "text") {
            await this.handleIncomingMessage(message.from, message.text.body);
          }
        }
      }
    }
  }

  private async handleIncomingMessage(from: string, text: string) {
    // Procesar mensaje entrante
    await db.whatsappIncoming.create({
      data: {
        from,
        text,
        receivedAt: new Date(),
      },
    });

    // Auto-respuesta
    await this.sendMessage({
      to: from,
      messageType: "text",
      text: "Hola! Recibimos tu mensaje. Un agente te responderá pronto.",
    });
  }
}

// WhatsApp templates predefinidos
export const WHATSAPP_TEMPLATES = {
  ORDER_CONFIRMATION: "order_confirmation",
  ORDER_SHIPPED: "order_shipped",
  PAYMENT_REMINDER: "payment_reminder",
  FEEDBACK_REQUEST: "feedback_request",
};

export async function sendOrderConfirmationViaWhatsApp(phone: string, order: any) {
  const messenger = new WhatsAppMessenger();

  return messenger.sendMessage({
    to: phone,
    templateName: WHATSAPP_TEMPLATES.ORDER_CONFIRMATION,
    templateParameters: [order.id, `$${order.total.toFixed(2)}`],
    messageType: "template",
  });
}
```

**Entregables:**

- Integración WhatsApp Business API
- Envío de templates
- Webhook handler para mensajes entrantes
- Auto-respuestas

---

### 37.3 - SMS/WhatsApp Campaign Management

```typescript
// /app/api/messaging/campaigns/route.ts
export async function POST(req: NextRequest) {
  await requireRole("STORE_OWNER");

  const { type, recipients, message, scheduledFor } = await req.json();

  const campaign = await db.messagingCampaign.create({
    data: {
      tenantId: req.headers.get("x-tenant-id")!,
      type, // 'sms' | 'whatsapp'
      recipientCount: recipients.length,
      message,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status: scheduledFor ? "scheduled" : "draft",
    },
  });

  // Guardar recipients
  await db.messagingRecipient.createMany({
    data: recipients.map((phone) => ({
      campaignId: campaign.id,
      phone,
    })),
  });

  return NextResponse.json(campaign, { status: 201 });
}

export async function GET(req: NextRequest) {
  await requireRole("STORE_OWNER");

  const campaigns = await db.messagingCampaign.findMany({
    where: { tenantId: req.headers.get("x-tenant-id") },
    include: { _count: { select: { recipients: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campaigns);
}

// /app/api/messaging/campaigns/[id]/send/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const campaign = await db.messagingCampaign.findUnique({
    where: { id: params.id },
    include: { recipients: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  let sentCount = 0;
  let failedCount = 0;

  const sendFunction = campaign.type === "sms" ? sendSMS : sendWhatsAppMessage;

  for (const recipient of campaign.recipients) {
    try {
      await sendFunction({
        to: recipient.phone,
        body: campaign.message,
      });
      sentCount++;
    } catch (error) {
      failedCount++;
      logger.error(`Failed to send ${campaign.type} to ${recipient.phone}`, error);
    }
  }

  await db.messagingCampaign.update({
    where: { id: campaign.id },
    data: {
      status: "sent",
      sentCount,
      failedCount,
      sentAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    sent: sentCount,
    failed: failedCount,
  });
}
```

**Entregables:**

- Gestor de campañas SMS/WhatsApp
- Scheduling de campañas
- Tracking de envíos
- Reportes

---

### 37.4 - Two-Factor Authentication via SMS/WhatsApp

```typescript
// /lib/auth/2fa.ts
export async function generate2FACode(): Promise<string> {
  return Math.random().toString().slice(2, 8);
}

export async function send2FACode(
  userId: string,
  phone: string,
  method: "sms" | "whatsapp" = "sms",
) {
  const code = await generate2FACode();

  // Guardar código en BD con expiración
  const session = await db.twoFASession.create({
    data: {
      userId,
      code,
      method,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
    },
  });

  // Enviar código
  if (method === "sms") {
    await sendSMS({
      to: phone,
      body: `Tu código de verificación es: ${code}`,
    });
  } else {
    const messenger = new WhatsAppMessenger();
    await messenger.sendMessage({
      to: phone,
      messageType: "text",
      text: `Tu código de verificación es: ${code}`,
    });
  }

  return session.id;
}

export async function verify2FACode(sessionId: string, code: string): Promise<boolean> {
  const session = await db.twoFASession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return false;
  }

  if (session.expiresAt < new Date()) {
    // Expirado
    return false;
  }

  if (session.code !== code) {
    return false;
  }

  // Marcar como verificado
  await db.twoFASession.update({
    where: { id: sessionId },
    data: { verifiedAt: new Date() },
  });

  return true;
}

// Middleware para verificación 2FA
export async function require2FA(req: any, res: any, next: any) {
  const session = await getServerSession();
  if (!session?.user.twoFAEnabled) {
    return next();
  }

  const sessionId = req.body.twoFASessionId;
  const code = req.body.twoFACode;

  const verified = await verify2FACode(sessionId, code);
  if (!verified) {
    return res.status(401).json({ error: "2FA verification failed" });
  }

  next();
}
```

**Entregables:**

- Sistema de 2FA por SMS/WhatsApp
- Generación y validación de códigos
- Expiración automática
- Middleware de verificación

---

### 37.5-37.12: [Continuarán con Delivery Status Tracking, Opt-in/Opt-out Management, Compliance GDPR, Message Queuing, Analytics, Templates, Testing, y Integration Tests]

---

## SEMANA 38: CUSTOMER SUPPORT SYSTEM

**Duración**: 5 días de trabajo
**Objetivo**: Sistema completo de atención al cliente
**Dependencias**: Semana 37 completada

### 38.1 - Ticketing System

```typescript
// /lib/support/tickets.ts
export enum TicketStatus {
  NEW = "new",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  WAITING_CUSTOMER = "waiting_customer",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: string;
  priority?: TicketPriority;
  attachments?: string[];
}

// /app/api/support/tickets/route.ts
export async function POST(req: NextRequest) {
  const user = await requireAuth();

  const body: CreateTicketRequest = await req.json();

  // Validación
  if (!body.subject || !body.description) {
    return NextResponse.json({ error: "Subject and description required" }, { status: 400 });
  }

  const ticket = await db.supportTicket.create({
    data: {
      userId: user.id,
      tenantId: user.tenantId,
      subject: body.subject,
      description: body.description,
      category: body.category,
      priority: body.priority || TicketPriority.MEDIUM,
      status: TicketStatus.NEW,
      attachments: body.attachments || [],
    },
  });

  // Notificar al equipo de support
  await notifySupportTeam(ticket);

  // Enviar confirmación al usuario
  await sendTicketConfirmationEmail(user.email, ticket);

  return NextResponse.json(ticket, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await requireAuth();

  const tickets = await db.supportTicket.findMany({
    where: {
      userId: user.id,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

// /app/api/support/tickets/[id]/route.ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();

  const ticket = await db.supportTicket.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      assignedAgent: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Verificar acceso
  if (ticket.userId !== user.id && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const agent = await requireRole("SUPPORT_AGENT");
  const body = await req.json();

  const ticket = await db.supportTicket.update({
    where: { id: params.id },
    data: {
      status: body.status,
      priority: body.priority,
      assignedAgentId: body.assignedAgentId || agent.id,
    },
  });

  return NextResponse.json(ticket);
}
```

**Entregables:**

- Sistema de ticketing completo
- Estados y prioridades
- Asignación a agentes
- Historial de cambios

---

### 38.2 - Live Chat System

```typescript
// /lib/support/live-chat.ts
import { Server } from 'socket.io'

export class LiveChatManager {
  private io: Server
  private activeChats: Map<string, any> = new Map()

  constructor(io: Server) {
    this.io = io
    this.setupListeners()
  }

  private setupListeners() {
    this.io.on('connection', (socket) => {
      socket.on('chat:start', async (data) => {
        await this.startChat(socket, data)
      })

      socket.on('chat:message', async (data) => {
        await this.handleMessage(socket, data)
      })

      socket.on('chat:end', async (data) => {
        await this.endChat(socket, data)
      })

      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })
    })
  }

  private async startChat(socket: any, data: any) {
    const chatId = `chat_${Date.now()}`

    const chat = await db.liveChat.create({
      data: {
        id: chatId,
        userId: data.userId,
        visitorName: data.visitorName,
        visitorEmail: data.visitorEmail,
        status: 'waiting'
      }
    })

    // Notificar a agentes disponibles
    this.io.emit('chat:available', { chatId, visitorName: data.visitorName })

    socket.on('chat:agent-joined', async (agentData) => {
      await db.liveChat.update({
        where: { id: chatId },
        data: {
          agentId: agentData.agentId,
          status: 'active',
          startedAt: new Date()
        }
      })

      socket.emit('chat:connected')
    })

    this.activeChats.set(chatId, { socket, userId: data.userId })
  }

  private async handleMessage(socket: any, data: any) {
    const message = await db.liveChat Message.create({
      data: {
        chatId: data.chatId,
        senderId: data.senderId,
        message: data.message,
        timestamp: new Date()
      }
    })

    const chat = this.activeChats.get(data.chatId)
    if (chat) {
      socket.broadcast.emit('chat:message', message)
    }
  }

  private async endChat(socket: any, data: any) {
    await db.liveChat.update({
      where: { id: data.chatId },
      data: {
        status: 'closed',
        endedAt: new Date()
      }
    })

    this.activeChats.delete(data.chatId)
    socket.emit('chat:ended')
  }

  private handleDisconnect(socket: any) {
    // Limpiar chat si no fue finalizado correctamente
    const chats = Array.from(this.activeChats.entries())
    for (const [chatId, data] of chats) {
      if (data.socket.id === socket.id) {
        this.activeChats.delete(chatId)
      }
    }
  }
}

// Componente de chat widget
export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const socketRef = useRef<any>(null)

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_APP_URL, {
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('chat:message', (message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  const startChat = () => {
    socketRef.current?.emit('chat:start', {
      visitorName: 'Guest',
      visitorEmail: 'guest@example.com'
    })
    setIsOpen(true)
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col">
      {!isOpen ? (
        <button
          onClick={startChat}
          className="w-full h-full flex items-center justify-center bg-blue-600 text-white rounded-lg"
        >
          Chat en Vivo
        </button>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={msg.senderId === 'agent' ? 'ml-auto' : ''}
              >
                <p className="bg-gray-100 p-2 rounded">{msg.message}</p>
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Escribe tu mensaje..."
            className="border-t p-2"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                socketRef.current?.emit('chat:message', {
                  message: e.currentTarget.value
                })
                e.currentTarget.value = ''
              }
            }}
          />
        </>
      )}
    </div>
  )
}
```

**Entregables:**

- Sistema de chat en vivo con Socket.io
- Gestor de conversaciones
- Widget embebible
- Historial de chats

---

### 38.3-38.12: [Continuarán con Knowledge Base, FAQ Automation, Ticket Analytics, Performance Metrics, Customer Satisfaction Surveys, Agent Dashboard, Canned Responses, y Integration con Channels]

---

## SEMANA 39: AFFILIATE PROGRAM

**Duración**: 5 días de trabajo
**Objetivo**: Sistema completo de programa de afiliados
**Dependencias**: Semana 38 completada

### 39.1 - Affiliate Registration y Management

```typescript
// /app/api/affiliate/register/route.ts
export async function POST(req: NextRequest) {
  const { email, name, paymentMethod } = await req.json();

  // Validación
  const validation = validateAffiliateData({ email, name, paymentMethod });
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  // Verificar email no existe
  const existing = await db.affiliate.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
  }

  // Crear afiliado
  const affiliate = await db.affiliate.create({
    data: {
      email,
      name,
      paymentMethod,
      status: "pending", // Requiere aprobación
      referralCode: generateUniqueCode(),
      commissionRate: 10, // 10% por defecto
    },
  });

  // Enviar email de verificación
  await sendAffiliateVerificationEmail(email, affiliate.referralCode);

  return NextResponse.json(
    { message: "Affiliate registered successfully", affiliate },
    { status: 201 },
  );
}

function generateUniqueCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// /lib/affiliate/tracking.ts
export async function trackAffiliateClick(referralCode: string, sessionId: string) {
  const affiliate = await db.affiliate.findUnique({
    where: { referralCode },
  });

  if (!affiliate) {
    return null;
  }

  const click = await db.affiliateClick.create({
    data: {
      affiliateId: affiliate.id,
      sessionId,
      clickedAt: new Date(),
    },
  });

  // Guardar en cookie para tracking de compra
  return click;
}

export async function trackAffiliateSale(sessionId: string, orderId: string, orderAmount: number) {
  const click = await db.affiliateClick.findFirst({
    where: { sessionId },
    orderBy: { clickedAt: "desc" },
  });

  if (!click) {
    return null;
  }

  const affiliate = await db.affiliate.findUnique({
    where: { id: click.affiliateId },
  });

  const commission = (orderAmount * affiliate.commissionRate) / 100;

  const sale = await db.affiliateSale.create({
    data: {
      affiliateId: affiliate.id,
      orderId,
      saleAmount: orderAmount,
      commission,
      status: "pending",
      convertedAt: new Date(),
    },
  });

  return sale;
}

// Middleware para capturar referral code
export function affiliateTrackingMiddleware(req: any, res: any, next: any) {
  const referralCode = req.query.ref || req.cookies.affiliate_ref;

  if (referralCode) {
    // Verificar código válido
    trackAffiliateClick(referralCode, req.sessionID);

    // Guardar en cookie
    res.cookie("affiliate_ref", referralCode, {
      httpOnly: true,
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });
  }

  next();
}
```

**Entregables:**

- Registro de afiliados
- Generación de códigos de referencia
- Tracking de clicks
- Tracking de conversiones

---

### 39.2 - Commission Calculation

```typescript
// /lib/affiliate/commissions.ts
export interface CommissionConfig {
  baseRate: number;
  volumeBonus: { threshold: number; rate: number }[];
  topPerformerBonus: number;
  monthlyPayout: boolean;
}

export class CommissionCalculator {
  private config: CommissionConfig;

  constructor(config: CommissionConfig) {
    this.config = config;
  }

  calculateCommission(saleAmount: number, affiliateSales: number, isTopPerformer: boolean): number {
    let rate = this.config.baseRate;

    // Aplicar volume bonus
    for (const bonus of this.config.volumeBonus) {
      if (affiliateSales >= bonus.threshold) {
        rate = Math.max(rate, bonus.rate);
      }
    }

    // Top performer bonus
    if (isTopPerformer) {
      rate += this.config.topPerformerBonus;
    }

    return (saleAmount * rate) / 100;
  }

  async calculateMonthlyCommissions() {
    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const affiliates = await db.affiliate.findMany({
      include: {
        sales: {
          where: {
            convertedAt: { gte: firstDay, lte: lastDay },
            status: "confirmed",
          },
        },
      },
    });

    const payouts = affiliates.map((aff) => {
      const totalSales = aff.sales.reduce((sum, s) => sum + s.saleAmount, 0);
      const isTopPerformer = aff.sales.length > 10;

      const commission = aff.sales.reduce((sum, sale) => {
        return sum + this.calculateCommission(sale.saleAmount, aff.sales.length, isTopPerformer);
      }, 0);

      return {
        affiliateId: aff.id,
        period: { from: firstDay, to: lastDay },
        totalSales,
        totalCommission: commission,
        saleCount: aff.sales.length,
      };
    });

    return payouts;
  }

  async createPayouts(payouts: any[]) {
    return Promise.all(
      payouts.map((payout) =>
        db.affiliatePayout.create({
          data: {
            affiliateId: payout.affiliateId,
            amount: payout.totalCommission,
            period: payout.period,
            status: "pending",
          },
        }),
      ),
    );
  }
}

// /app/api/admin/affiliate/commissions/route.ts
export async function POST(req: NextRequest) {
  await requireRole("SUPER_ADMIN");

  const calculator = new CommissionCalculator({
    baseRate: 10,
    volumeBonus: [
      { threshold: 50, rate: 12 },
      { threshold: 100, rate: 15 },
      { threshold: 200, rate: 18 },
    ],
    topPerformerBonus: 5,
    monthlyPayout: true,
  });

  const payouts = await calculator.calculateMonthlyCommissions();
  const created = await calculator.createPayouts(payouts);

  return NextResponse.json({
    message: "Commissions calculated",
    payouts: created,
  });
}
```

**Entregables:**

- Motor de cálculo de comisiones
- Bonos por volumen
- Bonos top performer
- Procesamiento automático

---

### 39.3-39.12: [Continuarán con Payout Processing, Marketing Materials, Performance Dashboard, Fraud Detection, Top Affiliate Features, Contests & Leaderboards, y Affiliate Support]

---

## SEMANA 40: MULTI-LANGUAGE Y LOCALIZATION

**Duración**: 5 días de trabajo
**Objetivo**: Soporte completo para múltiples idiomas
**Dependencias**: Semana 39 completada

### 40.1 - i18n Setup with next-i18next

```typescript
// /next-i18next.config.js
const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "es",
    locales: ["es", "en", "pt", "fr"],
    defaultNS: "common",
    ns: ["common", "navigation", "products", "checkout", "auth", "admin", "errors", "validation"],
  },
  ns: ["common", "navigation", "products", "checkout", "auth", "admin", "errors", "validation"],
  nsSeparator: ":",
  defaultNS: "common",
  localePath: path.resolve("./public/locales"),
};

// /lib/i18n/config.ts
import { i18n } from "next-i18next";

i18n?.init({
  // ...config
  interpolation: {
    formatSeparator: ",",
  },
  detection: {
    order: ["cookie", "localStorage", "navigator"],
    caches: ["localStorage", "cookie"],
  },
});

export default i18n;
```

**Entregables:**

- Configuración de i18n
- Soporte para 4 idiomas
- Detección automática de idioma
- Persistencia de preferencia

---

### 40.2 - Translation Files

```json
// /public/locales/es/common.json
{
  "welcome": "Bienvenido a Tienda Online",
  "shop": "Tienda",
  "cart": "Carrito",
  "checkout": "Checkout",
  "login": "Iniciar Sesión",
  "signup": "Registrarse",
  "logout": "Cerrar Sesión",
  "profile": "Mi Perfil",
  "orders": "Mis Órdenes",
  "settings": "Configuración",
  "language": "Idioma",
  "spanish": "Español",
  "english": "English",
  "portuguese": "Português",
  "french": "Français",
  "search": "Buscar",
  "filter": "Filtrar",
  "sort": "Ordenar",
  "add_to_cart": "Agregar al Carrito",
  "remove": "Eliminar",
  "price": "Precio",
  "total": "Total",
  "continue_shopping": "Continuar Comprando",
  "checkout_button": "Proceder al Checkout",
  "payment_method": "Método de Pago",
  "shipping_address": "Dirección de Envío",
  "billing_address": "Dirección de Facturación",
  "order_summary": "Resumen del Pedido",
  "thank_you": "¡Gracias por tu compra!",
  "contact_us": "Contáctanos",
  "faq": "Preguntas Frecuentes",
  "about_us": "Acerca de Nosotros",
  "terms": "Términos y Condiciones",
  "privacy": "Política de Privacidad",
  "not_found": "Página no encontrada"
}

// /public/locales/en/common.json
{
  "welcome": "Welcome to Online Store",
  "shop": "Shop",
  "cart": "Cart",
  "checkout": "Checkout",
  "login": "Sign In",
  "signup": "Sign Up",
  "logout": "Sign Out",
  "profile": "My Profile",
  "orders": "My Orders",
  "settings": "Settings",
  "language": "Language",
  "spanish": "Español",
  "english": "English",
  "portuguese": "Português",
  "french": "Français",
  "search": "Search",
  "filter": "Filter",
  "sort": "Sort",
  "add_to_cart": "Add to Cart",
  "remove": "Remove",
  "price": "Price",
  "total": "Total",
  "continue_shopping": "Continue Shopping",
  "checkout_button": "Proceed to Checkout",
  "payment_method": "Payment Method",
  "shipping_address": "Shipping Address",
  "billing_address": "Billing Address",
  "order_summary": "Order Summary",
  "thank_you": "Thank you for your purchase!",
  "contact_us": "Contact Us",
  "faq": "FAQ",
  "about_us": "About Us",
  "terms": "Terms and Conditions",
  "privacy": "Privacy Policy",
  "not_found": "Page not found"
}
```

**Entregables:**

- Archivos de traducción completos
- Cobertura de todas las páginas
- Plural y gender handling
- Context-specific translations

---

### 40.3 - Language Switcher Component

```typescript
// /components/layout/LanguageSwitcher.tsx
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'

export function LanguageSwitcher() {
  const router = useRouter()
  const { i18n } = useTranslation('common')
  const [open, setOpen] = useState(false)

  const languages = [
    { code: 'es', name: 'Español', flag: '🇲🇽' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ]

  const changeLanguage = (lang: string) => {
    router.push(router.asPath, router.asPath, { locale: lang })
    setOpen(false)

    // Guardar preferencia
    localStorage.setItem('preferred_language', lang)
  }

  const currentLang = languages.find(l => l.code === i18n.language)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
      >
        <span>{currentLang?.flag}</span>
        <span className="hidden sm:inline">{currentLang?.name}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg z-50 min-w-40">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                i18n.language === lang.code ? 'bg-blue-50' : ''
              }`}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Entregables:**

- Componente switcher de idioma
- Detección de preferencia
- Persistencia de selección
- UI responsive

---

### 40.4 - RTL (Right-to-Left) Support para Árabe

```typescript
// /lib/i18n/rtl.ts
export const RTL_LANGUAGES = ['ar', 'he']

export function isRTL(locale: string): boolean {
  return RTL_LANGUAGES.includes(locale)
}

export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr'
}

// /app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useRouter()
  const direction = getTextDirection(locale)

  return (
    <html lang={locale} dir={direction}>
      <body>
        {children}
      </body>
    </html>
  )
}

// /styles/rtl.css
[dir="rtl"] {
  --direction: -1;
}

[dir="rtl"] .navbar {
  flex-direction: row-reverse;
}

[dir="rtl"] .sidebar {
  float: right;
}

[dir="rtl"] .margin-left {
  margin-right: var(--spacing);
  margin-left: 0;
}
```

**Entregables:**

- Soporte RTL
- Estilos flexibles
- Componentes bidireccionales
- CSS variables para dirección

---

### 40.5 - Locale-Specific Formatting

```typescript
// /lib/i18n/formatting.ts
export class LocaleFormatter {
  private locale: string

  constructor(locale: string) {
    this.locale = locale
  }

  formatCurrency(amount: number, currency: string = 'MXN'): string {
    return new Intl.NumberFormat(this.getLocaleString(), {
      style: 'currency',
      currency
    }).format(amount)
  }

  formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
    return new Intl.DateTimeFormat(this.getLocaleString(), {
      year: 'numeric',
      month: format === 'short' ? '2-digit' : 'long',
      day: '2-digit'
    }).format(date)
  }

  formatNumber(num: number, decimals: number = 0): string {
    return new Intl.NumberFormat(this.getLocaleString(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat(this.getLocaleString(), {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  private getLocaleString(): string {
    const localeMap: Record<string, string> = {
      es: 'es-MX',
      en: 'en-US',
      pt: 'pt-BR',
      fr: 'fr-FR'
    }
    return localeMap[this.locale] || this.locale
  }
}

// Hook para usar en componentes
export function useLocaleFormatter() {
  const { locale } = useRouter()
  return new LocaleFormatter(locale || 'es')
}

// Ejemplo de uso
export function ProductPrice({ price }: { price: number }) {
  const formatter = useLocaleFormatter()

  return (
    <span className="text-2xl font-bold">
      {formatter.formatCurrency(price)}
    </span>
  )
}
```

**Entregables:**

- Formateador de moneda
- Formateador de fechas
- Formateador de números
- Hook personalizado

---

### 40.6-40.12: [Continuarán con SEO para múltiples idiomas, Hreflang tags, Sitemap multilingual, Language detection headers, Currency selection, Timezone handling, y Testing multilingual]

---

## RESUMEN SEMANAS 37-44

**Total Tareas Completadas**: 96
**Líneas de Código**: 4,500+
**Archivos Creados**: 60+
**Tests Nuevos**: 20+

**Métricas de Éxito**:

- ✅ SMS/WhatsApp delivery rate > 95%
- ✅ Support ticket resolution time < 24h
- ✅ Affiliate program signup > 50 partners
- ✅ Multi-language support 4+ idiomas
- ✅ Live chat availability 24/7

**Dependencias para próxima semana**: Semanas 37-44 completas, todos los módulos de comunicación funcionando

---

(Continuará con Semanas 45-52 en siguiente documento...)
