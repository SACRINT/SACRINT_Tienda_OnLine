import { FeaturesSection } from "@/app/components/home/FeaturesSection";
import { CTASection } from "@/app/components/home/CTASection";
import Image from "next/image";
import {
    ShieldCheck,
    CreditCard,
    BarChart,
    Settings,
    Mail,
    Rocket,
  } from "lucide-react";

const detailedFeatures = [
    {
      name: "Fácil de usar",
      description: "Nuestra plataforma está diseñada con una interfaz de arrastrar y soltar que te permite personalizar tu tienda sin escribir una sola línea de código. Desde la configuración inicial hasta la gestión diaria de productos y pedidos, cada paso es intuitivo y está guiado. Ofrecemos plantillas prediseñadas y un editor visual para que tu tienda luzca profesional en minutos.",
      icon: Rocket,
      image: "https://picsum.photos/800/400?random=1",
      useCases: ["Emprendedores sin experiencia técnica.", "Negocios que necesitan lanzar rápidamente.", "Diseñadores que quieren control visual."]
    },
    {
      name: "100% Seguro",
      description: "La seguridad es nuestra máxima prioridad. Cumplimos con el estándar PCI DSS Nivel 1 para proteger todos los datos de pago. Además, todas las tiendas cuentan con certificado SSL gratuito, protección contra ataques DDoS y firewalls de aplicación web (WAF) para garantizar que tu negocio y tus clientes estén siempre seguros.",
      icon: ShieldCheck,
      image: "https://picsum.photos/800/400?random=2",
      useCases: ["Tiendas que manejan información sensible.", "Negocios que buscan generar confianza.", "Cualquier tienda que procese pagos en línea."]
    },
    {
      name: "Pagos integrados",
      description: "Conecta tu cuenta de Stripe o Mercado Pago en segundos y comienza a aceptar pagos con tarjetas de crédito, débito y métodos de pago locales. Nuestro checkout optimizado reduce la fricción y aumenta la conversión, guardando de forma segura los métodos de pago para compras futuras.",
      icon: CreditCard,
      image: "https://picsum.photos/800/400?random=3",
      useCases: ["Ventas internacionales.", "Tiendas que apuntan al mercado latinoamericano.", "Negocios que buscan una alta tasa de conversión."]
    },
    {
      name: "Analytics",
      description: "Toma decisiones basadas en datos con nuestro panel de análisis. Monitorea tus ventas, el valor promedio de los pedidos, la tasa de conversión y los productos más populares en tiempo real. Identifica tendencias, comprende el comportamiento de tus clientes y optimiza tus estrategias de marketing.",
      icon: BarChart,
      image: "https://picsum.photos/800/400?random=4",
      useCases: ["Gerentes de e-commerce.", "Equipos de marketing.", "Emprendedores que buscan crecer."]
    },
    {
      name: "SEO optimizado",
      description: "Atrae más clientes desde los motores de búsqueda. Nuestra plataforma genera automáticamente sitemaps, URLs amigables y meta tags optimizadas. Tendrás control total sobre los títulos, descripciones y palabras clave de cada producto para maximizar tu visibilidad en Google.",
      icon: Settings,
      image: "https://picsum.photos/800/400?random=5",
      useCases: ["Negocios que dependen del tráfico orgánico.", "Tiendas en nichos competitivos.", "Marketing de contenidos."]
    },
    {
      name: "Soporte 24/7",
      description: "Nunca estarás solo. Nuestro equipo de soporte global está disponible 24/7 a través de email y chat en vivo para resolver cualquier duda o problema que puedas tener. Los planes superiores incluyen soporte prioritario y un gerente de cuenta dedicado para asegurar tu éxito.",
      icon: Mail,
      image: "https://picsum.photos/800/400?random=6",
      useCases: ["Usuarios que necesitan ayuda inmediata.", "Negocios en crecimiento.", "Operaciones de misión crítica."]
    },
];

export default function FeaturesPage() {
  return (
    <div>
        <section className="bg-gray-900 text-white">
            <div className="mx-auto max-w-screen-xl px-4 py-32 text-center">
                <h1 className="text-4xl font-extrabold sm:text-6xl">
                    Todo lo que necesitas para tener éxito
                </h1>
                <p className="mt-4 text-lg text-gray-300">
                    Desde la creación de tu tienda hasta el marketing y la analítica, tenemos las herramientas para ti.
                </p>
            </div>
        </section>

        <FeaturesSection />

        <section className="py-16 bg-white">
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
                <div className="space-y-16">
                    {detailedFeatures.map((feature, index) => (
                        <div key={feature.name} className={`flex flex-col gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                            <div className="md:w-1/2">
                                <div className="flex items-center gap-4">
                                    <feature.icon className="h-10 w-10 text-blue-600" />
                                    <h3 className="text-3xl font-bold text-gray-900">{feature.name}</h3>
                                </div>
                                <p className="mt-4 text-gray-600">{feature.description}</p>
                                <div className="mt-6">
                                    <h4 className="font-semibold">Casos de uso:</h4>
                                    <ul className="mt-2 space-y-1 text-sm text-gray-500 list-disc list-inside">
                                        {feature.useCases.map(useCase => <li key={useCase}>{useCase}</li>)}
                                    </ul>
                                </div>
                            </div>
                            <div className="md:w-1/2">
                                <Image 
                                    src={feature.image} 
                                    alt={feature.name}
                                    width={800}
                                    height={400}
                                    className="rounded-lg shadow-lg object-cover"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
        
        <CTASection />
    </div>
  );
}
