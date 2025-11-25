"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import analytics from "@/lib/analytics/events";
import { ProductCard } from "@/app/components/shop/ProductCard";

// Dummy Product Data
const dummyProduct = {
  id: "1",
  name: "Laptop Gamer Ultimate Pro 2025",
  description:
    "La Laptop Gamer Ultimate Pro 2025 es la máquina definitiva para los entusiastas de los videojuegos y profesionales creativos. Equipada con el último procesador Intel i9, 32GB de RAM DDR5 y una tarjeta gráfica NVIDIA RTX 4090, ofrece un rendimiento sin precedentes. Su pantalla QHD de 17 pulgadas con 240Hz de refresco te sumerge en cada detalle. Ideal para juegos AAA, edición de video 8K y modelado 3D.",
  longDescription: `
    Sumérgete en una experiencia de juego inigualable con la Laptop Gamer Ultimate Pro 2025. 
    Diseñada para superar los límites, esta potente estación de trabajo móvil combina una estética elegante 
    con una ingeniería de vanguardia. Cada componente ha sido seleccionado meticulosamente para ofrecer 
    el máximo rendimiento y fiabilidad. Disfruta de sesiones de juego fluidas y sin interrupciones, 
    edita contenido multimedia con una rapidez asombrosa y ejecuta aplicaciones exigentes 
    con total confianza. Su avanzado sistema de refrigeración asegura que la máquina 
    mantenga un rendimiento óptimo incluso bajo cargas extremas.
    <br/><br/>
    El teclado retroiluminado RGB personalizable y el touchpad de precisión 
    complementan una experiencia de usuario superior. La batería de larga duración te permite 
    llevar tu creatividad y tus juegos a cualquier lugar sin preocupaciones. 
    Conéctate a tus periféricos favoritos a través de una amplia gama de puertos, 
    incluyendo Thunderbolt 4, USB-C, y HDMI 2.1.
  `,
  sku: "LPTG-ULT-PRO-2025",
  price: 2800.0,
  originalPrice: 3500.0,
  images: [
    "https://picsum.photos/800/600?random=11",
    "https://picsum.photos/800/600?random=12",
    "https://picsum.photos/800/600?random=13",
    "https://picsum.photos/800/600?random=14",
  ],
  category: "Electrónica",
  rating: 4.9,
  reviewCount: 250,
  stock: 15,
  slug: "laptop-gamer-ultimate-pro-2025",
  specifications: [
    { name: "Procesador", value: "Intel Core i9-14900HX" },
    { name: "RAM", value: "32GB DDR5 5600MHz" },
    { name: "Almacenamiento", value: "2TB NVMe SSD PCIe Gen5" },
    { name: "Tarjeta Gráfica", value: "NVIDIA GeForce RTX 4090 (16GB GDDR6)" },
    { name: "Pantalla", value: "17'' QHD (2560x1440) IPS 240Hz" },
    { name: "Sistema Operativo", value: "Windows 11 Pro" },
  ],
};

// Dummy Reviews
const dummyReviews = [
  {
    author: "Juan Pérez",
    date: "15/11/2025",
    rating: 5,
    title: "¡Impresionante!",
    content: "La mejor laptop que he tenido, corre todo sin problemas. La pantalla es una locura.",
    helpful: 5,
  },
  {
    author: "María López",
    date: "10/11/2025",
    rating: 4,
    title: "Muy buena, pero pesada",
    content: "Excelente rendimiento, pero es un poco más pesada de lo que esperaba para transportar.",
    helpful: 3,
  },
  {
    author: "Pedro Gómez",
    date: "01/11/2025",
    rating: 5,
    title: "Perfecta para diseño",
    content: "Uso software de diseño 3D y esta máquina no me decepciona. Rápida y eficiente.",
    helpful: 7,
  },
];

// Dummy Related Products
const relatedProducts = [
    {
        id: "2",
        name: "Teclado Mecánico RGB",
        price: 80,
        image: "https://picsum.photos/400/300?random=2",
        rating: 4.8,
        reviewCount: 45,
        isNew: false,
        isSale: false,
        stock: 10,
        slug: "teclado-mecanico-rgb",
    },
    {
        id: "3",
        name: "Mouse Inalámbrico Ergonómico",
        price: 35,
        image: "https://picsum.photos/400/300?random=3",
        rating: 4.2,
        reviewCount: 80,
        isNew: false,
        isSale: true,
        stock: 20,
        slug: "mouse-inalambrico-ergonomico",
    },
    {
        id: "4",
        name: "Monitor Curvo 27 pulgadas",
        price: 300,
        image: "https://picsum.photos/400/300?random=4",
        rating: 4.7,
        reviewCount: 60,
        isNew: true,
        isSale: false,
        stock: 5,
        slug: "monitor-curvo-27-pulgadas",
    },
    {
        id: "5",
        name: "Auriculares Gaming Pro",
        price: 95,
        image: "https://picsum.photos/400/300?random=5",
        rating: 4.6,
        reviewCount: 90,
        isNew: false,
        isSale: true,
        stock: 15,
        slug: "auriculares-gaming-pro",
    },
];

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // In a real app, fetch product by slug
  // If no product is found, call notFound() from next/navigation
  // import { notFound } from 'next/navigation';
  // if (!product) {
  //   notFound();
  // }
  const product = dummyProduct; // Using dummy product for now
  const isOutOfStock = product.stock === 0;
  const discountPercentage = product.originalPrice
    ? ((product.originalPrice - product.price) / product.originalPrice) * 100
    : 0;

  const [mainImage, setMainImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    analytics.trackProductView({
      id: product.id,
      name: product.name,
      price: product.price,
    });
  }, [product]);

  const handleAddToCart = () => {
    analytics.trackAddToCart({ id: product.id, name: product.name, price: product.price }, quantity);
    // Here you would also add the product to the cart state
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Product Image Gallery */}
        <div>
          <div className="relative h-96 w-full overflow-hidden rounded-lg lg:h-[32rem]">
            <Image
              src={mainImage}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="object-cover"
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {product.images.map((img, index) => (
              <div
                key={index}
                className={`relative h-20 w-full cursor-pointer overflow-hidden rounded-lg border-2 ${
                  mainImage === img ? "border-blue-500" : "border-gray-200"
                }`}
                onClick={() => setMainImage(img)}
              >
                <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} layout="fill" objectFit="cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Information and Actions */}
        <div className="mt-8 lg:mt-0">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="mt-2 flex items-center">
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating || 0) ? "fill-current" : ""
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              ({product.reviewCount} Reviews) -{" "}
              <Link href="#reviews" className="text-blue-600 hover:underline">
                Ver todos
              </Link>
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">SKU: {product.sku}</p>
          <p className="text-sm text-gray-500">
            Categoría:{" "}
            <Link href={`/shop?category=${product.category.toLowerCase()}`} className="text-blue-600 hover:underline">
              {product.category}
            </Link>
          </p>

          <div className="mt-4 flex items-baseline gap-2">
            {product.originalPrice && (
              <span className="text-xl text-gray-500 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-3xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {discountPercentage > 0 && (
              <span className="ml-2 rounded-full bg-green-500 px-3 py-1 text-sm font-semibold text-white">
                -{discountPercentage.toFixed(0)}%
              </span>
            )}
          </div>

          <p className="mt-4 text-sm font-semibold">
            Disponibilidad:{" "}
            {isOutOfStock ? (
              <span className="text-red-600">Agotado</span>
            ) : (
              <span className="text-green-600">{product.stock} en stock</span>
            )}
          </p>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-900">Descripción</h3>
            <div
              className="mt-2 text-gray-700"
              dangerouslySetInnerHTML={{ __html: product.longDescription }}
            />
          </div>

          {product.specifications && product.specifications.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900">Especificaciones</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {product.specifications.map((spec, index) => (
                  <li key={index}>
                    <span className="font-medium">{spec.name}:</span> {spec.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-gray-300">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="p-2 text-gray-600 hover:bg-gray-100"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.min(product.stock, Math.max(1, Number(e.target.value))))
                }
                className="w-16 border-x border-gray-300 text-center text-gray-900 focus:outline-none"
                min="1"
                max={product.stock}
                readOnly
              />
              <button
                onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
                className="p-2 text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
            </div>

            <button
              className={`flex-1 rounded-lg px-6 py-3 text-lg font-semibold text-white transition-colors ${
                isOutOfStock
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 inline-block h-5 w-5" />
              {isOutOfStock ? "Agotado" : "Añadir al Carrito"}
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Heart className="h-4 w-4" /> Añadir a Favoritos
            </button>
            <button className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Share2 className="h-4 w-4" /> Compartir
            </button>
          </div>
        </div>
      </div>

      {/* Product Reviews Section */}
      <div id="reviews" className="mt-16 border-t border-gray-200 pt-16">
        <h2 className="text-3xl font-bold text-gray-900">Opiniones de Clientes</h2>
        <div className="mt-8 space-y-8">
          {dummyReviews.map((review, index) => (
            <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-semibold text-gray-900">{review.author}</span>
                  <span className="mx-2 text-gray-400">-</span>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? "fill-current" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">{review.title}</h3>
              <p className="mt-1 text-gray-700">{review.content}</p>
              <div className="mt-2 text-sm text-gray-500">
                ¿Fue útil esta opinión? ({review.helpful})
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="#all-reviews" className="text-blue-600 hover:underline">
            Ver todas las {product.reviewCount} opiniones
          </Link>
          <p className="mt-4 text-gray-600">
            ¿Compraste este producto?{" "}
            <Link href="#submit-review" className="font-semibold text-blue-600 hover:underline">
              Deja tu opinión
            </Link>
          </p>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-16 border-t border-gray-200 pt-16">
        <h2 className="text-3xl font-bold text-gray-900">Productos Relacionados</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {relatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
