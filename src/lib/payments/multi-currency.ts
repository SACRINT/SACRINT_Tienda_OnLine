/**
 * Multi-Currency Support & Exchange Rates
 * Semana 34, Tarea 34.1: Soporte multi-moneda y tasas de cambio
 */

import { logger } from '@/lib/monitoring'

export type CurrencyCode = 'USD' | 'EUR' | 'MXN' | 'ARS' | 'COP' | 'CLP' | 'PEN' | 'BRL'

export interface ExchangeRate {
  from: CurrencyCode
  to: CurrencyCode
  rate: number
  timestamp: Date
  source: 'api' | 'cached' | 'manual'
  reliability: number // 0-100
}

export interface CurrencyConfig {
  code: CurrencyCode
  name: string
  symbol: string
  decimalPlaces: number
  minAmount: number
  maxAmount: number
  isActive: boolean
}

export interface PriceConversion {
  originalAmount: number
  originalCurrency: CurrencyCode
  convertedAmount: number
  targetCurrency: CurrencyCode
  exchangeRate: number
  conversionFee: number
  finalAmount: number
  timestamp: Date
}

export class MultiCurrencyManager {
  private exchangeRates: Map<string, ExchangeRate[]> = new Map()
  private currencies: Map<CurrencyCode, CurrencyConfig> = new Map()
  private conversionHistory: PriceConversion[] = []

  constructor() {
    this.initializeCurrencies()
    logger.debug({ type: 'multi_currency_init' }, 'Multi-Currency Manager inicializado')
  }

  private initializeCurrencies(): void {
    const currencies: CurrencyConfig[] = [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, minAmount: 0.01, maxAmount: 999999, isActive: true },
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, minAmount: 0.01, maxAmount: 999999, isActive: true },
      { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimalPlaces: 2, minAmount: 1, maxAmount: 999999, isActive: true },
      { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimalPlaces: 2, minAmount: 1, maxAmount: 999999, isActive: true },
      { code: 'COP', name: 'Colombian Peso', symbol: '$', decimalPlaces: 2, minAmount: 1, maxAmount: 999999, isActive: true },
      { code: 'CLP', name: 'Chilean Peso', symbol: '$', decimalPlaces: 0, minAmount: 1, maxAmount: 999999, isActive: true },
      { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', decimalPlaces: 2, minAmount: 0.01, maxAmount: 999999, isActive: true },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, minAmount: 0.01, maxAmount: 999999, isActive: true },
    ]

    currencies.forEach((currency) => {
      this.currencies.set(currency.code, currency)
    })
  }

  recordExchangeRate(rate: ExchangeRate): void {
    const key = `${rate.from}-${rate.to}`
    const rates = this.exchangeRates.get(key) || []

    // Mantener últimas 100 tasas
    if (rates.length >= 100) {
      rates.shift()
    }

    rates.push(rate)
    this.exchangeRates.set(key, rates)
  }

  getExchangeRate(from: CurrencyCode, to: CurrencyCode): ExchangeRate | null {
    const key = `${from}-${to}`
    const rates = this.exchangeRates.get(key)

    if (!rates || rates.length === 0) return null

    // Retornar la tasa más reciente
    return rates[rates.length - 1]
  }

  convertCurrency(
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode,
    conversionFeePercent: number = 2,
  ): PriceConversion | null {
    if (from === to) {
      return {
        originalAmount: amount,
        originalCurrency: from,
        convertedAmount: amount,
        targetCurrency: to,
        exchangeRate: 1,
        conversionFee: 0,
        finalAmount: amount,
        timestamp: new Date(),
      }
    }

    const rate = this.getExchangeRate(from, to)
    if (!rate) return null

    const convertedAmount = amount * rate.rate
    const conversionFee = convertedAmount * (conversionFeePercent / 100)
    const finalAmount = convertedAmount + conversionFee

    const conversion: PriceConversion = {
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      targetCurrency: to,
      exchangeRate: rate.rate,
      conversionFee: Math.round(conversionFee * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      timestamp: new Date(),
    }

    this.conversionHistory.push(conversion)

    return conversion
  }

  formatPrice(amount: number, currency: CurrencyCode): string {
    const config = this.currencies.get(currency)
    if (!config) return `${amount}`

    const formatted = amount.toFixed(config.decimalPlaces)
    return `${config.symbol}${formatted}`
  }

  getConversionHistory(limit: number = 50): PriceConversion[] {
    return this.conversionHistory.slice(-limit)
  }

  getAverageExchangeRate(from: CurrencyCode, to: CurrencyCode, days: number = 7): number | null {
    const key = `${from}-${to}`
    const rates = this.exchangeRates.get(key)

    if (!rates || rates.length === 0) return null

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const recentRates = rates.filter((r) => r.timestamp >= cutoffDate)

    if (recentRates.length === 0) return null

    const sum = recentRates.reduce((acc, r) => acc + r.rate, 0)
    return sum / recentRates.length
  }

  getCurrencyList(): CurrencyConfig[] {
    return Array.from(this.currencies.values()).filter((c) => c.isActive)
  }

  validateAmount(amount: number, currency: CurrencyCode): boolean {
    const config = this.currencies.get(currency)
    if (!config) return false

    return amount >= config.minAmount && amount <= config.maxAmount
  }
}

let globalMultiCurrencyManager: MultiCurrencyManager | null = null

export function initializeMultiCurrency(): MultiCurrencyManager {
  if (!globalMultiCurrencyManager) {
    globalMultiCurrencyManager = new MultiCurrencyManager()
  }
  return globalMultiCurrencyManager
}

export function getMultiCurrency(): MultiCurrencyManager {
  if (!globalMultiCurrencyManager) {
    return initializeMultiCurrency()
  }
  return globalMultiCurrencyManager
}
