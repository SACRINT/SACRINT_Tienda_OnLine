import { Metadata } from "next";
import { Shield, Lock, CheckCircle, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Seguridad | Tienda Online",
  description: "Conoce las medidas de seguridad que protegen tu tienda y tus clientes",
};

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Encriptación SSL/TLS",
      description:
        "Todas las conexiones están encriptadas con certificados SSL de grado empresarial",
    },
    {
      icon: Lock,
      title: "PCI DSS Nivel 1",
      description: "Cumplimiento con el estándar más alto de seguridad para pagos con tarjeta",
    },
    {
      icon: CheckCircle,
      title: "Autenticación de Dos Factores",
      description: "Protege tu cuenta con autenticación en dos factores opcional",
    },
    {
      icon: AlertCircle,
      title: "Monitoreo 24/7",
      description: "Sistema de detección de fraude y anomalías en tiempo real",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 text-white md:py-20">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Seguridad en Tienda Online</h1>
          <p className="max-w-2xl text-xl text-blue-100">
            Tu seguridad y la de tus clientes es nuestra máxima prioridad. Implementamos medidas de
            protección de nivel bancario.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-3xl font-bold text-gray-900">Características de Seguridad</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="rounded-lg bg-gray-50 p-6">
                  <div className="flex items-start gap-4">
                    <Icon className="h-8 w-8 flex-shrink-0 text-blue-600" />
                    <div>
                      <h3 className="mb-2 text-lg font-bold text-gray-900">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">Cumplimientos y Certificaciones</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-bold text-gray-900">PCI DSS Nivel 1</h3>
              <p className="text-sm text-gray-600">
                Cumplimiento con el estándar de seguridad más alto para procesamiento de tarjetas de
                crédito
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-bold text-gray-900">GDPR Compliant</h3>
              <p className="text-sm text-gray-600">
                Protección de datos personales conforme a regulaciones europeas
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-bold text-gray-900">ISO 27001</h3>
              <p className="text-sm text-gray-600">
                Certificación internacional de gestión de seguridad de información
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Security Team */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">¿Preguntas sobre Seguridad?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-gray-600">
            Si tienes preguntas sobre seguridad o necesitas reportar una vulnerabilidad, contacta a
            nuestro equipo de seguridad.
          </p>
          <a
            href="/contact"
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Contactar Equipo de Seguridad
          </a>
        </div>
      </section>
    </main>
  );
}
