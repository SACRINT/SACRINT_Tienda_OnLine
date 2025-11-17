# API Documentation - Tienda Online 2025

## Base URL
```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication
All API endpoints require authentication via NextAuth session cookie.

### Headers
```http
Cookie: next-auth.session-token=<session_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "issues": [] // Optional validation errors (Zod)
}
```

---

## Coupon Management

### List Coupons
Get all coupons for the tenant.

```http
GET /api/coupons
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by ACTIVE/INACTIVE |
| type | string | No | Filter by PERCENTAGE/FIXED_AMOUNT |
| includeExpired | boolean | No | Include expired coupons (default: false) |

**Response**:
```json
{
  "coupons": [
    {
      "id": "coupon_123",
      "code": "SAVE20",
      "type": "PERCENTAGE",
      "discount": 20,
      "maxDiscount": 100,
      "minPurchase": 50,
      "maxUses": 100,
      "usedCount": 15,
      "isActive": true,
      "expiresAt": "2025-12-31T23:59:59Z",
      "description": "20% off all products",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `403`: Forbidden (not STORE_OWNER or SUPER_ADMIN)
- `404`: User has no tenant assigned

---

### Create Coupon
Create a new coupon.

```http
POST /api/coupons
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**Request Body**:
```json
{
  "code": "SAVE20",
  "type": "PERCENTAGE",
  "discount": 20,
  "maxDiscount": 100,
  "minPurchase": 50,
  "maxUses": 100,
  "expiresAt": "2025-12-31T23:59:59Z",
  "description": "20% off all products"
}
```

**Validation Rules**:
- `code`: 2-50 characters, uppercase, alphanumeric + underscore/hyphen
- `type`: "PERCENTAGE" or "FIXED_AMOUNT"
- `discount`: > 0, if PERCENTAGE then <= 100
- `maxDiscount`: > 0 (optional)
- `minPurchase`: >= 0 (optional)
- `maxUses`: >= 1 (optional)
- `expiresAt`: future date (optional)
- `description`: max 500 characters (optional)

**Response**:
```json
{
  "message": "Coupon created successfully",
  "coupon": {
    "id": "coupon_123",
    "code": "SAVE20",
    "type": "PERCENTAGE",
    "discount": 20,
    // ... other fields
  }
}
```

**Status Codes**:
- `201`: Created
- `400`: Invalid data
- `401`: Unauthorized
- `403`: Forbidden
- `409`: Coupon code already exists

---

### Get Coupon
Get a specific coupon by ID.

```http
GET /api/coupons/:id
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Coupon ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeStats | boolean | No | Include usage statistics |

**Response**:
```json
{
  "coupon": {
    "id": "coupon_123",
    "code": "SAVE20",
    // ... coupon fields
  },
  "stats": {
    "usageCount": 15,
    "totalDiscountGiven": 1500.50,
    "totalRevenue": 7500.00,
    "averageOrderValue": 500.00
  }
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Coupon not found

---

### Update Coupon
Update an existing coupon.

```http
PATCH /api/coupons/:id
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**Request Body** (all fields optional):
```json
{
  "isActive": false,
  "discount": 25,
  "maxDiscount": 150,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid data
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Coupon not found

---

### Delete Coupon
Delete a coupon.

```http
DELETE /api/coupons/:id
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**Response**:
```json
{
  "success": true,
  "message": "Coupon deleted successfully"
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Coupon not found

---

### Validate Coupon
Validate a coupon code (public endpoint for customers).

```http
POST /api/coupons/validate
```

**Permissions**: Any authenticated user

**Request Body**:
```json
{
  "code": "SAVE20",
  "orderTotal": 150.00
}
```

**Response - Valid**:
```json
{
  "valid": true,
  "coupon": {
    "id": "coupon_123",
    "code": "SAVE20",
    "type": "PERCENTAGE",
    "discount": 20,
    "expiresAt": "2025-12-31T23:59:59Z"
  },
  "discountAmount": 30.00,
  "finalTotal": 120.00,
  "message": "Coupon applied! You saved $30.00"
}
```

**Response - Invalid**:
```json
{
  "valid": false,
  "error": "Coupon has expired"
}
```

**Status Codes**:
- `200`: Success (check `valid` field)
- `400`: Validation failed
- `401`: Unauthorized

---

## Advanced Search

### Product Search
Advanced product search with filters and facets.

```http
GET /api/search
```

**Permissions**: Any authenticated user

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | No | Search query (searches name, description, SKU, tags) |
| categoryId | string (UUID) | No | Filter by category |
| minPrice | number | No | Minimum price |
| maxPrice | number | No | Maximum price |
| inStock | boolean | No | Filter by availability |
| tags | string | No | Comma-separated tags |
| sort | string | No | Sort: relevance, newest, oldest, price-asc, price-desc, name-asc, name-desc |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20, max: 100) |
| facets | boolean | No | Include facet aggregations (default: false) |

**Response**:
```json
{
  "query": "laptop",
  "results": [
    {
      "id": "product_123",
      "name": "Gaming Laptop",
      "slug": "gaming-laptop",
      "description": "High-performance gaming laptop",
      "shortDescription": "16GB RAM, RTX 3060",
      "sku": "LAPTOP-001",
      "basePrice": 1299.99,
      "salePrice": 1199.99,
      "stock": 5,
      "published": true,
      "featured": true,
      "tags": ["gaming", "laptop", "electronics"],
      "category": {
        "id": "cat_123",
        "name": "Laptops",
        "slug": "laptops"
      },
      "images": [
        {
          "id": "img_123",
          "url": "https://cdn.example.com/laptop.jpg",
          "alt": "Gaming Laptop"
        }
      ],
      "reviewCount": 42,
      "averageRating": 4.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  },
  "facets": {
    "categories": [
      {
        "id": "cat_123",
        "name": "Laptops",
        "slug": "laptops",
        "count": 30
      },
      {
        "id": "cat_456",
        "name": "Desktops",
        "slug": "desktops",
        "count": 15
      }
    ],
    "priceRange": {
      "min": 299.99,
      "max": 2999.99
    },
    "availability": {
      "inStock": 40,
      "outOfStock": 5
    },
    "tags": [
      {
        "name": "gaming",
        "count": 25
      },
      {
        "name": "laptop",
        "count": 30
      }
    ]
  },
  "sort": "relevance"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid parameters
- `401`: Unauthorized

---

### Search Autocomplete
Get search suggestions as user types.

```http
GET /api/search/autocomplete
```

**Permissions**: Any authenticated user

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query (min 1 character) |
| limit | number | No | Max suggestions (default: 10, max: 20) |

**Response**:
```json
{
  "query": "lap",
  "suggestions": [
    {
      "id": "product_123",
      "name": "Gaming Laptop",
      "slug": "gaming-laptop",
      "category": "Laptops",
      "price": 1199.99,
      "image": "https://cdn.example.com/laptop.jpg",
      "inStock": true
    },
    {
      "id": "product_456",
      "name": "Laptop Stand",
      "slug": "laptop-stand",
      "category": "Accessories",
      "price": 29.99,
      "image": "https://cdn.example.com/stand.jpg",
      "inStock": true
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid parameters
- `401`: Unauthorized

---

## Image Upload

### Upload Single Image
Upload a single product image.

```http
POST /api/upload/image
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**Request**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Image file (JPEG, PNG, WebP, GIF, max 10MB) |

**Response**:
```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/products/tenant_123/1234567890-abc123.jpg",
  "filename": "product-image.jpg",
  "size": 2048576,
  "contentType": "image/jpeg",
  "width": 1200,
  "height": 1200
}
```

**Validation**:
- File types: JPEG, JPG, PNG, WebP, GIF
- Max size: 10MB
- Optimized to max 2000x2000px
- Quality: 85%

**Status Codes**:
- `200`: Success
- `400`: Invalid file or validation error
- `401`: Unauthorized
- `403`: Forbidden
- `413`: File too large (>10MB)

---

### Upload Multiple Images
Upload multiple product images at once.

```http
POST /api/upload/images
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**Request**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| files | File[] | Yes | Multiple image files (max 10 files) |

**Response**:
```json
{
  "success": true,
  "uploads": [
    {
      "url": "https://blob.vercel-storage.com/.../image1.jpg",
      "filename": "image1.jpg",
      "size": 2048576,
      "contentType": "image/jpeg",
      "width": 1200,
      "height": 1200
    },
    {
      "url": "https://blob.vercel-storage.com/.../image2.jpg",
      "filename": "image2.jpg",
      "size": 1024768,
      "contentType": "image/jpeg",
      "width": 800,
      "height": 800
    }
  ],
  "errors": [
    {
      "filename": "invalid.pdf",
      "error": "Invalid file type"
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

**Limits**:
- Max 10 files per request
- Each file max 10MB
- Total request size max 50MB

**Status Codes**:
- `200`: Success (check individual file errors)
- `400`: Invalid request or too many files
- `401`: Unauthorized
- `403`: Forbidden

---

### Add Image to Product
Link uploaded image to a product.

```http
POST /api/products/:id/images
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**Request Body**:
```json
{
  "url": "https://blob.vercel-storage.com/.../image.jpg",
  "alt": "Product front view",
  "order": 0
}
```

**Validation**:
- `url`: Valid HTTPS URL
- `alt`: Max 255 characters (optional)
- `order`: >= 0 (optional, default: 0)

**Response**:
```json
{
  "success": true,
  "message": "Image added to product successfully",
  "image": {
    "id": "img_123",
    "url": "https://blob.vercel-storage.com/.../image.jpg",
    "alt": "Product front view",
    "order": 0
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid data
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Product not found

---

### Remove Image from Product
Remove an image from a product.

```http
DELETE /api/products/:id/images
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**Request Body**:
```json
{
  "imageId": "img_123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Image removed from product successfully"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid data
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Product or image not found

---

### Reorder Product Images
Change the display order of product images.

```http
PATCH /api/products/:id/images
```

**Permissions**: STORE_OWNER, SUPER_ADMIN

**Request Body**:
```json
{
  "imageOrders": [
    {
      "imageId": "img_123",
      "order": 0
    },
    {
      "imageId": "img_456",
      "order": 1
    },
    {
      "imageId": "img_789",
      "order": 2
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Images reordered successfully"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid data
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Product not found

---

## Error Codes Reference

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid data or parameters |
| 401 | Unauthorized - Not logged in |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource (e.g., coupon code exists) |
| 413 | Payload Too Large - File size exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

*To be implemented in Week 4*

Expected limits:
- Anonymous: 10 requests/minute
- Authenticated: 100 requests/minute
- STORE_OWNER: 1000 requests/minute

---

## Changelog

### Week 3 (2025-11-17)
- Added coupon management endpoints
- Added advanced search with facets
- Added image upload endpoints
- Added product image management

### Week 2
- User profile endpoints
- Stripe webhooks
- Email notifications

### Week 1
- Tenant isolation security
- Base authentication

---

**Last Updated**: Week 4
**API Version**: 1.0.0
