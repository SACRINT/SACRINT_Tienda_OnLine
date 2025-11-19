"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Heart, ShoppingCart, Share2, Truck, Shield, RefreshCw, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { RatingStars } from "@/components/ui/rating-stars"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { ColorSelector, type ColorOption } from "@/components/ui/color-selector"
import { SizeSelector, type SizeOption } from "@/components/ui/size-selector"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

// Mock product data
const mockProduct = {
  id: "1",
  name: "Auriculares Bluetooth Pro Max",
  slug: "auriculares-bluetooth-pro-max",
  description: "Auriculares inalámbricos de alta fidelidad con cancelación activa de ruido, 40 horas de batería y carga rápida. Perfectos para trabajo, viajes y entretenimiento.",
  price: 2999,
  originalPrice: 3999,
  rating: 4.7,
  reviewCount: 328,
  stock: 15,
  sku: "AUD-BT-001",
  category: { name: "Electrónicos", slug: "electronicos" },
  images: [
    "/products/headphones-1.jpg",
    "/products/headphones-2.jpg",
    "/products/headphones-3.jpg",
    "/products/headphones-4.jpg",
  ],
  colors: [
    { name: "Negro", value: "black", hex: "#000000" },
    { name: "Blanco", value: "white", hex: "#FFFFFF" },
    { name: "Azul", value: "blue", hex: "#1E40AF" },
  ] as ColorOption[],
  sizes: [] as SizeOption[],
  specifications: [
    { label: "Conectividad", value: "Bluetooth 5.3" },
    { label: "Duración de batería", value: "40 horas" },
    { label: "Tiempo de carga", value: "2 horas (carga rápida: 10min = 3h)" },
    { label: "Driver", value: "40mm dinámico" },
    { label: "Respuesta de frecuencia", value: "20Hz - 20kHz" },
    { label: "Impedancia", value: "32 Ohm" },
    { label: "Peso", value: "250g" },
    { label: "Incluye", value: "Cable USB-C, Estuche, Manual" },
  ],
  features: [
    "Cancelación activa de ruido (ANC)",
    "Modo transparencia",
    "Controles táctiles",
    "Asistente de voz integrado",
    "Plegables para fácil transporte",
    "Almohadillas de memory foam",
  ],
}

// Mock reviews
const mockReviews = [
  { id: "1", user: "María G.", rating: 5, date: "2024-11-10", comment: "Excelente calidad de sonido y muy cómodos para uso prolongado.", helpful: 24 },
  { id: "2", user: "Carlos R.", rating: 4, date: "2024-11-08", comment: "Muy buena cancelación de ruido, aunque la app podría mejorar.", helpful: 18 },
  { id: "3", user: "Ana L.", rating: 5, date: "2024-11-05", comment: "La batería dura muchísimo, perfectos para viajes largos.", helpful: 31 },
]

// Mock related products
const relatedProducts = [
  { id: "2", name: "Case Premium", slug: "case-premium", price: 499, rating: 4.5 },
  { id: "3", name: "Cable USB-C Extra", slug: "cable-usb-c", price: 299, rating: 4.2 },
  { id: "4", name: "Almohadillas Repuesto", slug: "almohadillas-repuesto", price: 399, rating: 4.8 },
]

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [selectedImage, setSelectedImage] = React.useState(0)
  const [selectedColor, setSelectedColor] = React.useState(mockProduct.colors[0]?.value || "")
  const [selectedSize, setSelectedSize] = React.useState("")
  const [quantity, setQuantity] = React.useState(1)
  const [isZoomed, setIsZoomed] = React.useState(false)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(price)

  const discount = mockProduct.originalPrice
    ? Math.round((1 - mockProduct.price / mockProduct.originalPrice) * 100)
    : 0

  const handleAddToCart = () => {
    console.log("Add to cart:", {
      productId: mockProduct.id,
      color: selectedColor,
      size: selectedSize,
      quantity,
    })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    // Redirect to checkout
  }

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
                <BreadcrumbLink href={`/categories/${mockProduct.category.slug}`}>
                  {mockProduct.category.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{mockProduct.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden cursor-zoom-in"
              onClick={() => setIsZoomed(true)}
            >
              <div className="w-full h-full flex items-center justify-center text-8xl">
                🎧
              </div>

              {/* Zoom Icon */}
              <button className="absolute bottom-4 right-4 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors">
                <ZoomIn className="h-5 w-5" />
              </button>

              {/* Navigation Arrows */}
              {mockProduct.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImage((prev) => (prev - 1 + mockProduct.images.length) % mockProduct.images.length)
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImage((prev) => (prev + 1) % mockProduct.images.length)
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-error text-error-foreground">
                  -{discount}%
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors",
                    selectedImage === index ? "border-primary" : "border-transparent hover:border-muted"
                  )}
                >
                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-2xl">
                    🎧
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl font-bold text-primary">{mockProduct.name}</h1>
              <div className="mt-2 flex items-center gap-4">
                <RatingStars rating={mockProduct.rating} showValue />
                <span className="text-sm text-muted-foreground">
                  {mockProduct.reviewCount} reseñas
                </span>
                <span className="text-sm text-muted-foreground">
                  SKU: {mockProduct.sku}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                {formatPrice(mockProduct.price)}
              </span>
              {mockProduct.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(mockProduct.originalPrice)}
                  </span>
                  <Badge variant="secondary" className="bg-error/10 text-error">
                    Ahorras {formatPrice(mockProduct.originalPrice - mockProduct.price)}
                  </Badge>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground">{mockProduct.description}</p>

            <Separator />

            {/* Color Selection */}
            {mockProduct.colors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Color: {mockProduct.colors.find(c => c.value === selectedColor)?.name}</h3>
                <ColorSelector
                  options={mockProduct.colors}
                  value={selectedColor}
                  onChange={setSelectedColor}
                />
              </div>
            )}

            {/* Size Selection */}
            {mockProduct.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Talla</h3>
                  <button className="text-sm text-primary hover:underline">
                    Guía de tallas
                  </button>
                </div>
                <SizeSelector
                  options={mockProduct.sizes}
                  value={selectedSize}
                  onChange={setSelectedSize}
                />
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-semibold mb-3">Cantidad</h3>
              <div className="flex items-center gap-4">
                <QuantitySelector
                  value={quantity}
                  min={1}
                  max={mockProduct.stock}
                  onChange={setQuantity}
                />
                <span className="text-sm text-muted-foreground">
                  {mockProduct.stock} disponibles
                </span>
              </div>
            </div>

            {/* Add to Cart & Buy Now */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Agregar al Carrito
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleBuyNow}
              >
                Comprar Ahora
              </Button>
            </div>

            {/* Wishlist & Share */}
            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Heart className="h-4 w-4" />
                Agregar a favoritos
              </button>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Share2 className="h-4 w-4" />
                Compartir
              </button>
            </div>

            <Separator />

            {/* Value Props */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <Truck className="h-6 w-6 text-mint" />
                <span className="text-xs text-muted-foreground">Envío Gratis</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Shield className="h-6 w-6 text-mint" />
                <span className="text-xs text-muted-foreground">Garantía 1 año</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 text-mint" />
                <span className="text-xs text-muted-foreground">30 días devolución</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Descripción
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Especificaciones
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Reseñas ({mockProduct.reviewCount})
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Envío y Devoluciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose max-w-none">
                <h3>Características principales</h3>
                <ul>
                  {mockProduct.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <div className="grid gap-4">
                {mockProduct.specifications.map((spec, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex justify-between py-3 px-4 rounded-lg",
                      index % 2 === 0 ? "bg-muted/50" : ""
                    )}
                  >
                    <span className="font-medium">{spec.label}</span>
                    <span className="text-muted-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-6">
                {/* Review Summary */}
                <div className="flex items-center gap-6 p-6 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary">{mockProduct.rating}</div>
                    <RatingStars rating={mockProduct.rating} size="lg" />
                    <div className="text-sm text-muted-foreground mt-1">
                      {mockProduct.reviewCount} reseñas
                    </div>
                  </div>
                </div>

                {/* Review List */}
                <div className="space-y-4">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.user}</span>
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {review.helpful} personas encontraron esto útil
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full">
                  Ver todas las reseñas
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="shipping">
                  <AccordionTrigger>Información de Envío</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Envío gratis en pedidos mayores a $999 MXN</li>
                      <li>• Envío estándar: 3-5 días hábiles</li>
                      <li>• Envío express: 1-2 días hábiles (cargo adicional)</li>
                      <li>• Disponible para toda la República Mexicana</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="returns">
                  <AccordionTrigger>Política de Devoluciones</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• 30 días para devoluciones sin costo</li>
                      <li>• Producto debe estar en empaque original</li>
                      <li>• Reembolso en 5-7 días hábiles</li>
                      <li>• Cambios por talla disponibles</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="warranty">
                  <AccordionTrigger>Garantía</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• 1 año de garantía del fabricante</li>
                      <li>• Cubre defectos de fabricación</li>
                      <li>• No cubre daño por mal uso</li>
                      <li>• Servicio técnico autorizado</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-primary mb-6">Productos Relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group bg-white rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-square bg-neutral-100 flex items-center justify-center text-4xl">
                  📦
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-primary group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-1">
                    <RatingStars rating={product.rating} size="sm" />
                  </div>
                  <p className="mt-2 font-bold text-primary">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
