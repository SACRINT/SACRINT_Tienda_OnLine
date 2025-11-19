// @ts-nocheck
// Product Detail Page - Server Component with Real Data
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  ProductGallery,
  ProductReviews,
  RelatedProducts,
} from "@/components/shop";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Star, Truck, Shield, RotateCcw, Heart, Share2 } from "lucide-react";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

// Demo tenant ID - in production would come from subdomain/domain
const DEMO_TENANT_SLUG = "demo-store";

async function getProduct(idOrSlug: string) {
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
    });

    if (!tenant) return null;

    // Try to find by slug first, then by id
    const product = await db.product.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [{ slug: idOrSlug }, { id: idOrSlug }],
        published: true,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        reviews: {
          where: { status: "APPROVED" },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        category: true,
        variants: true,
      },
    });

    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
) {
  try {
    const tenant = await db.tenant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
    });

    if (!tenant) return [];

    const products = await db.product.findMany({
      where: {
        tenantId: tenant.id,
        categoryId,
        id: { not: excludeProductId },
        published: true,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
          take: 1,
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
      take: 4,
    });

    return products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length
          : undefined;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image:
          product.images[0]?.url ||
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        price: Number(product.basePrice),
        salePrice: product.salePrice ? Number(product.salePrice) : undefined,
        rating: avgRating,
        reviewCount: product.reviews.length,
        inStock: product.stock > 0,
      };
    });
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const relatedProducts = product.categoryId
    ? await getRelatedProducts(product.categoryId, product.id)
    : [];

  // Calculate average rating
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  product.reviews.forEach((review) => {
    ratingCounts[review.rating - 1]++;
  });
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratingCounts[stars - 1],
    percentage:
      product.reviews.length > 0
        ? Math.round((ratingCounts[stars - 1] / product.reviews.length) * 100)
        : 0,
  }));

  // Transform gallery images
  const galleryImages = product.images.map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt || product.name,
  }));

  // If no images, add a placeholder
  if (galleryImages.length === 0) {
    galleryImages.push({
      id: "placeholder",
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      alt: product.name,
    });
  }

  // Transform reviews
  const transformedReviews = product.reviews.map((review) => ({
    id: review.id,
    userId: review.userId,
    userName: review.user.name || "Usuario Anónimo",
    rating: review.rating,
    title: review.title || "",
    content: review.comment,
    isVerifiedPurchase: true,
    createdAt: review.createdAt.toISOString(),
    helpfulCount: 0,
  }));

  const hasDiscount =
    product.salePrice && Number(product.salePrice) < Number(product.basePrice);
  const currentPrice = hasDiscount
    ? Number(product.salePrice)
    : Number(product.basePrice);
  const originalPrice = Number(product.basePrice);
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  // Extract features from description or use defaults
  const features = product.description
    ? product.description
        .split("\n")
        .filter((line) => line.trim())
        .slice(0, 6)
    : [
        "Alta calidad garantizada",
        "Envío seguro y protegido",
        "Soporte al cliente 24/7",
      ];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-600">
          <a href="/shop" className="hover:text-gray-900">
            Tienda
          </a>
          <span>/</span>
          {product.category && (
            <>
              <a
                href={`/categories/${product.category.slug}`}
                className="hover:text-gray-900"
              >
                {product.category.name}
              </a>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <ProductGallery images={galleryImages} productName={product.name} />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.shortDescription && (
              <p className="mt-2 text-gray-600">{product.shortDescription}</p>
            )}

            {/* Rating */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {avgRating.toFixed(1)} ({product.reviews.length} reseñas)
              </span>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">
                $
                {currentPrice.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    $
                    {originalPrice.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                    Ahorra {discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mt-4">
              {product.stock > 0 ? (
                <p className="text-sm text-green-600">
                  En stock ({product.stock} disponibles)
                </p>
              ) : (
                <p className="text-sm text-red-600">Agotado</p>
              )}
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900">
                  Variantes disponibles:
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <span
                      key={variant.id}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {variant.color || variant.size || `SKU: ${variant.sku}`}
                      {variant.stock > 0 ? ` (${variant.stock})` : " (Agotado)"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="mt-8 flex gap-4">
              <div className="flex-1">
                <AddToCartButton
                  productId={product.id}
                  productName={product.name}
                  productSlug={product.slug}
                  productPrice={currentPrice}
                  productImage={galleryImages[0]?.url || ""}
                  stock={product.stock}
                />
              </div>
              <button className="rounded-lg border-2 border-gray-300 p-4 transition-all hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Heart className="h-6 w-6 text-gray-600" />
              </button>
              <button className="rounded-lg border-2 border-gray-300 p-4 transition-all hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Share2 className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Truck className="h-5 w-5 text-blue-600" />
                <span>Envío gratis en compras mayores a $500</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Garantía de 1 año incluida</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <RotateCcw className="h-5 w-5 text-blue-600" />
                <span>30 días para devoluciones</span>
              </div>
            </div>

            {/* Product Features */}
            {features.length > 0 && (
              <div className="mt-8 rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900">Características</h3>
                <ul className="mt-4 space-y-2">
                  {features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="mt-1 text-blue-600">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Description Tab */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-8">
              <button className="border-b-2 border-blue-600 pb-4 text-sm font-medium text-blue-600">
                Descripción
              </button>
            </nav>
          </div>
          <div className="py-8">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description || "Sin descripción disponible."}
            </p>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <Suspense
            fallback={<div className="animate-pulse">Cargando reseñas...</div>}
          >
            <ProductReviews
              reviews={transformedReviews}
              averageRating={avgRating}
              totalReviews={product.reviews.length}
              ratingDistribution={ratingDistribution}
              hasMore={false}
            />
          </Suspense>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <Suspense
              fallback={
                <div className="animate-pulse">Cargando productos...</div>
              }
            >
              <RelatedProducts products={relatedProducts} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
