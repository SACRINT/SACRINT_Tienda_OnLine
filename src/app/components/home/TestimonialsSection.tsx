"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana García",
    store: "Electrónica García",
    quote:
      "La plataforma es increíblemente fácil de usar. Pude lanzar mi tienda en un solo día y las ventas comenzaron a llegar de inmediato.",
    rating: 5,
    image: "https://picsum.photos/100/100?random=1",
  },
  {
    name: "Carlos Rodriguez",
    store: "Moda Urbana",
    quote:
      "El sistema de análisis me ha dado una visión clara de mis productos más vendidos, permitiéndome optimizar mi inventario.",
    rating: 5,
    image: "https://picsum.photos/100/100?random=2",
  },
  {
    name: "Luisa Fernandez",
    store: "Joyería Fina",
    quote:
      "La seguridad en los pagos es mi prioridad, y con Stripe y Mercado Pago integrados, duermo tranquila sabiendo que todo está protegido.",
    rating: 5,
    image: "https://picsum.photos/100/100?random=3",
  },
  {
    name: "Javier Martinez",
    store: "Libros del Saber",
    quote:
      "El soporte técnico es excepcional. Respondieron a mis dudas en minutos, incluso de madrugada. ¡Totalmente recomendado!",
    rating: 5,
    image: "https://picsum.photos/100/100?random=4",
  },
  {
    name: "Sofia Lopez",
    store: "Delicias Caseras",
    quote:
      "Gracias a las herramientas de SEO, mi tienda aparece en la primera página de Google. ¡Mi tráfico se ha triplicado!",
    rating: 5,
    image: "https://picsum.photos/100/100?random=5",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-gray-50 text-gray-800">
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Lo que dicen nuestros clientes
        </h2>

        <div className="mt-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-4">
                    <div className="flex h-full flex-col justify-between rounded-lg bg-white p-6 shadow-sm">
                      <div>
                        <div className="flex gap-0.5 text-yellow-500">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-current" />
                          ))}
                        </div>
                        <div className="mt-4">
                          <p className="text-lg font-medium text-gray-900">
                            {testimonial.quote}
                          </p>
                        </div>
                      </div>
                      <footer className="mt-8">
                        <div className="flex items-center gap-4">
                          <Image
                            alt={testimonial.name}
                            src={testimonial.image}
                            width={56}
                            height={56}
                            className="rounded-full object-cover"
                          />
                          <div>
                            <p className="text-lg font-medium text-gray-900">{testimonial.name}</p>
                            <p className="text-sm text-gray-500">{testimonial.store}</p>
                          </div>
                        </div>
                      </footer>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
