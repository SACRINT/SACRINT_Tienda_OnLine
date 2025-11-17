# API Documentation

## Base URL

```
Production: https://your-domain.com/api
Staging: https://staging.your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

All protected endpoints require authentication via NextAuth.js session.

### Session Cookie

```
Cookie: next-auth.session-token=<token>
```

### Response Codes

```
200 - Success
201 - Created
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 - Internal Server Error
```

---

## Authentication Endpoints

### POST /api/auth/signin/google

Initiate Google OAuth sign-in flow.

**Request:**
```http
POST /api/auth/signin/google
Content-Type: application/json

{
  "callbackUrl": "/dashboard"
}
```

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### GET /api/auth/session

Get current user session.

**Request:**
```http
GET /api/auth/session
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STORE_OWNER",
    "tenantId": "uuid"
  },
  "expires": "2025-01-30T00:00:00.000Z"
}
```

### POST /api/auth/signout

Sign out current user.

**Request:**
```http
POST /api/auth/signout
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "url": "/login"
}
```

---

## Product Endpoints

### GET /api/products

Get paginated list of products.

**Query Parameters:**
```
tenantId - string (required)
page - number (default: 1)
limit - number (default: 20, max: 100)
sort - string (newest|oldest|price-asc|price-desc)
search - string (optional)
categoryId - string (optional)
published - boolean (optional)
```

**Request:**
```http
GET /api/products?tenantId=uuid&page=1&limit=20&sort=newest
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "compareAtPrice": 39.99,
      "sku": "PROD-001",
      "stock": 100,
      "isActive": true,
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Category Name",
        "slug": "category-slug"
      },
      "images": [
        {
          "id": "uuid",
          "url": "https://...",
          "altText": "Product image",
          "order": 0
        }
      ],
      "createdAt": "2025-01-15T00:00:00.000Z",
      "updatedAt": "2025-01-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### GET /api/products/:id

Get single product by ID.

**Request:**
```http
GET /api/products/uuid?tenantId=uuid
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "compareAtPrice": 39.99,
  "sku": "PROD-001",
  "stock": 100,
  "isActive": true,
  "categoryId": "uuid",
  "category": {
    "id": "uuid",
    "name": "Category Name"
  },
  "images": [
    {
      "id": "uuid",
      "url": "https://...",
      "altText": "Product image",
      "order": 0
    }
  ],
  "variants": [
    {
      "id": "uuid",
      "name": "Size",
      "value": "Medium",
      "price": 29.99,
      "stock": 50
    }
  ]
}
```

### POST /api/products

Create new product. (Requires STORE_OWNER or SUPER_ADMIN role)

**Request:**
```http
POST /api/products
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "name": "New Product",
  "description": "Product description",
  "price": 29.99,
  "compareAtPrice": 39.99,
  "sku": "PROD-002",
  "stock": 100,
  "categoryId": "uuid",
  "images": [
    {
      "url": "https://...",
      "altText": "Product image"
    }
  ],
  "variants": [
    {
      "name": "Size",
      "value": "Small",
      "price": 24.99,
      "stock": 30
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "New Product",
  "description": "Product description",
  "price": 29.99,
  "createdAt": "2025-01-15T00:00:00.000Z"
}
```

### PUT /api/products/:id

Update existing product. (Requires STORE_OWNER or SUPER_ADMIN role)

**Request:**
```http
PUT /api/products/uuid
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "name": "Updated Product Name",
  "price": 34.99,
  "stock": 150
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Product Name",
  "price": 34.99,
  "stock": 150,
  "updatedAt": "2025-01-15T00:00:00.000Z"
}
```

### DELETE /api/products/:id

Delete product. (Requires STORE_OWNER or SUPER_ADMIN role)

**Request:**
```http
DELETE /api/products/uuid
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "message": "Product deleted successfully"
}
```

---

## Category Endpoints

### GET /api/categories

Get all categories for a tenant.

**Request:**
```http
GET /api/categories?tenantId=uuid
```

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic products",
      "parentId": null,
      "children": [
        {
          "id": "uuid",
          "name": "Phones",
          "slug": "phones",
          "parentId": "uuid"
        }
      ],
      "productCount": 25
    }
  ]
}
```

### POST /api/categories

Create new category. (Requires STORE_OWNER or SUPER_ADMIN role)

**Request:**
```http
POST /api/categories
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "parentId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "New Category",
  "slug": "new-category",
  "createdAt": "2025-01-15T00:00:00.000Z"
}
```

---

## Cart Endpoints

### GET /api/cart

Get current user's cart.

**Request:**
```http
GET /api/cart
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "tenantId": "uuid",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "product": {
        "id": "uuid",
        "name": "Product Name",
        "price": 29.99,
        "images": [
          {
            "url": "https://..."
          }
        ]
      },
      "quantity": 2,
      "price": 29.99,
      "variantId": "uuid"
    }
  ],
  "subtotal": 59.98,
  "tax": 5.40,
  "shipping": 10.00,
  "total": 75.38
}
```

### POST /api/cart/add

Add item to cart.

**Request:**
```http
POST /api/cart/add
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "productId": "uuid",
  "quantity": 2,
  "variantId": "uuid"
}
```

**Response:**
```json
{
  "cart": {
    "id": "uuid",
    "items": [...],
    "total": 75.38
  }
}
```

### PUT /api/cart/update

Update cart item quantity.

**Request:**
```http
PUT /api/cart/update
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "cartItemId": "uuid",
  "quantity": 3
}
```

**Response:**
```json
{
  "cart": {
    "id": "uuid",
    "items": [...],
    "total": 99.97
  }
}
```

### DELETE /api/cart/remove

Remove item from cart.

**Request:**
```http
DELETE /api/cart/remove
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "cartItemId": "uuid"
}
```

**Response:**
```json
{
  "cart": {
    "id": "uuid",
    "items": [...],
    "total": 29.99
  }
}
```

---

## Order Endpoints

### GET /api/orders

Get user's orders.

**Query Parameters:**
```
page - number (default: 1)
limit - number (default: 20)
status - string (optional: pending|processing|shipped|delivered|cancelled)
```

**Request:**
```http
GET /api/orders?page=1&limit=20
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "ORD-2025-001",
      "status": "processing",
      "subtotal": 59.98,
      "tax": 5.40,
      "shipping": 10.00,
      "total": 75.38,
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "product": {
            "name": "Product Name",
            "images": [{"url": "https://..."}]
          },
          "quantity": 2,
          "price": 29.99
        }
      ],
      "shippingAddress": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "US"
      },
      "createdAt": "2025-01-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### GET /api/orders/:id

Get single order details.

**Request:**
```http
GET /api/orders/uuid
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "id": "uuid",
  "orderNumber": "ORD-2025-001",
  "status": "processing",
  "subtotal": 59.98,
  "tax": 5.40,
  "shipping": 10.00,
  "total": 75.38,
  "paymentStatus": "paid",
  "stripePaymentIntentId": "pi_...",
  "items": [...],
  "shippingAddress": {...},
  "createdAt": "2025-01-15T00:00:00.000Z",
  "updatedAt": "2025-01-15T00:00:00.000Z"
}
```

### PUT /api/orders/:id/status

Update order status. (Requires STORE_OWNER or SUPER_ADMIN role)

**Request:**
```http
PUT /api/orders/uuid/status
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "status": "shipped",
  "trackingNumber": "1Z999AA1234567890"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "shipped",
  "trackingNumber": "1Z999AA1234567890",
  "updatedAt": "2025-01-15T00:00:00.000Z"
}
```

---

## Checkout Endpoints

### POST /api/checkout/create-session

Create Stripe checkout session.

**Request:**
```http
POST /api/checkout/create-session
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "cartId": "uuid",
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "couponCode": "SAVE10"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### POST /api/checkout/verify

Verify payment and create order.

**Request:**
```http
POST /api/checkout/verify
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "sessionId": "cs_test_..."
}
```

**Response:**
```json
{
  "orderId": "uuid",
  "orderNumber": "ORD-2025-001",
  "status": "processing",
  "total": 75.38
}
```

---

## Webhook Endpoints

### POST /api/webhooks/stripe

Handle Stripe webhook events.

**Headers:**
```
stripe-signature: t=...,v1=...
```

**Request:**
```http
POST /api/webhooks/stripe
Content-Type: application/json
stripe-signature: t=...,v1=...

{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "payment_intent": "pi_...",
      "amount_total": 7538,
      "metadata": {
        "orderId": "uuid"
      }
    }
  }
}
```

**Response:**
```json
{
  "received": true
}
```

**Supported Events:**
- `checkout.session.completed` - Create order after successful payment
- `payment_intent.succeeded` - Mark payment as successful
- `payment_intent.payment_failed` - Handle failed payment
- `customer.subscription.created` - Handle subscription (future)
- `customer.subscription.deleted` - Handle subscription cancellation (future)

---

## Search Endpoints

### GET /api/search/autocomplete

Get autocomplete suggestions.

**Query Parameters:**
```
q - string (required, min 2 chars)
tenantId - string (required)
limit - number (default: 5, max: 10)
```

**Request:**
```http
GET /api/search/autocomplete?q=phone&tenantId=uuid&limit=5
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro",
      "price": 999.99,
      "image": "https://...",
      "category": "Phones"
    },
    {
      "id": "uuid",
      "name": "Samsung Galaxy S24",
      "price": 899.99,
      "image": "https://...",
      "category": "Phones"
    }
  ]
}
```

### GET /api/search

Full-text product search.

**Query Parameters:**
```
q - string (required)
tenantId - string (required)
page - number (default: 1)
limit - number (default: 20)
categoryId - string (optional)
minPrice - number (optional)
maxPrice - number (optional)
sort - string (optional: relevance|price-asc|price-desc|newest)
```

**Request:**
```http
GET /api/search?q=laptop&tenantId=uuid&page=1&limit=20&sort=relevance
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "name": "MacBook Pro 16",
      "description": "...",
      "price": 2499.99,
      "relevanceScore": 0.95,
      "images": [...],
      "category": {...}
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  },
  "facets": {
    "categories": [
      {"id": "uuid", "name": "Laptops", "count": 10},
      {"id": "uuid", "name": "Tablets", "count": 5}
    ],
    "priceRanges": [
      {"min": 0, "max": 500, "count": 2},
      {"min": 500, "max": 1000, "count": 5},
      {"min": 1000, "max": 2000, "count": 5},
      {"min": 2000, "max": null, "count": 3}
    ]
  }
}
```

---

## Analytics Endpoints

### GET /api/analytics/dashboard

Get dashboard metrics. (Requires STORE_OWNER or SUPER_ADMIN role)

**Query Parameters:**
```
days - number (default: 30)
```

**Request:**
```http
GET /api/analytics/dashboard?days=30
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "metrics": {
    "totalRevenue": 15000.00,
    "totalOrders": 150,
    "avgOrderValue": 100.00,
    "totalCustomers": 75,
    "conversionRate": 0.05
  },
  "salesData": [
    {
      "date": "2025-01-15",
      "revenue": 500.00,
      "orders": 5
    }
  ],
  "topProducts": [
    {
      "id": "uuid",
      "name": "Product Name",
      "revenue": 1500.00,
      "orders": 50
    }
  ],
  "revenueByCategory": [
    {
      "category": "Electronics",
      "revenue": 10000.00,
      "percentage": 66.7
    }
  ]
}
```

### GET /api/analytics/sales

Get detailed sales data. (Requires STORE_OWNER or SUPER_ADMIN role)

**Query Parameters:**
```
startDate - string (ISO date)
endDate - string (ISO date)
groupBy - string (day|week|month)
```

**Request:**
```http
GET /api/analytics/sales?startDate=2025-01-01&endDate=2025-01-31&groupBy=day
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "sales": [
    {
      "period": "2025-01-15",
      "revenue": 500.00,
      "orders": 5,
      "avgOrderValue": 100.00,
      "newCustomers": 2
    }
  ]
}
```

---

## User Endpoints

### GET /api/users/me

Get current user profile.

**Request:**
```http
GET /api/users/me
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "STORE_OWNER",
  "tenantId": "uuid",
  "tenant": {
    "id": "uuid",
    "name": "My Store",
    "slug": "my-store",
    "domain": "mystore.example.com"
  },
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### PUT /api/users/me

Update current user profile.

**Request:**
```http
PUT /api/users/me
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "name": "John Smith",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Smith",
  "phone": "+1234567890",
  "updatedAt": "2025-01-15T00:00:00.000Z"
}
```

### GET /api/users/addresses

Get user's addresses.

**Request:**
```http
GET /api/users/addresses
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "addresses": [
    {
      "id": "uuid",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US",
      "isDefault": true
    }
  ]
}
```

### POST /api/users/addresses

Create new address.

**Request:**
```http
POST /api/users/addresses
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "street": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "postalCode": "90001",
  "country": "US",
  "isDefault": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "street": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "postalCode": "90001",
  "country": "US",
  "isDefault": false,
  "createdAt": "2025-01-15T00:00:00.000Z"
}
```

---

## Coupon Endpoints

### GET /api/coupons

Get all coupons. (Requires STORE_OWNER or SUPER_ADMIN role)

**Request:**
```http
GET /api/coupons
Cookie: next-auth.session-token=<token>
```

**Response:**
```json
{
  "coupons": [
    {
      "id": "uuid",
      "code": "SAVE10",
      "type": "percentage",
      "value": 10,
      "isActive": true,
      "minPurchase": 50.00,
      "maxUses": 100,
      "usedCount": 25,
      "expiresAt": "2025-12-31T23:59:59.000Z"
    }
  ]
}
```

### POST /api/coupons/validate

Validate coupon code.

**Request:**
```http
POST /api/coupons/validate
Content-Type: application/json
Cookie: next-auth.session-token=<token>

{
  "code": "SAVE10",
  "cartTotal": 100.00
}
```

**Response:**
```json
{
  "valid": true,
  "coupon": {
    "id": "uuid",
    "code": "SAVE10",
    "type": "percentage",
    "value": 10
  },
  "discount": 10.00
}
```

---

## Upload Endpoints

### POST /api/upload/image

Upload single image. (Requires authentication)

**Request:**
```http
POST /api/upload/image
Content-Type: multipart/form-data
Cookie: next-auth.session-token=<token>

FormData:
  file: <image file>
```

**Response:**
```json
{
  "url": "https://blob.vercel-storage.com/...",
  "size": 125432,
  "contentType": "image/jpeg"
}
```

### POST /api/upload/images

Upload multiple images. (Requires authentication)

**Request:**
```http
POST /api/upload/images
Content-Type: multipart/form-data
Cookie: next-auth.session-token=<token>

FormData:
  files: [<image file 1>, <image file 2>, ...]
```

**Response:**
```json
{
  "urls": [
    {
      "url": "https://blob.vercel-storage.com/image1...",
      "size": 125432
    },
    {
      "url": "https://blob.vercel-storage.com/image2...",
      "size": 98765
    }
  ]
}
```

**Constraints:**
- Max file size: 10 MB
- Allowed types: image/jpeg, image/png, image/webp, image/gif
- Max files per request: 10

---

## Health Check

### GET /api/health

Check API and database health.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

**Limits:**
- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per minute
- Checkout endpoints: 3 requests per minute
- Upload endpoints: 10 requests per minute

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642345678
```

**Rate Limit Exceeded Response:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```

---

## Pagination

All list endpoints support pagination.

**Query Parameters:**
```
page - number (default: 1)
limit - number (default: 20, max: 100)
```

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Filtering & Sorting

**Filter Examples:**
```
GET /api/products?categoryId=uuid
GET /api/products?minPrice=10&maxPrice=100
GET /api/products?isActive=true
GET /api/orders?status=processing
```

**Sort Examples:**
```
GET /api/products?sort=price-asc
GET /api/products?sort=price-desc
GET /api/products?sort=newest
GET /api/products?sort=oldest
GET /api/products?sort=name-asc
```

---

## Webhook Security

### Stripe Webhook Signature Verification

```typescript
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Process event

    return new Response(JSON.stringify({ received: true }))
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Webhook signature verification failed' }),
      { status: 400 }
    )
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Get products
const response = await fetch('https://your-domain.com/api/products?tenantId=uuid&page=1')
const data = await response.json()

// Create product (authenticated)
const response = await fetch('https://your-domain.com/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies
  body: JSON.stringify({
    name: 'New Product',
    price: 29.99,
    stock: 100,
    categoryId: 'uuid',
  }),
})

// Handle errors
if (!response.ok) {
  const error = await response.json()
  console.error('API Error:', error)
  throw new Error(error.message)
}
```

### cURL

```bash
# Get products
curl -X GET "https://your-domain.com/api/products?tenantId=uuid&page=1"

# Create product (authenticated)
curl -X POST "https://your-domain.com/api/products" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<token>" \
  -d '{
    "name": "New Product",
    "price": 29.99,
    "stock": 100,
    "categoryId": "uuid"
  }'

# Upload image
curl -X POST "https://your-domain.com/api/upload/image" \
  -H "Cookie: next-auth.session-token=<token>" \
  -F "file=@image.jpg"
```

---

**API Version**: 1.0.0
**Last Updated**: 2025-01-15
**Maintained By**: Backend Team
