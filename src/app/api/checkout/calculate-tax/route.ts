// Tax Calculation API
// POST /api/checkout/calculate-tax - Calculate sales tax based on shipping address

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { z } from 'zod'

// Tax calculation schema
const TaxCalculationSchema = z.object({
  tenantId: z.string().uuid(),
  shippingAddress: z.object({
    city: z.string().min(1),
    state: z.string().min(2).max(2), // US state code (CA, NY, TX, etc.)
    postalCode: z.string().min(5),
    country: z.string().min(1),
  }),
  subtotal: z.number().positive(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
        isTaxable: z.boolean().optional().default(true),
      })
    )
    .min(1),
})

// US State Tax Rates (2025)
// In production, this would come from a database or tax service API
const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04, // Alabama - 4%
  AK: 0.0, // Alaska - No state sales tax
  AZ: 0.056, // Arizona - 5.6%
  AR: 0.065, // Arkansas - 6.5%
  CA: 0.0725, // California - 7.25%
  CO: 0.029, // Colorado - 2.9%
  CT: 0.0635, // Connecticut - 6.35%
  DE: 0.0, // Delaware - No sales tax
  FL: 0.06, // Florida - 6%
  GA: 0.04, // Georgia - 4%
  HI: 0.04, // Hawaii - 4%
  ID: 0.06, // Idaho - 6%
  IL: 0.0625, // Illinois - 6.25%
  IN: 0.07, // Indiana - 7%
  IA: 0.06, // Iowa - 6%
  KS: 0.065, // Kansas - 6.5%
  KY: 0.06, // Kentucky - 6%
  LA: 0.0445, // Louisiana - 4.45%
  ME: 0.055, // Maine - 5.5%
  MD: 0.06, // Maryland - 6%
  MA: 0.0625, // Massachusetts - 6.25%
  MI: 0.06, // Michigan - 6%
  MN: 0.06875, // Minnesota - 6.875%
  MS: 0.07, // Mississippi - 7%
  MO: 0.04225, // Missouri - 4.225%
  MT: 0.0, // Montana - No sales tax
  NE: 0.055, // Nebraska - 5.5%
  NV: 0.0685, // Nevada - 6.85%
  NH: 0.0, // New Hampshire - No sales tax
  NJ: 0.06625, // New Jersey - 6.625%
  NM: 0.05125, // New Mexico - 5.125%
  NY: 0.04, // New York - 4%
  NC: 0.0475, // North Carolina - 4.75%
  ND: 0.05, // North Dakota - 5%
  OH: 0.0575, // Ohio - 5.75%
  OK: 0.045, // Oklahoma - 4.5%
  OR: 0.0, // Oregon - No sales tax
  PA: 0.06, // Pennsylvania - 6%
  RI: 0.07, // Rhode Island - 7%
  SC: 0.06, // South Carolina - 6%
  SD: 0.045, // South Dakota - 4.5%
  TN: 0.07, // Tennessee - 7%
  TX: 0.0625, // Texas - 6.25%
  UT: 0.0595, // Utah - 5.95%
  VT: 0.06, // Vermont - 6%
  VA: 0.053, // Virginia - 5.3%
  WA: 0.065, // Washington - 6.5%
  WV: 0.06, // West Virginia - 6%
  WI: 0.05, // Wisconsin - 5%
  WY: 0.04, // Wyoming - 4%
  DC: 0.06, // District of Columbia - 6%
}

// Local tax rates for major cities (additional to state tax)
// In production, use a comprehensive tax API like Avalara or TaxJar
const LOCAL_TAX_RATES: Record<string, Record<string, number>> = {
  CA: {
    'Los Angeles': 0.0125,
    'San Francisco': 0.0125,
    'San Diego': 0.01,
    'San Jose': 0.0125,
  },
  NY: {
    'New York': 0.045, // NYC has 4.5% local tax
    'Buffalo': 0.0475,
  },
  TX: {
    Houston: 0.02,
    Dallas: 0.02,
    Austin: 0.02,
    'San Antonio': 0.02,
  },
  IL: {
    Chicago: 0.0125,
  },
  WA: {
    Seattle: 0.035,
  },
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = TaxCalculationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { tenantId, shippingAddress, subtotal, items } = validation.data

    // Verify tenant access
    if (session.user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only calculate tax for US addresses
    if (shippingAddress.country.toUpperCase() !== 'UNITED STATES' && shippingAddress.country.toUpperCase() !== 'USA' && shippingAddress.country.toUpperCase() !== 'US') {
      return NextResponse.json(
        {
          taxRate: 0,
          taxAmount: 0,
          breakdown: {
            stateTax: 0,
            localTax: 0,
            totalTax: 0,
          },
          message: 'Tax calculation only available for US addresses',
        },
        { status: 200 }
      )
    }

    // Get state tax rate
    const stateCode = shippingAddress.state.toUpperCase()
    const stateTaxRate = STATE_TAX_RATES[stateCode] || 0

    if (stateTaxRate === 0) {
      // State has no sales tax
      return NextResponse.json(
        {
          taxRate: 0,
          taxAmount: 0,
          breakdown: {
            stateTax: 0,
            stateTaxRate: 0,
            localTax: 0,
            localTaxRate: 0,
            totalTax: 0,
          },
          message: `${stateCode} has no state sales tax`,
        },
        { status: 200 }
      )
    }

    // Get local tax rate if available
    let localTaxRate = 0
    const cityTaxRates = LOCAL_TAX_RATES[stateCode]
    if (cityTaxRates) {
      localTaxRate = cityTaxRates[shippingAddress.city] || 0
    }

    // Calculate taxable amount (some items may be tax-exempt)
    const taxableAmount = items.reduce((sum, item) => {
      if (item.isTaxable) {
        return sum + item.price * item.quantity
      }
      return sum
    }, 0)

    // Calculate tax amounts
    const stateTaxAmount = taxableAmount * stateTaxRate
    const localTaxAmount = taxableAmount * localTaxRate
    const totalTaxAmount = stateTaxAmount + localTaxAmount
    const effectiveTaxRate = stateTaxRate + localTaxRate

    // Return tax calculation
    return NextResponse.json(
      {
        taxRate: effectiveTaxRate,
        taxAmount: parseFloat(totalTaxAmount.toFixed(2)),
        breakdown: {
          stateTax: parseFloat(stateTaxAmount.toFixed(2)),
          stateTaxRate: stateTaxRate,
          localTax: parseFloat(localTaxAmount.toFixed(2)),
          localTaxRate: localTaxRate,
          totalTax: parseFloat(totalTaxAmount.toFixed(2)),
        },
        taxableAmount: parseFloat(taxableAmount.toFixed(2)),
        nonTaxableAmount: parseFloat((subtotal - taxableAmount).toFixed(2)),
        location: {
          city: shippingAddress.city,
          state: stateCode,
          postalCode: shippingAddress.postalCode,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Tax calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    )
  }
}
