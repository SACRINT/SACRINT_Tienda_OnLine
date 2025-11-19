# Checkout API Integration Guide

**Date**: November 17, 2025
**Version**: 1.0.0
**Status**: Week 5-6 Backend Complete

---

## Overview

This guide documents the complete checkout API system with tax calculation, shipping calculation, coupon validation, and order processing.

## API Endpoints

### 1. Tax Calculation

**Endpoint**: `POST /api/checkout/calculate-tax`

**Purpose**: Calculate sales tax based on shipping address location

**Request Body**:
```typescript
{
  tenantId: string // UUID
  shippingAddress: {
    city: string
    state: string // 2-letter US state code (CA, NY, TX, etc.)
    postalCode: string
    country: string
  }
  subtotal: number // Cart subtotal before tax/shipping
  items: Array<{
    productId: string
    quantity: number
    price: number
    isTaxable?: boolean // Optional, defaults to true
  }>
}
```

**Response** (200 OK):
```typescript
{
  taxRate: number // Effective tax rate (state + local)
  taxAmount: number // Total tax amount
  breakdown: {
    stateTax: number
    stateTaxRate: number
    localTax: number
    localTaxRate: number
    totalTax: number
  }
  taxableAmount: number
  nonTaxableAmount: number
  location: {
    city: string
    state: string
    postalCode: string
  }
}
```

**Features**:
- ✅ Supports all 50 US states + DC
- ✅ Includes local tax rates for major cities (LA, SF, NYC, Chicago, etc.)
- ✅ Handles tax-exempt items
- ✅ Returns detailed breakdown
- ✅ Tenant isolation enforced

**Example Usage**:
```typescript
const taxResponse = await fetch('/api/checkout/calculate-tax', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    shippingAddress: {
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'United States'
    },
    subtotal: 249.99,
    items: [
      { productId: 'prod-1', quantity: 1, price: 249.99, isTaxable: true }
    ]
  })
})

// Response:
// { taxRate: 0.085, taxAmount: 21.25, breakdown: {...} }
// CA state tax (7.25%) + SF local tax (1.25%) = 8.5%
```

---

### 2. Shipping Calculation

**Endpoint**: `POST /api/checkout/calculate-shipping`

**Purpose**: Calculate shipping costs based on weight, dimensions, and destination zone

**Request Body**:
```typescript
{
  tenantId: string // UUID
  shippingAddress: {
    city: string
    state: string // 2-letter US state code
    postalCode: string
    country: string
  }
  items: Array<{
    productId: string
    quantity: number
    weight?: number // Pounds (default: 1)
    dimensions?: { // Inches
      length: number
      width: number
      height: number
    }
  }>
  shippingMethod?: 'standard' | 'express' | 'overnight' // Default: 'standard'
}
```

**Response** (200 OK):
```typescript
{
  shippingCost: number // Final shipping cost
  breakdown: {
    baseRate: number
    methodMultiplier: number
    handlingFee: number
    subtotal: number
    total: number
  }
  weight: {
    actualWeight: number
    dimensionalWeight: number
    billingWeight: number // Greater of actual or dimensional
  }
  shippingZone: number // 1-6
  shippingMethod: string
  estimatedDelivery: string
  isFreeShipping: boolean
  freeShippingThreshold: number
  location: {
    city: string
    state: string
    postalCode: string
  }
  availableMethods: Array<{
    method: string
    cost: number
    estimatedDelivery: string
    isFree: boolean
  }>
}
```

**Features**:
- ✅ Zone-based pricing (6 zones covering all US states)
- ✅ Weight-based tiering (1, 3, 5, 10, 20, 30, 50+ lbs)
- ✅ Dimensional weight calculation
- ✅ Multiple shipping methods (standard, express, overnight)
- ✅ Free shipping for orders $100+ with standard shipping
- ✅ $2 handling fee for orders under $50
- ✅ Returns all available shipping options
- ✅ Tenant isolation enforced

**Shipping Zones**:
- **Zone 1**: West Coast (CA, OR, WA, NV)
- **Zone 2**: Mountain (AZ, CO, ID, MT, NM, UT, WY)
- **Zone 3**: Midwest (IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI)
- **Zone 4**: South (AL, AR, FL, GA, KY, LA, MS, NC, OK, SC, TN, TX, VA, WV)
- **Zone 5**: Northeast (CT, DE, ME, MD, MA, NH, NJ, NY, PA, RI, VT, DC)
- **Zone 6**: Premium (AK, HI)

**Example Usage**:
```typescript
const shippingResponse = await fetch('/api/checkout/calculate-shipping', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    shippingAddress: {
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'United States'
    },
    items: [
      {
        productId: 'prod-1',
        quantity: 1,
        weight: 2,
        dimensions: { length: 10, width: 8, height: 4 }
      }
    ],
    shippingMethod: 'express'
  })
})

// Response:
// { shippingCost: 14.38, shippingMethod: 'express', estimatedDelivery: '2-3 business days' }
```

---

### 3. Coupon Validation

**Endpoint**: `POST /api/coupons/validate`

**Purpose**: Validate coupon code and calculate discount amount

**Request Body**:
```typescript
{
  tenantId: string // UUID
  code: string // Coupon code (automatically converted to uppercase)
  cartTotal: number // Cart subtotal before discount
  userId?: string // Optional, for user-specific usage limits
  items: Array<{
    productId: string
    categoryId?: string
    quantity: number
    price: number
  }>
}
```

**Response** (200 OK):
```typescript
{
  isValid: true
  coupon: {
    id: string
    code: string
    type: 'PERCENTAGE' | 'FIXED'
    value: number
    description: string
  }
  discount: {
    amount: number // Actual discount amount
    percentage: number // Effective discount percentage
  }
  totals: {
    subtotal: number
    discount: number
    total: number
  }
  metadata: {
    expiresAt: Date | null
    remainingUses: number | null
    minPurchase: number | null
  }
}
```

**Error Responses** (400 Bad Request):
```typescript
// Invalid code
{ isValid: false, error: 'INVALID_CODE', message: 'Invalid coupon code' }

// Expired
{ isValid: false, error: 'EXPIRED', message: 'This coupon has expired', expiresAt: Date }

// Max uses reached
{ isValid: false, error: 'MAX_USES_REACHED', message: 'This coupon has reached its usage limit' }

// Minimum purchase not met
{
  isValid: false,
  error: 'MIN_PURCHASE_NOT_MET',
  message: 'Minimum purchase of $50.00 required',
  required: 50.00,
  current: 35.00,
  remaining: 15.00
}

// User limit reached
{ isValid: false, error: 'USER_LIMIT_REACHED', message: 'You have already used this coupon...' }

// Category/product mismatch
{ isValid: false, error: 'CATEGORY_MISMATCH', message: 'This coupon is not applicable...' }
```

**Features**:
- ✅ Validates coupon existence and activity status
- ✅ Checks expiration date
- ✅ Enforces usage limits (global and per-user)
- ✅ Validates minimum purchase requirements
- ✅ Supports category/product restrictions
- ✅ Handles percentage and fixed-amount discounts
- ✅ Applies max discount caps for percentage coupons
- ✅ Prevents discount from exceeding cart total
- ✅ Tenant isolation enforced
- ✅ Works for guest checkout (userId optional)

**Example Usage**:
```typescript
const couponResponse = await fetch('/api/coupons/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-uuid',
    code: 'SAVE10',
    cartTotal: 249.99,
    items: [
      { productId: 'prod-1', quantity: 1, price: 249.99 }
    ]
  })
})

// Success response:
// {
//   isValid: true,
//   discount: { amount: 25.00, percentage: 10 },
//   totals: { subtotal: 249.99, discount: 25.00, total: 224.99 }
// }
```

---

### 4. Complete Checkout Flow

**Endpoint**: `POST /api/checkout`

**Purpose**: Process complete checkout with payment

**Request Body**:
```typescript
{
  cartId: string // UUID
  shippingAddressId: string // UUID
  billingAddressId: string // UUID
  paymentMethod: 'STRIPE' | 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'
  couponCode?: string // Optional
  notes?: string // Optional order notes
}
```

**Response** (200 OK):
```typescript
// For Stripe/Credit Card payments:
{
  success: true
  orderId: string
  orderNumber: string
  reservationId: string
  clientSecret: string // For Stripe Elements
  paymentIntentId: string
  amount: number
  message: 'Order created, inventory reserved. Complete payment on frontend.'
}

// For other payment methods:
{
  success: true
  orderId: string
  orderNumber: string
  total: number
  message: 'Order created and inventory confirmed successfully'
}
```

**Features**:
- ✅ Validates cart before processing
- ✅ Reserves inventory (prevents overselling)
- ✅ Creates Stripe Payment Intent for card payments
- ✅ Immediately confirms inventory for non-Stripe methods
- ✅ Applies coupon codes automatically
- ✅ Calculates totals (shipping + tax)
- ✅ Rollback mechanism on failure
- ✅ Tenant isolation enforced
- ✅ Returns client secret for frontend payment completion

---

## Complete Checkout Integration Example

Here's how to integrate all APIs in a checkout flow:

```typescript
// Step 1: Calculate shipping options
const shippingResponse = await fetch('/api/checkout/calculate-shipping', {
  method: 'POST',
  body: JSON.stringify({
    tenantId,
    shippingAddress: userSelectedAddress,
    items: cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      weight: item.weight,
      dimensions: item.dimensions
    })),
    shippingMethod: 'standard'
  })
})

const { shippingCost, availableMethods } = await shippingResponse.json()

// Step 2: Validate coupon (if entered)
if (couponCode) {
  const couponResponse = await fetch('/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({
      tenantId,
      code: couponCode,
      cartTotal: subtotal,
      userId: currentUser.id,
      items: cartItems.map(item => ({
        productId: item.productId,
        categoryId: item.categoryId,
        quantity: item.quantity,
        price: item.price
      }))
    })
  })

  const couponResult = await couponResponse.json()

  if (!couponResult.isValid) {
    // Show error: couponResult.message
  } else {
    discount = couponResult.discount.amount
  }
}

// Step 3: Calculate tax
const taxResponse = await fetch('/api/checkout/calculate-tax', {
  method: 'POST',
  body: JSON.stringify({
    tenantId,
    shippingAddress: userSelectedAddress,
    subtotal: subtotal - discount,
    items: cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      isTaxable: item.isTaxable
    }))
  })
})

const { taxAmount } = await taxResponse.json()

// Step 4: Show order summary
const finalTotal = subtotal + shippingCost + taxAmount - discount

// Step 5: Process checkout
const checkoutResponse = await fetch('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({
    cartId: currentCart.id,
    shippingAddressId: selectedAddress.id,
    billingAddressId: selectedBillingAddress.id,
    paymentMethod: 'STRIPE',
    couponCode: validatedCouponCode,
    notes: orderNotes
  })
})

const checkoutResult = await checkoutResponse.json()

// Step 6: Complete payment with Stripe
if (checkoutResult.clientSecret) {
  const { error, paymentIntent } = await stripe.confirmCardPayment(
    checkoutResult.clientSecret,
    { payment_method: paymentMethodId }
  )

  if (error) {
    // Handle payment error
  } else {
    // Payment successful - redirect to order confirmation
    router.push(`/order/success?orderId=${checkoutResult.orderId}`)
  }
}
```

---

## Data Flow

```
┌─────────────┐
│ Cart Page   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ 1. GET shipping options     │──► POST /api/checkout/calculate-shipping
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 2. Validate coupon (opt.)   │──► POST /api/coupons/validate
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 3. Calculate tax            │──► POST /api/checkout/calculate-tax
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 4. Show order summary       │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 5. Process checkout         │──► POST /api/checkout
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 6. Payment confirmation     │──► Stripe Elements
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 7. Order success page       │
└─────────────────────────────┘
```

---

## Security Features

All checkout APIs enforce:

✅ **Authentication**: User must be logged in (via NextAuth session)
✅ **Tenant Isolation**: All queries filtered by `tenantId`
✅ **Input Validation**: Zod schemas on all endpoints
✅ **Rate Limiting**: (Ready for implementation)
✅ **Inventory Protection**: Stock reservation system prevents overselling
✅ **Rollback Mechanisms**: Failed checkouts clean up automatically
✅ **SQL Injection Prevention**: Prisma prepared statements

---

## Error Handling

All APIs return consistent error formats:

```typescript
// Validation errors (400)
{
  error: 'Invalid request data',
  details: [...zodErrors]
}

// Authentication errors (401)
{
  error: 'Unauthorized'
}

// Authorization errors (403)
{
  error: 'Forbidden'
}

// Business logic errors (400/409)
{
  error: 'Insufficient stock',
  message: 'Product "Headphones" only has 5 units available'
}

// Server errors (500)
{
  error: 'Failed to calculate tax'
}
```

---

## Testing Checklist

Week 5-6 Backend Implementation:

- [x] Tax calculation API created
- [x] Shipping calculation API created
- [x] Coupon validation API created
- [x] Checkout API verified (stock validation, inventory reservation)
- [x] All APIs enforce tenant isolation
- [x] All APIs have Zod validation
- [x] Error handling implemented
- [x] Integration guide documented

---

## Next Steps

**Week 7-8**: Mobile Optimization (40h)
- Responsive checkout flow
- Touch-optimized payment forms
- Mobile-friendly shipping/tax displays
- Progressive Web App features

**Week 9-10**: Analytics & Reports
- Order analytics dashboard
- Sales reports
- Coupon usage tracking
- Tax/shipping reports

---

**Last Updated**: November 17, 2025
**Author**: Claude (AI Assistant)
**Status**: ✅ Week 5-6 Backend Complete
