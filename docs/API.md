# API Reference

## Overview

The SACRINT Tienda Online API is built with Next.js 14 API routes and follows RESTful principles with JSON responses.

## Base URL

```
Production: https://sacrint.com/api
Development: http://localhost:3000/api
```

## Authentication

All protected endpoints require authentication via NextAuth.js session cookies.

### Headers

```
Content-Type: application/json
X-CSRF-Token: <csrf-token>
```

---

## Endpoints

### Products

#### List Products

```
GET /api/products
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `tenantId` | string | Required. Filter by store |
| `category` | string | Filter by category slug |
| `search` | string | Search in name/description |
| `minPrice` | number | Minimum price filter |
| `maxPrice` | number | Maximum price filter |
| `sort` | string | Sort: `price_asc`, `price_desc`, `newest`, `popular` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 12) |

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Producto Ejemplo",
      "slug": "producto-ejemplo",
      "description": "Descripción...",
      "price": 299.99,
      "compareAtPrice": 399.99,
      "stock": 50,
      "images": ["/image1.jpg"],
      "category": {
        "id": "uuid",
        "name": "Categoría",
        "slug": "categoria"
      },
      "variants": [],
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "totalPages": 9
  }
}
```

#### Get Product

```
GET /api/products/:id
```

**Response:** Single product object

#### Create Product (Admin)

```
POST /api/products
```

**Body:**
```json
{
  "name": "Nuevo Producto",
  "description": "Descripción detallada",
  "price": 299.99,
  "compareAtPrice": 399.99,
  "stock": 100,
  "categoryId": "uuid",
  "images": ["/image.jpg"],
  "variants": []
}
```

#### Update Product (Admin)

```
PUT /api/products/:id
```

#### Delete Product (Admin)

```
DELETE /api/products/:id
```

---

### Shipping

#### Calculate Rates

```
POST /api/shipping/rates
```

**Body:**
```json
{
  "postalCode": "06600",
  "state": "Ciudad de México",
  "items": [
    {
      "id": "product-id",
      "quantity": 2,
      "weight": 0.5
    }
  ]
}
```

**Response:**
```json
{
  "rates": [
    {
      "id": "standard",
      "name": "Estándar",
      "price": 99,
      "estimatedDays": "3-5 días",
      "carrier": "Estafeta"
    },
    {
      "id": "express",
      "name": "Express",
      "price": 199,
      "estimatedDays": "1-2 días",
      "carrier": "FedEx"
    }
  ],
  "zone": "metro"
}
```

---

### Payments

#### Create Payment

```
POST /api/payments/create
```

**Body:**
```json
{
  "orderId": "uuid",
  "amount": 599.98,
  "method": "card",
  "paymentDetails": {
    "cardNumber": "4242424242424242",
    "expMonth": 12,
    "expYear": 2025,
    "cvc": "123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "pay_xxx",
  "status": "completed",
  "receiptUrl": "https://..."
}
```

---

### Coupons

#### Validate Coupon

```
POST /api/coupons/validate
```

**Body:**
```json
{
  "code": "DESCUENTO10",
  "cartTotal": 500
}
```

**Response:**
```json
{
  "valid": true,
  "coupon": {
    "code": "DESCUENTO10",
    "type": "percentage",
    "value": 10
  },
  "discount": 50,
  "message": "Cupón aplicado: 10% de descuento"
}
```

---

### Orders

#### List Orders

```
GET /api/orders
```

#### Get Order

```
GET /api/orders/:id
```

#### Create Order (Checkout)

```
POST /api/checkout
```

**Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "variantId": "uuid"
    }
  ],
  "shippingAddress": {
    "street": "Calle 123",
    "colony": "Colonia",
    "city": "Ciudad",
    "state": "Estado",
    "postalCode": "12345",
    "phone": "5512345678"
  },
  "shippingMethod": "standard",
  "paymentMethod": "card",
  "couponCode": "DESCUENTO10"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human readable message",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - No permission |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 1 minute |
| Authentication | 5 attempts | 15 minutes |
| Checkout | 10 attempts | 1 hour |
| Search | 30 requests | 1 minute |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
Retry-After: 60
```

---

## Webhooks

### Stripe Webhooks

```
POST /api/webhooks/stripe
```

Events handled:
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

---

## SDK Usage

### JavaScript/TypeScript

```typescript
import { api } from '@/lib/api'

// Get products
const products = await api.products.list({
  category: 'electronics',
  page: 1
})

// Validate coupon
const result = await api.coupons.validate('DESCUENTO10', 500)

// Create order
const order = await api.checkout.create({
  items: cartItems,
  shippingAddress: address,
  paymentMethod: 'card'
})
```
