"use client";

import { useCart } from "@/lib/store/useCart";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Dummy data for related products
const relatedProducts = [
    {
        id: "4",
        name: "Monitor Curvo 27 pulgadas",
        price: 300,
        image: "https://picsum.photos/400/300?random=4",
        slug: "monitor-curvo-27-pulgadas",
    },
    {
        id: "6",
        name: "Webcam Full HD 1080p",
        price: 50,
        image: "https://picsum.photos/400/300?random=6",
        slug: "webcam-full-hd-1080p",
    },
];


export default function CartPage() {
  const { items, updateQuantity, removeItem, itemCount, subtotal, tax, shipping, total } = useCart();

  // Dummy data for now, will be replaced with real cart data
  const dummyCartItems = [
    {
        productId: "1",
        name: "Laptop Gamer X1",
        price: 1200,
        image: "https://picsum.photos/400/300?random=1",
        quantity: 1,
        slug: "laptop-gamer-x1",
        variantId: null
      },
      {
        productId: "3",
        name: "Mouse Inalámbrico Ergonómico",
        price: 35,
        image: "https://picsum.photos/400/300?random=3",
        quantity: 2,
        slug: "mouse-inalambrico-ergonomico",
        variantId: null
      },
  ];

  const currentItems = items.length > 0 ? items : dummyCartItems;
  const cartSubtotal = subtotal();
  const cartTax = tax();
  const cartShipping = shipping();
  const cartTotal = total();


  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
        Tu Carrito de Compras
      </h1>

      <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        <section aria-labelledby="cart-heading" className="lg:col-span-7">
          <h2 id="cart-heading" className="sr-only">
            Items en tu carrito de compras
          </h2>

          <ul role="list" className="divide-y divide-gray-200 border-b border-t border-gray-200">
            {currentItems.map((item) => (
              <li key={item.productId + (item.variantId || '')} className="flex py-6 sm:py-10">
                <div className="flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={100}
                    height={100}
                    className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
                  />
                </div>

                <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-sm">
                          <Link href={`/producto/${item.slug}`} className="font-medium text-gray-700 hover:text-gray-800">
                            {item.name}
                          </Link>
                        </h3>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-900">${item.price.toFixed(2)}</p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9">
                      <div className="flex items-center rounded border border-gray-300">
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)} disabled={item.quantity <= 1}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="absolute right-0 top-0">
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId, item.variantId)}>
                          <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Order summary */}
        <section
          aria-labelledby="summary-heading"
          className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
        >
          <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
            Resumen del pedido
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">Subtotal</dt>
              <dd className="text-sm font-medium text-gray-900">${cartSubtotal.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="flex items-center text-sm text-gray-600">
                <span>Envío estimado</span>
              </dt>
              <dd className="text-sm font-medium text-gray-900">${cartShipping.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-sm text-gray-600">Impuestos estimados</dt>
              <dd className="text-sm font-medium text-gray-900">${cartTax.toFixed(2)}</dd>
            </div>

            <div className="mt-6 space-y-2">
                <label htmlFor="coupon" className="text-sm font-medium text-gray-900">Cupón de Descuento</label>
                <div className="flex space-x-2">
                    <Input type="text" id="coupon" placeholder="Ingresa tu cupón" className="flex-grow" />
                    <Button variant="outline">Aplicar</Button>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-medium text-gray-900">Total del pedido</dt>
              <dd className="text-base font-medium text-gray-900">${cartTotal.toFixed(2)}</dd>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/checkout">
              <Button className="w-full">Proceder al Pago</Button>
            </Link>
          </div>
          <div className="mt-4 text-center text-sm">
            <Link href="/shop" className="font-medium text-blue-600 hover:text-blue-500">
              Continuar Comprando
            </Link>
          </div>
        </section>
      </div>

      {/* Related Products */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900">También te podría interesar</h2>
        <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {relatedProducts.map(product => (
                <div key={product.id} className="group relative">
                    <div className="min-h-80 aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75 lg:aspect-none lg:h-80">
                        <Image src={product.image} alt={product.name} layout="fill" objectFit="cover" />
                    </div>
                    <div className="mt-4 flex justify-between">
                        <div>
                            <h3 className="text-sm text-gray-700">
                                <Link href={`/producto/${product.slug}`}>
                                    <span aria-hidden="true" className="absolute inset-0" />
                                    {product.name}
                                </Link>
                            </h3>
                        </div>
                        <p className="text-sm font-medium text-gray-900">${product.price.toFixed(2)}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}