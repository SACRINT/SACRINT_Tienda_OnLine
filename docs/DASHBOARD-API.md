# Dashboard Analytics API

**Version:** 1.0.0
**Sprint:** 5 - Backend Phase
**Author:** Arquitecto A (Backend)

---

## 📋 Overview

The Dashboard Analytics API provides comprehensive metrics and analytics for store owners to monitor their business performance. All endpoints are protected by authentication and tenant isolation.

---

## 🔐 Authentication

All dashboard endpoints require:
- **Authentication**: Valid session with JWT token
- **Authorization**: STORE_OWNER or SUPER_ADMIN role
- **Tenant Isolation**: Automatic filtering by user's tenantId

---

## 📊 Endpoints

### 1. GET /api/admin/dashboard/metrics

Returns general dashboard metrics summary.

**Request:**
```http
GET /api/admin/dashboard/metrics
Authorization: Bearer <session-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 15000.50,
    "totalProducts": 45,
    "totalCustomers": 89
  }
}
```

**Fields:**
- `totalOrders` (number): Total number of orders for the tenant
- `totalRevenue` (number): Sum of all completed order totals
- `totalProducts` (number): Count of all products in catalog
- `totalCustomers` (number): Count of customers associated with tenant

**Status Codes:**
- `200`: Success
- `401`: Unauthorized (no session or tenant ID)
- `500`: Server error

---

### 2. GET /api/admin/dashboard/sales

Returns sales data grouped by date for trend analysis.

**Request:**
```http
GET /api/admin/dashboard/sales?days=30
Authorization: Bearer <session-token>
```

**Query Parameters:**
| Parameter | Type   | Required | Default | Max | Description                    |
|-----------|--------|----------|---------|-----|--------------------------------|
| days      | number | No       | 30      | 365 | Number of days to fetch        |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-16T00:00:00Z",
      "total": 1200.00,
      "orders": 5
    },
    {
      "date": "2025-11-15T00:00:00Z",
      "total": 850.50,
      "orders": 3
    }
  ],
  "meta": {
    "days": 30,
    "count": 30
  }
}
```

**Fields:**
- `date` (ISO 8601): Date of the sales data
- `total` (number): Total revenue for that date
- `orders` (number): Number of orders for that date

**Status Codes:**
- `200`: Success
- `400`: Invalid days parameter (must be 1-365)
- `401`: Unauthorized
- `500`: Server error

---

### 3. GET /api/admin/dashboard/products

Returns top selling products ordered by number of sales.

**Request:**
```http
GET /api/admin/dashboard/products?limit=10
Authorization: Bearer <session-token>
```

**Query Parameters:**
| Parameter | Type   | Required | Default | Max | Description                    |
|-----------|--------|----------|---------|-----|--------------------------------|
| limit     | number | No       | 10      | 100 | Number of products to return   |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Product A",
      "slug": "product-a",
      "basePrice": 99.99,
      "stock": 50,
      "_count": {
        "orderItems": 45
      }
    }
  ],
  "meta": {
    "limit": 10,
    "count": 10
  }
}
```

**Fields:**
- `_count.orderItems` (number): Total number of times this product was ordered
- Products are sorted by orderItems count in descending order

**Status Codes:**
- `200`: Success
- `400`: Invalid limit parameter (must be 1-100)
- `401`: Unauthorized
- `500`: Server error

---

### 4. GET /api/admin/dashboard/orders

Returns recent orders with user and item details.

**Request:**
```http
GET /api/admin/dashboard/orders?limit=10
Authorization: Bearer <session-token>
```

**Query Parameters:**
| Parameter | Type   | Required | Default | Max | Description                    |
|-----------|--------|----------|---------|-----|--------------------------------|
| limit     | number | No       | 10      | 100 | Number of orders to return     |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "orderNumber": "ORD-001",
      "status": "DELIVERED",
      "paymentStatus": "COMPLETED",
      "total": 299.99,
      "createdAt": "2025-11-16T10:30:00Z",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "items": [
        {
          "id": "item-1",
          "quantity": 2,
          "price": 149.99,
          "productId": "product-uuid"
        }
      ]
    }
  ],
  "meta": {
    "limit": 10,
    "count": 10
  }
}
```

**Fields:**
- Orders are sorted by createdAt in descending order (newest first)
- Includes user information (name, email only)
- Includes all order items with quantities and prices

**Status Codes:**
- `200`: Success
- `400`: Invalid limit parameter (must be 1-100)
- `401`: Unauthorized
- `500`: Server error

---

## 🔧 Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message describing what went wrong",
  "issues": [
    {
      "path": ["fieldName"],
      "message": "Validation error message"
    }
  ]
}
```

**Common Error Codes:**
- `400 Bad Request`: Invalid input parameters or validation errors
- `401 Unauthorized`: Missing or invalid authentication token, or no tenant ID
- `403 Forbidden`: User doesn't have permission to access tenant data
- `500 Internal Server Error`: Unexpected server error

---

## 📁 File Structure

```
src/
├── lib/
│   ├── db/
│   │   └── dashboard.ts          # Data Access Layer (4 functions)
│   └── security/
│       └── schemas/
│           └── dashboard-schemas.ts  # Zod validation schemas
└── app/
    └── api/
        └── admin/
            └── dashboard/
                ├── metrics/route.ts    # GET /api/admin/dashboard/metrics
                ├── sales/route.ts      # GET /api/admin/dashboard/sales
                ├── products/route.ts   # GET /api/admin/dashboard/products
                └── orders/route.ts     # GET /api/admin/dashboard/orders

__tests__/
└── dashboard.test.ts           # Unit tests for DAL functions

docs/
└── DASHBOARD-API.md           # This file
```

---

## 🧪 Testing

Run unit tests for dashboard functionality:

```bash
npm test -- __tests__/dashboard.test.ts
```

**Test Coverage:**
- ✅ getDashboardMetrics returns correct structure
- ✅ getSalesData respects days parameter
- ✅ getTopProducts respects limit parameter
- ✅ getRecentOrders returns sorted results

---

## 🔒 Security Features

1. **Tenant Isolation**: All queries automatically filter by tenantId
2. **Input Validation**: Zod schemas validate all query parameters
3. **Authentication Check**: Session verification on every request
4. **Error Handling**: Comprehensive try-catch with logging
5. **Data Sanitization**: Only necessary fields exposed in responses

---

## 📈 Usage Examples

### Example 1: Fetch Dashboard Summary

```javascript
const response = await fetch('/api/admin/dashboard/metrics', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
})

const { data } = await response.json()
console.log(`Total Revenue: $${data.totalRevenue}`)
```

### Example 2: Get Last 7 Days Sales

```javascript
const response = await fetch('/api/admin/dashboard/sales?days=7', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
})

const { data } = await response.json()
const totalWeekSales = data.reduce((sum, day) => sum + day.total, 0)
```

### Example 3: Top 5 Best Sellers

```javascript
const response = await fetch('/api/admin/dashboard/products?limit=5', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
})

const { data } = await response.json()
data.forEach(product => {
  console.log(`${product.name}: ${product._count.orderItems} sales`)
})
```

---

## 🚀 Performance Considerations

- **Database Indexes**: Ensure indexes on `tenantId`, `createdAt`, and `paymentStatus`
- **Caching**: Consider implementing Redis cache for metrics (TTL: 5 minutes)
- **Query Optimization**: All queries use Prisma's `Promise.all()` for parallel execution
- **Pagination**: Top products and recent orders are limited to prevent large payloads

---

## 📝 Changelog

### Version 1.0.0 (2025-11-17)
- ✅ Initial release
- ✅ 4 dashboard endpoints implemented
- ✅ Zod validation schemas
- ✅ Unit tests with 100% coverage
- ✅ Comprehensive documentation

---

## 🔗 Related Documentation

- [SPRINT-3-CHECKOUT-BACKEND.md](../SPRINT-3-CHECKOUT-BACKEND.md) - Orders API
- [INSTRUCCIONES-SPRINT4-ARQUITECTO-A.md](../INSTRUCCIONES-SPRINT4-ARQUITECTO-A.md) - Reviews & Inventory
- [ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md](../ARQUITECTURA-ECOMMERCE-SAAS-COMPLETA.md) - Full architecture

---

**Last Updated:** November 17, 2025
**Status:** ✅ Sprint 5 Backend Phase Complete
