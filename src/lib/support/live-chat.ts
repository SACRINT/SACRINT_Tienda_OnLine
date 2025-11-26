/**
 * Live Chat System
 * Semana 41, Tarea 41.4: Live Chat System
 */

import { logger } from '@/lib/monitoring'

export interface ChatSession {
  id: string
  customerId: string
  agentId?: string
  status: 'waiting' | 'active' | 'ended'
  messages: ChatMessage[]
  createdAt: Date
  endedAt?: Date
}

export interface ChatMessage {
  id: string
  sessionId: string
  senderId: string
  senderType: 'customer' | 'agent'
  message: string
  timestamp: Date
  isRead: boolean
}

export interface ChatAgent {
  id: string
  name: string
  status: 'online' | 'busy' | 'offline'
  activeSessions: number
  maxSessions: number
  languages: string[]
}

export class LiveChatManager {
  private sessions: Map<string, ChatSession> = new Map()
  private agents: Map<string, ChatAgent> = new Map()
  private messages: ChatMessage[] = []
  private waitingQueue: string[] = []

  constructor() {
    logger.debug({ type: 'live_chat_init' }, 'Live Chat Manager inicializado')
  }

  /**
   * Registrar agente
   */
  registerAgent(id: string, name: string, maxSessions: number, languages: string[]): ChatAgent {
    const agent: ChatAgent = {
      id,
      name,
      status: 'online',
      activeSessions: 0,
      maxSessions,
      languages,
    }

    this.agents.set(id, agent)
    logger.debug({ type: 'agent_registered', agentId: id, name }, `Agente registrado: ${name}`)

    return agent
  }

  /**
   * Iniciar sesión de chat
   */
  startSession(customerId: string): ChatSession {
    const session: ChatSession = {
      id: `chat_${Date.now()}`,
      customerId,
      status: 'waiting',
      messages: [],
      createdAt: new Date(),
    }

    this.sessions.set(session.id, session)
    this.waitingQueue.push(session.id)

    // Intentar asignar agente
    this.assignAgent(session.id)

    logger.info({ type: 'chat_session_started', sessionId: session.id, customerId }, `Sesión de chat iniciada`)

    return session
  }

  /**
   * Asignar agente
   */
  private assignAgent(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    // Encontrar agente disponible
    for (const agent of this.agents.values()) {
      if (agent.status !== 'offline' && agent.activeSessions < agent.maxSessions) {
        session.agentId = agent.id
        session.status = 'active'
        agent.activeSessions++
        this.waitingQueue = this.waitingQueue.filter((s) => s !== sessionId)

        logger.debug({ type: 'agent_assigned', sessionId, agentId: agent.id }, `Agente asignado`)
        return
      }
    }
  }

  /**
   * Enviar mensaje
   */
  sendMessage(sessionId: string, senderId: string, senderType: 'customer' | 'agent', message: string): ChatMessage | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sessionId,
      senderId,
      senderType,
      message,
      timestamp: new Date(),
      isRead: false,
    }

    session.messages.push(chatMessage)
    this.messages.push(chatMessage)

    logger.debug({ type: 'message_sent', sessionId, senderType }, `Mensaje enviado en chat`)

    return chatMessage
  }

  /**
   * Marcar como leído
   */
  markAsRead(messageId: string): boolean {
    const message = this.messages.find((m) => m.id === messageId)
    if (!message) return false

    message.isRead = true
    return true
  }

  /**
   * Cerrar sesión
   */
  endSession(sessionId: string): ChatSession | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    session.status = 'ended'
    session.endedAt = new Date()

    // Liberar agente
    if (session.agentId) {
      const agent = this.agents.get(session.agentId)
      if (agent) {
        agent.activeSessions = Math.max(0, agent.activeSessions - 1)
      }
    }

    logger.info({ type: 'chat_session_ended', sessionId }, `Sesión de chat cerrada`)

    return session
  }

  /**
   * Obtener sesión
   */
  getSession(sessionId: string): ChatSession | null {
    return this.sessions.get(sessionId) || null
  }

  /**
   * Obtener mensajes
   */
  getMessages(sessionId: string): ChatMessage[] {
    const session = this.getSession(sessionId)
    return session ? session.messages : []
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { activeSessions: number; waitingCustomers: number; totalAgents: number; onlineAgents: number } {
    return {
      activeSessions: Array.from(this.sessions.values()).filter((s) => s.status === 'active').length,
      waitingCustomers: this.waitingQueue.length,
      totalAgents: this.agents.size,
      onlineAgents: Array.from(this.agents.values()).filter((a) => a.status !== 'offline').length,
    }
  }
}

let globalLiveChatManager: LiveChatManager | null = null

export function initializeLiveChatManager(): LiveChatManager {
  if (!globalLiveChatManager) {
    globalLiveChatManager = new LiveChatManager()
  }
  return globalLiveChatManager
}

export function getLiveChatManager(): LiveChatManager {
  if (!globalLiveChatManager) {
    return initializeLiveChatManager()
  }
  return globalLiveChatManager
}
