// Shipping Calculation API
// POST /api/checkout/calculate-shipping - Calculate shipping costs based on weight and zone

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { z } from 'zod'

// Shipping calculation schema
const ShippingCalculationSchema = z.object({
  tenantId: z.string().uuid(),
  shippingAddress: z.object({
    city: z.string().min(1),
    state: z.string().min(2).max(2),
    postalCode: z.string().min(5),
    country: z.string().min(1),
  }),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        weight: z.number().positive().optional().default(1), // Weight in pounds
        dimensions: z
          .object({
            length: z.number().positive(), // Inches
            width: z.number().positive(),
            height: z.number().positive(),
          })
          .optional(),
      })
    )
    .min(1),
  shippingMethod: z.enum(['standard', 'express', 'overnight']).optional().default('standard'),
})

// US Shipping Zones (based on state)
// Zone 1: West Coast
// Zone 2: Mountain
// Zone 3: Midwest
// Zone 4: South
// Zone 5: Northeast
const STATE_SHIPPING_ZONES: Record<string, number> = {
  // Zone 1 - West Coast
  CA: 1,
  OR: 1,
  WA: 1,
  NV: 1,
  // Zone 2 - Mountain
  AZ: 2,
  CO: 2,
  ID: 2,
  MT: 2,
  NM: 2,
  UT: 2,
  WY: 2,
  // Zone 3 - Midwest
  IL: 3,
  IN: 3,
  IA: 3,
  KS: 3,
  MI: 3,
  MN: 3,
  MO: 3,
  NE: 3,
  ND: 3,
  OH: 3,
  SD: 3,
  WI: 3,
  // Zone 4 - South
  AL: 4,
  AR: 4,
  FL: 4,
  GA: 4,
  KY: 4,
  LA: 4,
  MS: 4,
  NC: 4,
  OK: 4,
  SC: 4,
  TN: 4,
  TX: 4,
  VA: 4,
  WV: 4,
  // Zone 5 - Northeast
  CT: 5,
  DE: 5,
  ME: 5,
  MD: 5,
  MA: 5,
  NH: 5,
  NJ: 5,
  NY: 5,
  PA: 5,
  RI: 5,
  VT: 5,
  DC: 5,
  // Special zones
  AK: 6, // Alaska - Premium
  HI: 6, // Hawaii - Premium
}

// Base shipping rates by weight tier and zone
// [weight in lbs, zone1, zone2, zone3, zone4, zone5, zone6]
const WEIGHT_BASED_RATES = [
  { maxWeight: 1, zones: [5.99, 6.99, 7.99, 8.99, 9.99, 14.99] },
  { maxWeight: 3, zones: [7.99, 8.99, 9.99, 10.99, 11.99, 19.99] },
  { maxWeight: 5, zones: [9.99, 10.99, 11.99, 12.99, 13.99, 24.99] },
  { maxWeight: 10, zones: [12.99, 13.99, 14.99, 15.99, 16.99, 34.99] },
  { maxWeight: 20, zones: [17.99, 19.99, 21.99, 23.99, 25.99, 49.99] },
  { maxWeight: 30, zones: [22.99, 25.99, 28.99, 31.99, 34.99, 64.99] },
  { maxWeight: 50, zones: [32.99, 36.99, 40.99, 44.99, 48.99, 89.99] },
  { maxWeight: Infinity, zones: [49.99, 54.99, 59.99, 64.99, 69.99, 124.99] }, // 50+ lbs
]

// Shipping method multipliers
const SHIPPING_METHOD_MULTIPLIERS = {
  standard: 1.0, // 5-7 business days
  express: 1.8, // 2-3 business days
  overnight: 3.5, // 1 business day
}

// Delivery estimates
const DELIVERY_ESTIMATES = {
  standard: '5-7 business days',
  express: '2-3 business days',
  overnight: '1 business day',
}

// Dimensional weight divisor (industry standard)
const DIM_WEIGHT_DIVISOR = 139 // For domestic shipping

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = ShippingCalculationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { tenantId, shippingAddress, items, shippingMethod } = validation.data

    // Verify tenant access
    if (session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only calculate for US addresses (in production, use carrier APIs for international)
    if (
      shippingAddress.country.toUpperCase() !== 'UNITED STATES' &&
      shippingAddress.country.toUpperCase() !== 'USA' &&
      shippingAddress.country.toUpperCase() !== 'US'
    ) {
      return NextResponse.json(
        {
          error: 'International shipping not supported',
          message: 'Please contact support for international shipping quotes',
        },
        { status: 400 }
      )
    }

    // Get shipping zone
    const stateCode = shippingAddress.state.toUpperCase()
    const shippingZone = STATE_SHIPPING_ZONES[stateCode] || 3 // Default to zone 3 if unknown

    // Calculate total actual weight
    const actualWeight = items.reduce((sum, item) => {
      return sum + (item.weight || 1) * item.quantity
    }, 0)

    // Calculate dimensional weight for each item
    let dimensionalWeight = 0
    items.forEach((item) => {
      if (item.dimensions) {
        const { length, width, height } = item.dimensions
        const dimWeight = (length * width * height) / DIM_WEIGHT_DIVISOR
        dimensionalWeight += dimWeight * item.quantity
      }
    })

    // Use the greater of actual weight or dimensional weight
    const billingWeight = Math.max(actualWeight, dimensionalWeight)

    // Find appropriate rate tier
    const rateTier = WEIGHT_BASED_RATES.find((tier) => billingWeight <= tier.maxWeight)
    if (!rateTier) {
      return NextResponse.json(
        {
          error: 'Package too heavy',
          message: 'Please contact support for freight shipping quotes',
        },
        { status: 400 }
      )
    }

    // Get base rate for zone
    const baseRate = rateTier.zones[shippingZone - 1]

    // Apply shipping method multiplier
    const methodMultiplier = SHIPPING_METHOD_MULTIPLIERS[shippingMethod]
    const shippingCost = baseRate * methodMultiplier

    // Calculate handling fee (flat $2 for orders under $50)
    const subtotal = items.reduce((sum, item) => sum + item.quantity, 0) * 25 // Rough estimate
    const handlingFee = subtotal < 50 ? 2.0 : 0

    // Free shipping for orders over $100 with standard shipping
    const isFreeShipping = subtotal >= 100 && shippingMethod === 'standard'
    const finalCost = isFreeShipping ? 0 : shippingCost + handlingFee

    // Return shipping calculation
    return NextResponse.json(
      {
        shippingCost: parseFloat(finalCost.toFixed(2)),
        breakdown: {
          baseRate: parseFloat(baseRate.toFixed(2)),
          methodMultiplier: methodMultiplier,
          handlingFee: parseFloat(handlingFee.toFixed(2)),
          subtotal: parseFloat(shippingCost.toFixed(2)),
          total: parseFloat(finalCost.toFixed(2)),
        },
        weight: {
          actualWeight: parseFloat(actualWeight.toFixed(2)),
          dimensionalWeight: parseFloat(dimensionalWeight.toFixed(2)),
          billingWeight: parseFloat(billingWeight.toFixed(2)),
        },
        shippingZone: shippingZone,
        shippingMethod: shippingMethod,
        estimatedDelivery: DELIVERY_ESTIMATES[shippingMethod],
        isFreeShipping: isFreeShipping,
        freeShippingThreshold: 100,
        location: {
          city: shippingAddress.city,
          state: stateCode,
          postalCode: shippingAddress.postalCode,
        },
        availableMethods: [
          {
            method: 'standard',
            cost: isFreeShipping ? 0 : parseFloat((baseRate * SHIPPING_METHOD_MULTIPLIERS.standard + handlingFee).toFixed(2)),
            estimatedDelivery: DELIVERY_ESTIMATES.standard,
            isFree: isFreeShipping,
          },
          {
            method: 'express',
            cost: parseFloat((baseRate * SHIPPING_METHOD_MULTIPLIERS.express + handlingFee).toFixed(2)),
            estimatedDelivery: DELIVERY_ESTIMATES.express,
            isFree: false,
          },
          {
            method: 'overnight',
            cost: parseFloat((baseRate * SHIPPING_METHOD_MULTIPLIERS.overnight + handlingFee).toFixed(2)),
            estimatedDelivery: DELIVERY_ESTIMATES.overnight,
            isFree: false,
          },
        ],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    )
  }
}
