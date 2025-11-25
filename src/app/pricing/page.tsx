import { PricingSection } from "@/app/components/home/PricingSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check } from "lucide-react";
import Link from "next/link";

const pricingFaqs = [
    {
        question: "¿Hay un período de prueba gratuito?",
        answer: "Sí, todos nuestros planes incluyen un período de prueba de 14 días sin necesidad de tarjeta de crédito. Podrás probar todas las funcionalidades del plan que elijas."
    },
    {
        question: "¿Qué pasa si excedo los límites de mi plan?",
        answer: "Te notificaremos cuando te acerques a los límites de tu plan. Si los excedes, te sugeriremos amablemente que actualices al siguiente plan para continuar sin interrupciones."
    },
    {
        question: "¿Cómo funciona la facturación anual?",
        answer: "Al elegir la facturación anual, pagas por 12 meses por adelantado y recibes un descuento significativo. Tu plan se renovará automáticamente cada año a menos que lo canceles."
    },
    {
        question: "¿Puedo obtener un reembolso?",
        answer: "Ofrecemos una política de reembolso de 30 días sin preguntas para todos nuestros planes. Si no estás satisfecho, te devolvemos tu dinero."
    }
];

const features = [
    { name: 'Productos', starter: '100', pro: 'Ilimitados', enterprise: 'Ilimitados' },
    { name: 'Usuarios', starter: '1', pro: '5', enterprise: 'Ilimitado' },
    { name: 'Análisis avanzado', starter: false, pro: true, enterprise: true },
    { name: 'Soporte prioritario', starter: false, pro: true, enterprise: true },
    { name: 'Acceso a API', starter: false, pro: false, enterprise: true },
    { name: 'Onboarding dedicado', starter: false, pro: false, enterprise: true },
    { name: 'Dominio personalizado', starter: true, pro: true, enterprise: true },
    { name: 'Comisión por transacción', starter: '5%', pro: '2%', enterprise: '0%' },
];


export default function PricingPage() {
  return (
    <div>
      <PricingSection />

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Compara nuestros planes
          </h2>
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
              <thead className="text-left">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Feature</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Starter</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Professional</th>
                  <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Enterprise</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {features.map((feature) => (
                  <tr key={feature.name}>
                    <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">{feature.name}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {typeof feature.starter === 'boolean' ? (feature.starter ? <Check className="text-green-500"/> : '-') : feature.starter}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {typeof feature.pro === 'boolean' ? (feature.pro ? <Check className="text-green-500"/> : '-') : feature.pro}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                        {typeof feature.enterprise === 'boolean' ? (feature.enterprise ? <Check className="text-green-500"/> : '-') : feature.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-lg text-center">
                <h2 className="text-3xl font-bold sm:text-4xl">Preguntas Frecuentes de Precios</h2>
            </div>
            <div className="mt-8">
                <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
                    {pricingFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-screen-xl px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900">¿Necesitas algo más?</h2>
            <p className="mt-4 text-gray-600">
                Nuestro plan Enterprise es totalmente personalizable. Contáctanos para una cotización a tu medida.
            </p>
            <div className="mt-8">
                <Link
                    href="/contact"
                    className="inline-block rounded-lg bg-blue-600 px-12 py-3 text-sm font-medium text-white shadow hover:bg-blue-700"
                >
                    Contactar Ventas
                </Link>
            </div>
        </div>
      </section>
    </div>
  );
}
