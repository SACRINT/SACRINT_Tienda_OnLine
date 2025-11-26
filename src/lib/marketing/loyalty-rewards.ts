/**
 * Loyalty Program & Rewards
 * Semana 37, Tarea 37.8: Loyalty Program & Rewards
 */

import { logger } from '@/lib/monitoring'

export type RewardType = 'points' | 'discount' | 'freeship' | 'exclusive' | 'cashback'
export type TierLevel = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface LoyaltyTier {
  level: TierLevel
  pointsRequired: number
  pointsMultiplier: number
  benefits: string[]
  discountPercent: number
}

export interface LoyaltyTransaction {
  id: string
  customerId: string
  type: 'earn' | 'redeem'
  points: number
  description: string
  expiresAt?: Date
  timestamp: Date
}

export interface CustomerLoyaltyAccount {
  customerId: string
  currentPoints: number
  currentTier: TierLevel
  totalPointsEarned: number
  totalPointsRedeemed: number
  joinDate: Date
  lastActivityDate: Date
  transactions: LoyaltyTransaction[]
}

export class LoyaltyProgramManager {
  private accounts: Map<string, CustomerLoyaltyAccount> = new Map()
  private tiers: Map<TierLevel, LoyaltyTier> = new Map()
  private rewards: Map<string, { type: RewardType; pointsCost: number; benefit: string }> = new Map()

  constructor() {
    this.initializeTiers()
    this.initializeRewards()
    logger.debug({ type: 'loyalty_program_init' }, 'Loyalty Program Manager inicializado')
  }

  private initializeTiers(): void {
    const tiers: LoyaltyTier[] = [
      {
        level: 'bronze',
        pointsRequired: 0,
        pointsMultiplier: 1,
        benefits: ['1 point per dollar', 'Birthday reward'],
        discountPercent: 0,
      },
      {
        level: 'silver',
        pointsRequired: 500,
        pointsMultiplier: 1.25,
        benefits: ['1.25 points per dollar', '5% discount', 'Free shipping'],
        discountPercent: 5,
      },
      {
        level: 'gold',
        pointsRequired: 1500,
        pointsMultiplier: 1.5,
        benefits: ['1.5 points per dollar', '10% discount', 'Free priority shipping'],
        discountPercent: 10,
      },
      {
        level: 'platinum',
        pointsRequired: 3000,
        pointsMultiplier: 2,
        benefits: ['2 points per dollar', '15% discount', 'VIP support', 'Exclusive access'],
        discountPercent: 15,
      },
    ]

    tiers.forEach((tier) => this.tiers.set(tier.level, tier))
  }

  private initializeRewards(): void {
    this.rewards.set('discount_10', { type: 'discount', pointsCost: 500, benefit: '$10 off' })
    this.rewards.set('discount_25', { type: 'discount', pointsCost: 1000, benefit: '$25 off' })
    this.rewards.set('freeship', { type: 'freeship', pointsCost: 250, benefit: 'Free shipping' })
    this.rewards.set('exclusive_product', { type: 'exclusive', pointsCost: 2000, benefit: 'Exclusive product' })
    this.rewards.set('cashback_5', { type: 'cashback', pointsCost: 300, benefit: '$5 cashback' })
  }

  /**
   * Crear cuenta de lealtad
   */
  enrollCustomer(customerId: string): CustomerLoyaltyAccount {
    if (this.accounts.has(customerId)) {
      return this.accounts.get(customerId)!
    }

    const account: CustomerLoyaltyAccount = {
      customerId,
      currentPoints: 0,
      currentTier: 'bronze',
      totalPointsEarned: 0,
      totalPointsRedeemed: 0,
      joinDate: new Date(),
      lastActivityDate: new Date(),
      transactions: [],
    }

    this.accounts.set(customerId, account)
    logger.info({ type: 'loyalty_enrolled', customerId }, 'Cliente inscrito en programa de lealtad')

    return account
  }

  /**
   * Agregar puntos
   */
  addPoints(customerId: string, points: number, description: string): boolean {
    let account = this.accounts.get(customerId)
    if (!account) {
      account = this.enrollCustomer(customerId)
    }

    // Aplicar multiplicador según tier
    const tier = this.tiers.get(account.currentTier)!
    const adjustedPoints = Math.floor(points * tier.pointsMultiplier)

    account.currentPoints += adjustedPoints
    account.totalPointsEarned += adjustedPoints
    account.lastActivityDate = new Date()

    const transaction: LoyaltyTransaction = {
      id: `txn_${Date.now()}_${Math.random()}`,
      customerId,
      type: 'earn',
      points: adjustedPoints,
      description,
      timestamp: new Date(),
    }

    account.transactions.push(transaction)

    // Actualizar tier
    this.updateTier(customerId)

    logger.debug(
      { type: 'points_added', customerId, points: adjustedPoints },
      `${adjustedPoints} puntos añadidos`,
    )

    return true
  }

  /**
   * Canjear puntos
   */
  redeemReward(customerId: string, rewardId: string): boolean {
    const account = this.accounts.get(customerId)
    if (!account) return false

    const reward = this.rewards.get(rewardId)
    if (!reward) return false

    if (account.currentPoints < reward.pointsCost) {
      logger.warn(
        { type: 'insufficient_points', customerId, required: reward.pointsCost, available: account.currentPoints },
        'Puntos insuficientes',
      )
      return false
    }

    account.currentPoints -= reward.pointsCost
    account.totalPointsRedeemed += reward.pointsCost
    account.lastActivityDate = new Date()

    const transaction: LoyaltyTransaction = {
      id: `txn_${Date.now()}_${Math.random()}`,
      customerId,
      type: 'redeem',
      points: reward.pointsCost,
      description: `Canjeo: ${reward.benefit}`,
      timestamp: new Date(),
    }

    account.transactions.push(transaction)

    logger.info(
      { type: 'reward_redeemed', customerId, reward: rewardId, benefit: reward.benefit },
      `Recompensa canjeada: ${reward.benefit}`,
    )

    return true
  }

  /**
   * Actualizar tier
   */
  private updateTier(customerId: string): void {
    const account = this.accounts.get(customerId)
    if (!account) return

    let newTier: TierLevel = 'bronze'

    if (account.totalPointsEarned >= 3000) newTier = 'platinum'
    else if (account.totalPointsEarned >= 1500) newTier = 'gold'
    else if (account.totalPointsEarned >= 500) newTier = 'silver'

    if (newTier !== account.currentTier) {
      const oldTier = account.currentTier
      account.currentTier = newTier

      logger.info(
        { type: 'tier_upgraded', customerId, from: oldTier, to: newTier },
        `Cliente ascendido a tier ${newTier}`,
      )
    }
  }

  /**
   * Obtener cuenta del cliente
   */
  getAccount(customerId: string): CustomerLoyaltyAccount | null {
    return this.accounts.get(customerId) || null
  }

  /**
   * Obtener recompensas disponibles
   */
  getAvailableRewards(customerId: string): Array<{
    id: string
    benefit: string
    pointsCost: number
    available: boolean
  }> {
    const account = this.accounts.get(customerId)
    if (!account) return []

    return Array.from(this.rewards.entries()).map(([id, reward]) => ({
      id,
      benefit: reward.benefit,
      pointsCost: reward.pointsCost,
      available: account.currentPoints >= reward.pointsCost,
    }))
  }

  /**
   * Obtener historial
   */
  getTransactionHistory(customerId: string, limit: number = 50): LoyaltyTransaction[] {
    const account = this.accounts.get(customerId)
    if (!account) return []

    return account.transactions.slice(-limit)
  }

  /**
   * Estadísticas del programa
   */
  getProgramStats(): {
    totalMembers: number
    totalPointsIssued: number
    averagePointsPerMember: number
    tierDistribution: Record<TierLevel, number>
  } {
    let totalPointsIssued = 0
    const tierDistribution = { bronze: 0, silver: 0, gold: 0, platinum: 0 }

    for (const account of this.accounts.values()) {
      totalPointsIssued += account.totalPointsEarned
      tierDistribution[account.currentTier]++
    }

    const avgPoints = this.accounts.size > 0 ? totalPointsIssued / this.accounts.size : 0

    return {
      totalMembers: this.accounts.size,
      totalPointsIssued,
      averagePointsPerMember: Math.round(avgPoints),
      tierDistribution,
    }
  }
}

let globalLoyaltyManager: LoyaltyProgramManager | null = null

export function initializeLoyaltyProgram(): LoyaltyProgramManager {
  if (!globalLoyaltyManager) {
    globalLoyaltyManager = new LoyaltyProgramManager()
  }
  return globalLoyaltyManager
}

export function getLoyaltyProgram(): LoyaltyProgramManager {
  if (!globalLoyaltyManager) {
    return initializeLoyaltyProgram()
  }
  return globalLoyaltyManager
}
