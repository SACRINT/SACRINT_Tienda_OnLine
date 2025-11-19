// Shipping Service Layer
// Types, calculations, and API integration for shipping

export interface ShippingRate {
  id: string
  carrier: string
  service: string
  price: number
  estimatedDays: string
  deliveryDate?: string
  icon: "standard" | "express" | "same-day"
}

export interface ShippingZone {
  id: string
  name: string
  states: string[]
  baseRate: number
  perKgRate: number
  freeShippingThreshold: number
}

export interface PackageInfo {
  weight: number // in kg
  length: number // in cm
  width: number // in cm
  height: number // in cm
}

export interface ShippingRequest {
  postalCode: string
  state?: string
  subtotal: number
  package?: PackageInfo
}

// Shipping zones for Mexico
const shippingZones: ShippingZone[] = [
  {
    id: "zona-metro",
    name: "Zona Metropolitana",
    states: ["Ciudad de México", "Estado de México"],
    baseRate: 79,
    perKgRate: 10,
    freeShippingThreshold: 799,
  },
  {
    id: "zona-centro",
    name: "Zona Centro",
    states: [
      "Aguascalientes",
      "Guanajuato",
      "Hidalgo",
      "Morelos",
      "Puebla",
      "Querétaro",
      "Tlaxcala",
    ],
    baseRate: 99,
    perKgRate: 15,
    freeShippingThreshold: 999,
  },
  {
    id: "zona-norte",
    name: "Zona Norte",
    states: [
      "Baja California",
      "Baja California Sur",
      "Chihuahua",
      "Coahuila",
      "Durango",
      "Nuevo León",
      "San Luis Potosí",
      "Sinaloa",
      "Sonora",
      "Tamaulipas",
      "Zacatecas",
    ],
    baseRate: 149,
    perKgRate: 20,
    freeShippingThreshold: 1299,
  },
  {
    id: "zona-sur",
    name: "Zona Sur",
    states: [
      "Campeche",
      "Chiapas",
      "Colima",
      "Guerrero",
      "Jalisco",
      "Michoacán",
      "Nayarit",
      "Oaxaca",
      "Quintana Roo",
      "Tabasco",
      "Veracruz",
      "Yucatán",
    ],
    baseRate: 149,
    perKgRate: 20,
    freeShippingThreshold: 1299,
  },
]

// Carrier configurations
const carriers = {
  estafeta: {
    name: "Estafeta",
    standardDays: "3-5 días hábiles",
    expressDays: "1-2 días hábiles",
    expressMultiplier: 1.8,
  },
  fedex: {
    name: "FedEx",
    standardDays: "2-4 días hábiles",
    expressDays: "1-2 días hábiles",
    expressMultiplier: 2.0,
  },
  dhl: {
    name: "DHL",
    standardDays: "2-4 días hábiles",
    expressDays: "1 día hábil",
    expressMultiplier: 2.2,
  },
  minutos99: {
    name: "99 Minutos",
    sameDayPrice: 299,
    availableZones: ["zona-metro"],
    cutoffHour: 14,
  },
}

// Get shipping zone by postal code or state
export function getShippingZone(postalCode: string, state?: string): ShippingZone {
  // Postal code ranges (simplified)
  const postalPrefix = postalCode.substring(0, 2)

  // CDMX and EdoMex postal codes
  if (["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"].includes(postalPrefix)) {
    return shippingZones[0] // Zona Metro
  }

  // If state is provided, use it
  if (state) {
    const zone = shippingZones.find((z) => z.states.includes(state))
    if (zone) return zone
  }

  // Default to Centro zone
  return shippingZones[1]
}

// Calculate volumetric weight
export function calculateVolumetricWeight(pkg: PackageInfo): number {
  // DIM factor for domestic shipping in Mexico
  const dimFactor = 5000
  return (pkg.length * pkg.width * pkg.height) / dimFactor
}

// Get billable weight
export function getBillableWeight(pkg: PackageInfo): number {
  const volumetricWeight = calculateVolumetricWeight(pkg)
  return Math.max(pkg.weight, volumetricWeight)
}

// Calculate shipping rates
export function calculateShippingRates(request: ShippingRequest): ShippingRate[] {
  const zone = getShippingZone(request.postalCode)
  const rates: ShippingRate[] = []

  // Calculate base weight charge
  let weightCharge = 0
  if (request.package) {
    const billableWeight = getBillableWeight(request.package)
    weightCharge = Math.max(0, (billableWeight - 1) * zone.perKgRate)
  }

  // Check free shipping eligibility
  const qualifiesForFree = request.subtotal >= zone.freeShippingThreshold

  // Standard shipping (Estafeta)
  const standardPrice = qualifiesForFree ? 0 : zone.baseRate + weightCharge
  rates.push({
    id: "standard",
    carrier: carriers.estafeta.name,
    service: "Envío Estándar",
    price: standardPrice,
    estimatedDays: carriers.estafeta.standardDays,
    icon: "standard",
  })

  // Express shipping (FedEx)
  const expressPrice = Math.round((zone.baseRate + weightCharge) * carriers.fedex.expressMultiplier)
  rates.push({
    id: "express",
    carrier: carriers.fedex.name,
    service: "Envío Express",
    price: expressPrice,
    estimatedDays: carriers.fedex.expressDays,
    icon: "express",
  })

  // Same-day shipping (99 Minutos) - only for metro zone
  if (zone.id === "zona-metro") {
    const now = new Date()
    const cutoffHour = carriers.minutos99.cutoffHour
    const isAvailable = now.getHours() < cutoffHour

    if (isAvailable) {
      rates.push({
        id: "same-day",
        carrier: carriers.minutos99.name,
        service: "Mismo Día",
        price: carriers.minutos99.sameDayPrice,
        estimatedDays: "Hoy antes de 6pm",
        icon: "same-day",
      })
    }
  }

  return rates
}

// Validate postal code format
export function validatePostalCode(postalCode: string): boolean {
  return /^\d{5}$/.test(postalCode)
}

// Get estimated delivery date
export function getEstimatedDeliveryDate(days: string): Date {
  const now = new Date()
  const match = days.match(/(\d+)/)
  const minDays = match ? parseInt(match[1]) : 3

  // Add business days (skip weekends)
  let businessDays = 0
  const deliveryDate = new Date(now)

  while (businessDays < minDays) {
    deliveryDate.setDate(deliveryDate.getDate() + 1)
    const dayOfWeek = deliveryDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++
    }
  }

  return deliveryDate
}

// Format delivery date
export function formatDeliveryDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
}

// Generate tracking number
export function generateTrackingNumber(carrier: string): string {
  const prefix = {
    Estafeta: "EST",
    FedEx: "FDX",
    DHL: "DHL",
    "99 Minutos": "99M",
  }[carrier] || "TRK"

  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()

  return `${prefix}${timestamp}${random}`
}

// Export types for components
export type { ShippingZone, PackageInfo, ShippingRequest }
