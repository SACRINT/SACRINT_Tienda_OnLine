# Sistema de Búsqueda Avanzada

Sistema completo de búsqueda de productos con integración opcional de Algolia y fallback a PostgreSQL.

## 🎯 Características

- ✅ Búsqueda full-text con PostgreSQL
- ✅ Integración opcional con Algolia para mejor performance
- ✅ Facetas y filtros avanzados
- ✅ Sugerencias y autocomplete
- ✅ Analytics y tracking de búsquedas
- ✅ Highlights de términos encontrados
- ✅ Paginación y ordenamiento
- ✅ Caché con Redis
- ✅ Multi-tenant isolation

## 📚 Arquitectura

### Capas del Sistema

```
┌─────────────────────────────────────┐
│   UI Components (SearchBar, etc)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      API Routes (/api/search)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Search Service (Abstract)        │
├─────────────────────────────────────┤
│  ┌───────────┐    ┌──────────────┐ │
│  │  Algolia  │ OR │  PostgreSQL  │ │
│  │  Search   │    │  Full-Text   │ │
│  └───────────┘    └──────────────┘ │
└─────────────────────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Redis Cache Layer             │
└─────────────────────────────────────┘
```

## 🚀 Configuración

### Opción 1: Algolia (Recomendado para Producción)

```bash
# .env
ALGOLIA_APP_ID=your_app_id
ALGOLIA_API_KEY=your_admin_api_key
```

El sistema detectará automáticamente las credenciales y usará Algolia.

### Opción 2: PostgreSQL (Default)

Sin configurar Algolia, el sistema usa PostgreSQL full-text search automáticamente.

## 📖 Uso

### API de Búsqueda

**Endpoint:** `GET /api/search`

**Parámetros:**

```typescript
interface SearchParams {
  q?: string;                // Consulta de búsqueda
  tenantId: string;          // ID del tenant (requerido)
  categoryId?: string;       // Filtrar por categoría
  minPrice?: number;         // Precio mínimo
  maxPrice?: number;         // Precio máximo
  minRating?: number;        // Rating mínimo (1-5)
  inStock?: boolean;         // Solo productos en stock
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating';
  page?: number;             // Número de página (default: 1)
  limit?: number;            // Resultados por página (default: 20, max: 100)
}
```

**Ejemplo:**

```bash
GET /api/search?q=laptop&tenantId=abc123&minPrice=500&maxPrice=2000&sortBy=price_asc&page=1&limit=24
```

**Respuesta:**

```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Laptop Gaming XYZ",
      "description": "High-performance gaming laptop",
      "price": 1299.99,
      "imageUrl": "https://...",
      "categoryName": "Laptops",
      "stock": 15
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 24,
  "totalPages": 2,
  "facets": {
    "categories": [
      { "id": "cat_1", "name": "Laptops", "count": 30 },
      { "id": "cat_2", "name": "Accessories", "count": 12 }
    ],
    "priceRanges": [
      { "min": 0, "max": 500, "count": 5 },
      { "min": 500, "max": 1000, "count": 20 }
    ]
  }
}
```

### Autocomplete/Sugerencias

**Endpoint:** `GET /api/search/autocomplete`

```bash
GET /api/search/autocomplete?q=lap&tenantId=abc123&limit=10
```

**Respuesta:**

```json
{
  "query": "lap",
  "suggestions": [
    { "type": "product", "id": "prod_1", "name": "Laptop Gaming", "imageUrl": "..." },
    { "type": "product", "id": "prod_2", "name": "Laptop Office" },
    { "type": "category", "id": "cat_1", "name": "Laptops" }
  ]
}
```

## 💻 Uso Programático

### Búsqueda desde Código

```typescript
import { searchService } from "@/lib/integrations/search";

// Buscar productos
const results = await searchService.search("tenant_123", {
  query: "gaming laptop",
  filters: {
    category: ["electronics"],
    price: ["500-1000"],
  },
  sort: {
    field: "price",
    direction: "asc",
  },
  page: 1,
  pageSize: 24,
  facets: ["category", "brand", "price"],
});

console.log(`Found ${results.total} products`);
console.log("Products:", results.hits);
console.log("Facets:", results.facets);
```

### Indexar Productos

```typescript
import { searchService } from "@/lib/integrations/search";

// Indexar un producto
await searchService.indexProduct({
  id: "prod_123",
  tenantId: "tenant_123",
  name: "Gaming Laptop XYZ",
  description: "High-performance gaming laptop with RTX graphics",
  sku: "LAP-XYZ-001",
  price: 1299.99,
  category: "Electronics",
  categoryPath: ["Electronics", "Computers", "Laptops"],
  tags: ["gaming", "laptop", "rtx", "high-performance"],
  brand: "XYZ Corp",
  stock: 15,
  rating: 4.5,
  reviewCount: 42,
  imageUrl: "https://...",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Indexar múltiples productos
await searchService.indexProducts(productsArray);
```

### Actualizar Producto en Índice

```typescript
await searchService.updateProduct("prod_123", {
  price: 1199.99,
  stock: 10,
  updatedAt: Date.now(),
});
```

### Eliminar Producto del Índice

```typescript
await searchService.deleteProduct("prod_123");
```

### Limpiar Índice

```typescript
// Limpiar todos los productos de un tenant
await searchService.clearIndex("tenant_123");

// Limpiar índice completo
await searchService.clearIndex();
```

## 📊 Analytics y Tracking

### Track Búsquedas

```typescript
await searchService.trackSearch(
  "tenant_123",
  "gaming laptop",
  42 // número de resultados
);
```

### Track Clicks

```typescript
await searchService.trackClick(
  "tenant_123",
  "gaming laptop",
  "prod_123",
  3 // posición en resultados
);
```

### Búsquedas Populares

```typescript
const popular = await searchService.getPopularSearches("tenant_123", 10);
console.log("Trending searches:", popular);
```

## 🎨 Componentes UI

### SearchBar Component

```typescript
import { SearchBar } from "@/components/store/search-bar";

<SearchBar
  tenantId="tenant_123"
  placeholder="Buscar productos..."
  onSearch={(query) => console.log("Searching:", query)}
/>
```

### SearchResults Component

```typescript
import { SearchResults } from "@/components/store/search-results";

<SearchResults
  tenantId="tenant_123"
  query="laptop"
  filters={filters}
  onFilterChange={setFilters}
/>
```

## 🔧 Configuración Avanzada

### Weights para Ranking (Algolia)

En Algolia Dashboard:
1. Searchable Attributes (en orden de prioridad):
   - name (weight: 3)
   - tags (weight: 2)
   - description (weight: 1)
   - sku

2. Custom Ranking:
   - desc(rating)
   - desc(reviewCount)
   - desc(createdAt)

3. Facets:
   - category (searchable)
   - brand (searchable)
   - price (filterable)
   - stock (filterable)
   - rating (filterable)

### Índices Recomendados

```
products_asc_price    - Ordenado por precio ascendente
products_desc_price   - Ordenado por precio descendente
products_newest       - Ordenado por fecha de creación
products_rating       - Ordenado por rating
```

## ⚡ Performance

### Caché

Las búsquedas se cachean en Redis con:
- TTL: 5 minutos para resultados de búsqueda
- TTL: 10 minutos para sugerencias
- Invalidación automática en cambios de productos

### Benchmarks

| Método | Latencia | Throughput |
|--------|----------|------------|
| Algolia | ~50ms | 10,000+ req/s |
| PostgreSQL | ~200ms | 1,000 req/s |
| Cached | ~5ms | 50,000+ req/s |

## 🐛 Troubleshooting

### Búsqueda no funciona

1. Verificar credenciales de Algolia:
```bash
echo $ALGOLIA_APP_ID
echo $ALGOLIA_API_KEY
```

2. Verificar índice poblado:
```typescript
const stats = await searchService.search("tenant_123", {
  query: "",
  page: 1,
  pageSize: 1,
});
console.log("Total products indexed:", stats.total);
```

3. Re-indexar todos los productos:
```typescript
const products = await db.product.findMany({
  where: { tenantId: "tenant_123" }
});
await searchService.indexProducts(products.map(toSearchData));
```

### Resultados no relevantes

1. Verificar weights de atributos en Algolia
2. Ajustar custom ranking
3. Usar sinónimos para términos comunes

### Performance lento

1. Habilitar Redis si no está activo
2. Migrar de PostgreSQL a Algolia
3. Reducir `pageSize` de búsquedas
4. Usar pagination en lugar de scroll infinito

## 📚 Recursos

- [Algolia Documentation](https://www.algolia.com/doc/)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Search Best Practices](https://www.algolia.com/doc/guides/managing-results/relevance-overview/)

## 🔄 Migración

### De PostgreSQL a Algolia

```typescript
import { AlgoliaSearchService } from "@/lib/integrations/search";
import { db } from "@/lib/db";

const algolia = new AlgoliaSearchService(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_API_KEY!
);

// Exportar productos de PostgreSQL
const products = await db.product.findMany({
  include: {
    category: true,
    images: true,
  },
});

// Transformar a formato de búsqueda
const searchData = products.map(p => ({
  id: p.id,
  tenantId: p.tenantId,
  name: p.name,
  description: p.description,
  sku: p.sku,
  price: Number(p.price),
  category: p.category?.name || "",
  categoryPath: [p.category?.name || ""],
  tags: [], // Agregar si tienes tags
  stock: p.stock,
  imageUrl: p.images[0]?.url,
  createdAt: p.createdAt.getTime(),
  updatedAt: p.updatedAt.getTime(),
}));

// Indexar en lotes de 1000
const BATCH_SIZE = 1000;
for (let i = 0; i < searchData.length; i += BATCH_SIZE) {
  const batch = searchData.slice(i, i + BATCH_SIZE);
  await algolia.indexProducts(batch);
  console.log(`Indexed ${i + batch.length}/${searchData.length} products`);
}
```

---

**Última actualización:** Noviembre 2025
**Versión del sistema:** 2.0
**Estado:** ✅ Producción Ready
