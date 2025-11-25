"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Qué es Tienda Online?",
    answer:
      "Tienda Online es una plataforma SaaS (Software as a Service) que te permite crear y gestionar tu propia tienda en línea de manera fácil y rápida, sin necesidad de conocimientos técnicos.",
  },
  {
    question: "¿Necesito conocimiento técnico?",
    answer:
      "No. Nuestra plataforma está diseñada para ser intuitiva y fácil de usar. Puedes personalizar tu tienda, agregar productos y empezar a vender en minutos.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Ofrecemos diferentes planes que se adaptan a tus necesidades, desde un plan 'Starter' para quienes comienzan hasta planes 'Enterprise' para grandes negocios. Puedes ver todos los detalles en nuestra sección de precios.",
  },
  {
    question: "¿Puedo cambiar de plan?",
    answer:
      "Sí, puedes cambiar de plan en cualquier momento desde tu panel de administración. El cambio se aplicará en tu siguiente ciclo de facturación.",
  },
  {
    question: "¿Qué métodos de pago soportan?",
    answer:
      "Integramos los procesadores de pago más seguros y populares, como Stripe y Mercado Pago, permitiéndote aceptar tarjetas de crédito, débito y otros métodos locales.",
  },
  {
    question: "¿Cómo obtengo mis ganancias?",
    answer:
      "Tus ganancias se depositan directamente en tu cuenta bancaria conectada a través de nuestros procesadores de pago. Puedes gestionar tus pagos y transferencias desde tu panel.",
  },
  {
    question: "¿Hay comisión por transacción?",
    answer:
      "Además del costo de tu plan, aplicamos una pequeña comisión por transacción que varía según el plan que elijas. Esta información es transparente y está detallada en nuestra página de precios.",
  },
  {
    question: "¿Puedo usar mi dominio personalizado?",
    answer:
      "¡Sí! Todos nuestros planes de pago te permiten conectar tu propio dominio (ej. www.mitienda.com) para reforzar tu marca.",
  },
  {
    question: "¿Qué pasa si cancelo?",
    answer:
      "Puedes cancelar tu suscripción en cualquier momento. Tu tienda permanecerá activa hasta el final de tu ciclo de facturación actual. No hay contratos a largo plazo.",
  },
  {
    question: "¿Dónde obtengo soporte?",
    answer:
      "Ofrecemos soporte 24/7 a través de email y chat en vivo. Los planes 'Professional' y 'Enterprise' cuentan con soporte prioritario para una atención más rápida.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="bg-white text-gray-800">
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:py-12 sm:px-6 lg:py-16 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Preguntas Frecuentes</h2>
          <p className="mt-4 text-gray-600">
            Aquí encontrarás respuestas a las preguntas más comunes sobre nuestra plataforma.
          </p>
        </div>

        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
