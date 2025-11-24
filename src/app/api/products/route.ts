// Products API
// GET /api/products - Get products with advanced filtering and pagination
// POST /api/products - Create new product (STORE_OWNER only)
// ✅ PERFORMANCE [P1.16]: Caching implemented (5min TTL)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getProducts, createProduct, isProductSkuAvailable } from "@/lib/db/products";
import { getCategoryById } from "@/lib/db/categories";
import { ProductFilterSchema, CreateProductSchema } from "@/lib/security/schemas/product-schemas";
import { USER_ROLES } from "@/lib/types/user-role";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { cache } from "@/lib/performance/cache";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

/**
 * GET /api/products
 * Returns products with advanced filtering, search, and pagination
 *
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 * - categoryId: UUID (filter by category)
 * - search: string (search in name, description, SKU)
 * - minPrice: number (minimum price filter)
 * - maxPrice: number (maximum price filter)
 * - inStock: boolean (filter by stock availability)
 * - published: boolean (filter by published status)
 * - featured: boolean (filter by featured status)
 * - tags: string (comma-separated tags)
 * - sort: newest|oldest|price-asc|price-desc|name-asc|name-desc|stock-asc|stock-desc
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json({ error: "User has no tenant assigned" }, { status: 404 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);

    const filters = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      categoryId: searchParams.get("categoryId"),
      search: searchParams.get("search"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      inStock: searchParams.get("inStock"),
      published: searchParams.get("published"),
      featured: searchParams.get("featured"),
      tags: searchParams.get("tags"),
      sort: searchParams.get("sort") || "newest",
    };

    const validation = ProductFilterSchema.safeParse(filters);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid filters",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const validatedFilters = validation.data;

    // ✅ PERFORMANCE [P1.16]: Cache with 5min TTL
    const cacheKey = `products:${tenantId}:${JSON.stringify(validatedFilters)}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return NextResponse.json(cached);
    }

    // Get products with filters
    const result = await getProducts(tenantId, validatedFilters);

    const response = {
      products: result.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        sku: product.sku,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        stock: product.stock,
        published: product.published,
        featured: product.featured,
        tags: product.tags,
        category: product.category,
        images: product.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          order: img.order,
        })),
        variants: product.variants.map((variant: any) => ({
          id: variant.id,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          stock: variant.stock,
        })),
        reviewCount: product._count.reviews,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })),
      pagination: result.pagination,
      filters: validatedFilters,
    };

    // Cache the response for 5 minutes (300 seconds)
    await cache.set(cacheKey, response, 300);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PRODUCTS] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Creates a new product
 * Only STORE_OWNER or SUPER_ADMIN can create products
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting - 20 product creations per hour for store owners
    const rateLimitResult = await applyRateLimit(req, {
      userId: session.user.id,
      config: {
        interval: 60 * 60 * 1000, // 1 hour
        limit: 20, // 20 products per hour
      },
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const { role, tenantId } = session.user;

    if (!tenantId) {
      return NextResponse.json({ error: "User has no tenant assigned" }, { status: 404 });
    }

    // Check if user has permission to create products
    if (role !== USER_ROLES.STORE_OWNER && role !== USER_ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        {
          error: "Forbidden - Only STORE_OWNER or SUPER_ADMIN can create products",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = CreateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const {
      name,
      slug,
      description,
      shortDescription,
      sku,
      basePrice,
      salePrice,
      salePriceExpiresAt,
      stock,
      lowStockThreshold,
      weight,
      length,
      width,
      height,
      categoryId,
      tags,
      seo,
      published,
      featured,
    } = validation.data;

    // Verify category exists and belongs to tenant
    const category = await getCategoryById(tenantId, categoryId);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found or does not belong to your tenant" },
        { status: 404 },
      );
    }

    // Check if SKU is available within tenant
    const skuAvailable = await isProductSkuAvailable(tenantId, sku);

    if (!skuAvailable) {
      return NextResponse.json(
        {
          error: "SKU already exists within your store. Please choose a different SKU.",
        },
        { status: 409 },
      );
    }

    // Create product with images
    const product = await createProduct(tenantId, {
      name,
      slug,
      description,
      shortDescription,
      sku,
      basePrice,
      salePrice,
      salePriceExpiresAt,
      stock,
      reserved: 0,
      lowStockThreshold: lowStockThreshold || 10,
      weight,
      length,
      width,
      height,
      tags,
      seo: seo || {},
      published,
      featured,
      category: {
        connect: { id: categoryId },
      },
    });

    console.log("[PRODUCTS] Created new product:", product.id, "by user:", session.user.id);

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          sku: product.sku,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          stock: product.stock,
          published: product.published,
          featured: product.featured,
          categoryId: product.categoryId,
          category: product.category,
          images: product.images,
          createdAt: product.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[PRODUCTS] POST error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Product with this slug already exists in your store" },
          { status: 409 },
        );
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
