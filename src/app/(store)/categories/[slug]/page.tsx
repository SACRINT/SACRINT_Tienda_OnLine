"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Filter,
  Grid3X3,
  LayoutGrid,
  SlidersHorizontal,
  X,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { PriceRange } from "@/components/ui/price-range";
import { RatingStars } from "@/components/ui/rating-stars";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

// Mock data
const mockProducts = [
  {
    id: "1",
    name: "Auriculares Bluetooth Pro",
    slug: "auriculares-bluetooth-pro",
    price: 1499,
    originalPrice: 1999,
    rating: 4.5,
    reviewCount: 128,
    isSale: true,
    category: "electronicos",
  },
  {
    id: "2",
    name: "Camiseta Premium Algodón",
    slug: "camiseta-premium-algodon",
    price: 599,
    rating: 4.8,
    reviewCount: 256,
    isNew: true,
    category: "ropa",
  },
  {
    id: "3",
    name: "Lámpara LED Inteligente",
    slug: "lampara-led-inteligente",
    price: 899,
    originalPrice: 1199,
    rating: 4.2,
    reviewCount: 89,
    isSale: true,
    category: "hogar",
  },
  {
    id: "4",
    name: "Zapatillas Running Ultra",
    slug: "zapatillas-running-ultra",
    price: 2499,
    rating: 4.7,
    reviewCount: 312,
    isNew: true,
    category: "deportes",
  },
  {
    id: "5",
    name: "Smartwatch Fitness",
    slug: "smartwatch-fitness",
    price: 3299,
    rating: 4.6,
    reviewCount: 198,
    category: "electronicos",
  },
  {
    id: "6",
    name: "Pantalón Casual",
    slug: "pantalon-casual",
    price: 899,
    rating: 4.4,
    reviewCount: 145,
    category: "ropa",
  },
  {
    id: "7",
    name: "Cafetera Automática",
    slug: "cafetera-automatica",
    price: 2899,
    originalPrice: 3499,
    rating: 4.9,
    reviewCount: 412,
    isSale: true,
    category: "hogar",
  },
  {
    id: "8",
    name: "Mochila Deportiva",
    slug: "mochila-deportiva",
    price: 799,
    rating: 4.3,
    reviewCount: 87,
    isNew: true,
    category: "deportes",
  },
];

const categories: Record<string, string> = {
  electronicos: "Electrónicos",
  ropa: "Ropa",
  hogar: "Hogar",
  deportes: "Deportes",
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const categoryName = categories[slug] || "Categoría";

  const [sortBy, setSortBy] = React.useState("relevance");
  const [gridCols, setGridCols] = React.useState<2 | 3 | 4>(3);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    0, 5000,
  ]);
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [selectedRating, setSelectedRating] = React.useState<number | null>(
    null,
  );

  // Filter products
  const filteredProducts = mockProducts.filter((product) => {
    const matchesPrice =
      product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "newest":
        return a.isNew ? -1 : 1;
      default:
        return 0;
    }
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price);

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-4">Precio</h3>
        <PriceRange
          min={0}
          max={5000}
          value={priceRange}
          onValueChange={setPriceRange}
        />
      </div>

      <Separator />

      {/* Brands */}
      <div>
        <h3 className="font-semibold mb-4">Marcas</h3>
        <div className="space-y-3">
          {["Nike", "Adidas", "Samsung", "Apple", "Sony"].map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedBrands([...selectedBrands, brand]);
                  } else {
                    setSelectedBrands(
                      selectedBrands.filter((b) => b !== brand),
                    );
                  }
                }}
              />
              <Label
                htmlFor={`brand-${brand}`}
                className="text-sm cursor-pointer"
              >
                {brand}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h3 className="font-semibold mb-4">Calificación</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() =>
                setSelectedRating(selectedRating === rating ? null : rating)
              }
              className={cn(
                "flex items-center gap-2 w-full p-2 rounded-md transition-colors",
                selectedRating === rating ? "bg-primary/10" : "hover:bg-muted",
              )}
            >
              <RatingStars rating={rating} size="sm" />
              <span className="text-sm text-muted-foreground">y más</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setPriceRange([0, 5000]);
          setSelectedBrands([]);
          setSelectedRating(null);
        }}
      >
        Limpiar Filtros
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/categories">Categorías</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{categoryName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">{categoryName}</h1>
            <p className="text-muted-foreground mt-1">
              {sortedProducts.length} productos encontrados
            </p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                <SelectItem value="price-desc">
                  Precio: Mayor a Menor
                </SelectItem>
                <SelectItem value="rating">Mejor Calificación</SelectItem>
                <SelectItem value="newest">Más Nuevos</SelectItem>
              </SelectContent>
            </Select>

            {/* Grid Toggle */}
            <div className="hidden md:flex items-center border rounded-md">
              <button
                onClick={() => setGridCols(2)}
                className={cn(
                  "p-2 transition-colors",
                  gridCols === 2 ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridCols(3)}
                className={cn(
                  "p-2 transition-colors",
                  gridCols === 3 ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={cn(
                  "p-2 transition-colors",
                  gridCols === 4 ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-4">
              <FilterSidebar />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div
              className={cn(
                "grid gap-6",
                gridCols === 2 && "grid-cols-1 sm:grid-cols-2",
                gridCols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                gridCols === 4 && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
              )}
            >
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
                >
                  <div className="relative aspect-square bg-neutral-100">
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      📦
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isNew && (
                        <Badge className="bg-mint text-mint-foreground">
                          Nuevo
                        </Badge>
                      )}
                      {product.isSale && (
                        <Badge className="bg-error text-error-foreground">
                          Oferta
                        </Badge>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-2 bg-white rounded-full shadow-md hover:bg-neutral-100 transition-colors"
                        aria-label="Agregar a favoritos"
                      >
                        <Heart className="h-4 w-4 text-neutral-600" />
                      </button>
                    </div>

                    {/* Add to Cart */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        className="w-full bg-white text-primary hover:bg-neutral-100"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>

                  <div className="p-4">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-semibold text-primary hover:text-accent transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>

                    {product.rating && (
                      <div className="mt-2 flex items-center gap-2">
                        <RatingStars rating={product.rating} size="sm" />
                        {product.reviewCount && (
                          <span className="text-xs text-muted-foreground">
                            ({product.reviewCount})
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-primary text-primary-foreground"
                >
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
