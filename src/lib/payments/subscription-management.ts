/**
 * Subscription Management & Recurring Billing
 * Semana 34, Tarea 34.4: Gestión de suscripciones y facturación recurrente
 */

import { logger } from '@/lib/monitoring'

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'failed' | 'expired'
export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  frequency: BillingFrequency
  trialDays: number
  features: string[]
  maxUsers?: number
  maxStorage?: number // GB
  isActive: boolean
}

export interface Subscription {
  id: string
  customerId: string
  tenantId: string
  planId: string
  status: SubscriptionStatus
  startDate: Date
  endDate?: Date
  nextBillingDate: Date
  cancellationReason?: string
  cancellationDate?: Date
  metadata: Record<string, any>
}

export interface BillingCycle {
  subscriptionId: string
  cycleNumber: number
  startDate: Date
  endDate: Date
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  invoiceId?: string
  transactionId?: string
  failureReason?: string
  retryCount: number
}

export class SubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map()
  private plans: Map<string, SubscriptionPlan> = new Map()
  private billingCycles: Map<string, BillingCycle[]> = new Map()

  constructor() {
    logger.debug({ type: 'subscription_manager_init' }, 'Subscription Manager inicializado')
  }

  createPlan(plan: SubscriptionPlan): void {
    this.plans.set(plan.id, plan)
    logger.info({ type: 'plan_created', planId: plan.id }, `Plan de suscripción creado: ${plan.name}`)
  }

  createSubscription(
    customerId: string,
    tenantId: string,
    planId: string,
    metadata?: Record<string, any>,
  ): Subscription {
    const plan = this.plans.get(planId)
    if (!plan) throw new Error(`Plan ${planId} no encontrado`)

    const now = new Date()
    const trialEnd = new Date(now)
    trialEnd.setDate(trialEnd.getDate() + plan.trialDays)

    const nextBillingDate = new Date(trialEnd)

    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random()}`,
      customerId,
      tenantId,
      planId,
      status: 'active',
      startDate: now,
      nextBillingDate,
      metadata: metadata || {},
    }

    this.subscriptions.set(subscription.id, subscription)

    // Crear primer ciclo de facturación
    const billingCycle: BillingCycle = {
      subscriptionId: subscription.id,
      cycleNumber: 1,
      startDate: now,
      endDate: nextBillingDate,
      amount: plan.price,
      currency: plan.currency,
      status: plan.trialDays > 0 ? 'pending' : 'pending',
      retryCount: 0,
    }

    const cycles = this.billingCycles.get(subscription.id) || []
    cycles.push(billingCycle)
    this.billingCycles.set(subscription.id, cycles)

    logger.info({ type: 'subscription_created', subscriptionId: subscription.id, planId }, 'Suscripción creada')

    return subscription
  }

  pauseSubscription(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) throw new Error('Suscripción no encontrada')

    subscription.status = 'paused'
    logger.info({ type: 'subscription_paused', subscriptionId }, 'Suscripción pausada')
  }

  resumeSubscription(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) throw new Error('Suscripción no encontrada')

    subscription.status = 'active'
    logger.info({ type: 'subscription_resumed', subscriptionId }, 'Suscripción reanudada')
  }

  cancelSubscription(subscriptionId: string, reason?: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) throw new Error('Suscripción no encontrada')

    subscription.status = 'cancelled'
    subscription.cancellationReason = reason
    subscription.cancellationDate = new Date()

    logger.info({ type: 'subscription_cancelled', subscriptionId, reason }, 'Suscripción cancelada')
  }

  upgradePlan(subscriptionId: string, newPlanId: string): Subscription | null {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return null

    const oldPlan = this.plans.get(subscription.planId)
    const newPlan = this.plans.get(newPlanId)

    if (!newPlan) return null

    // Prorata calculation
    const daysRemaining = this.getDaysUntilNextBilling(subscriptionId)
    const creditAmount = (oldPlan!.price / 30) * daysRemaining
    const upgradeAmount = newPlan.price - creditAmount

    subscription.planId = newPlanId
    logger.info(
      { type: 'plan_upgraded', subscriptionId, newPlanId, prorata: upgradeAmount },
      `Plan actualizado a ${newPlan.name}`,
    )

    return subscription
  }

  processBillingCycle(subscriptionId: string): BillingCycle | null {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return null

    const plan = this.plans.get(subscription.planId)
    if (!plan) return null

    const cycles = this.billingCycles.get(subscriptionId) || []
    const lastCycle = cycles[cycles.length - 1]

    const newCycle: BillingCycle = {
      subscriptionId,
      cycleNumber: cycles.length + 1,
      startDate: lastCycle.endDate,
      endDate: this.calculateNextBillingDate(lastCycle.endDate, plan.frequency),
      amount: plan.price,
      currency: plan.currency,
      status: 'pending',
      retryCount: 0,
    }

    cycles.push(newCycle)
    this.billingCycles.set(subscriptionId, cycles)

    subscription.nextBillingDate = newCycle.endDate

    logger.info({ type: 'billing_cycle_created', subscriptionId, cycleNumber: newCycle.cycleNumber }, 'Ciclo de facturación creado')

    return newCycle
  }

  private calculateNextBillingDate(currentDate: Date, frequency: BillingFrequency): Date {
    const next = new Date(currentDate)

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
      case 'quarterly':
        next.setMonth(next.getMonth() + 3)
        break
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1)
        break
    }

    return next
  }

  private getDaysUntilNextBilling(subscriptionId: string): number {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return 0

    const now = new Date()
    const diff = subscription.nextBillingDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  getSubscription(subscriptionId: string): Subscription | null {
    return this.subscriptions.get(subscriptionId) || null
  }

  getBillingHistory(subscriptionId: string): BillingCycle[] {
    return this.billingCycles.get(subscriptionId) || []
  }

  getCustomerSubscriptions(customerId: string): Subscription[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.customerId === customerId)
  }

  getActiveSubscriptions(tenantId: string): Subscription[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.tenantId === tenantId && s.status === 'active')
  }

  getSubscriptionMetrics(tenantId: string): {
    activeSubscriptions: number
    pausedSubscriptions: number
    churnRate: number
    mrr: number
  } {
    const subscriptions = Array.from(this.subscriptions.values()).filter((s) => s.tenantId === tenantId)

    const active = subscriptions.filter((s) => s.status === 'active').length
    const paused = subscriptions.filter((s) => s.status === 'paused').length
    const cancelled = subscriptions.filter((s) => s.status === 'cancelled').length
    const total = subscriptions.length

    const churnRate = total > 0 ? (cancelled / total) * 100 : 0

    const mrr = subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const plan = this.plans.get(s.planId)
        return sum + (plan ? plan.price : 0)
      }, 0)

    return { activeSubscriptions: active, pausedSubscriptions: paused, churnRate, mrr }
  }
}

let globalSubscriptionManager: SubscriptionManager | null = null

export function initializeSubscriptionManager(): SubscriptionManager {
  if (!globalSubscriptionManager) {
    globalSubscriptionManager = new SubscriptionManager()
  }
  return globalSubscriptionManager
}

export function getSubscriptionManager(): SubscriptionManager {
  if (!globalSubscriptionManager) {
    return initializeSubscriptionManager()
  }
  return globalSubscriptionManager
}
