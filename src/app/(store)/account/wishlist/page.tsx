"use client"

import * as React from "react"
import Link from "next/link"
import {
  Heart,
  ShoppingCart,
  Trash2,
  Share2,
  Package,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface WishlistItem {
  id: string
  productId: string
  name: string
  price: number
  salePrice: number | null
  image: string | null
  rating: number
  reviews: number
  inStock: boolean
  addedAt: string
}

// Mock wishlist data
const initialWishlist: WishlistItem[] = [
  {
    id: "1",
    productId: "prod-1",
    name: "Auriculares Bluetooth Pro Max",
    price: 2999,
    salePrice: 2499,
    image: null,
    rating: 4.5,
    reviews: 128,
    inStock: true,
    addedAt: "2024-03-10",
  },
  {
    id: "2",
    productId: "prod-2",
    name: "Reloj Inteligente Series 5",
    price: 4999,
    salePrice: null,
    image: null,
    rating: 4.8,
    reviews: 256,
    inStock: true,
    addedAt: "2024-03-08",
  },
  {
    id: "3",
    productId: "prod-3",
    name: "Laptop Gaming Pro 15",
    price: 24999,
    salePrice: 22999,
    image: null,
    rating: 4.7,
    reviews: 89,
    inStock: false,
    addedAt: "2024-03-05",
  },
  {
    id: "4",
    productId: "prod-4",
    name: "Cámara DSLR Professional",
    price: 18999,
    salePrice: null,
    image: null,
    rating: 4.9,
    reviews: 64,
    inStock: true,
    addedAt: "2024-02-28",
  },
  {
    id: "5",
    productId: "prod-5",
    name: "Mochila Urban Explorer",
    price: 1299,
    salePrice: null,
    image: null,
    rating: 4.3,
    reviews: 42,
    inStock: true,
    addedAt: "2024-02-20",
  },
]

export default function WishlistPage() {
  const [wishlist, setWishlist] = React.useState(initialWishlist)
  const [sortBy, setSortBy] = React.useState("recent")

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    })

  const handleRemove = (id: string) => {
    setWishlist(wishlist.filter((item) => item.id !== id))
  }

  const handleAddToCart = (item: WishlistItem) => {
    // Add to cart logic
    console.log("Add to cart:", item.name)
  }

  const sortedWishlist = [...wishlist].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.salePrice || a.price) - (b.salePrice || b.price)
      case "price-high":
        return (b.salePrice || b.price) - (a.salePrice || a.price)
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    }
  })

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Lista de Deseos
            </h1>
            <p className="text-muted-foreground mt-1">
              {wishlist.length} productos guardados
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="price-low">Precio: Menor a mayor</SelectItem>
                <SelectItem value="price-high">Precio: Mayor a menor</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>

        {/* Wishlist Grid */}
        {sortedWishlist.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Tu lista de deseos está vacía
              </p>
              <Button asChild>
                <Link href="/shop">Explorar Productos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedWishlist.map((item) => (
              <Card key={item.id} className="overflow-hidden group">
                <div className="relative aspect-square bg-muted">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Sale Badge */}
                  {item.salePrice && (
                    <Badge className="absolute top-2 left-2 bg-error">
                      -{Math.round(((item.price - item.salePrice) / item.price) * 100)}%
                    </Badge>
                  )}

                  {/* Out of Stock Overlay */}
                  {!item.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="text-sm">
                        Agotado
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-medium hover:text-accent transition-colors line-clamp-2"
                  >
                    {item.name}
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="text-sm font-medium">{item.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({item.reviews})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-2">
                    {item.salePrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(item.salePrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(item.price)}
                      </span>
                    )}
                  </div>

                  {/* Added Date */}
                  <p className="text-xs text-muted-foreground mt-2">
                    Agregado el {formatDate(item.addedAt)}
                  </p>

                  {/* Add to Cart Button */}
                  <Button
                    className="w-full mt-4"
                    disabled={!item.inStock}
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {item.inStock ? "Agregar al Carrito" : "Agotado"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add All to Cart */}
        {sortedWishlist.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar Todo al Carrito (
              {sortedWishlist.filter((i) => i.inStock).length} productos)
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
