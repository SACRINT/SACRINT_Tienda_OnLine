import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Tienda Online",
  description: "Cómo protegemos y usamos tus datos personales",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Política de Privacidad</h1>

        <div className="prose prose-lg space-y-6 text-gray-700">
          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              1. Información que Recopilamos
            </h2>
            <p>Recopilamos información que nos proporcionas directamente, como:</p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Nombre completo y datos de contacto</li>
              <li>Dirección de correo electrónico</li>
              <li>Información de pago</li>
              <li>Dirección de envío</li>
              <li>Información del perfil de usuario</li>
              <li>Historial de compras</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              2. Cómo Usamos Tu Información
            </h2>
            <p>Utilizamos la información que recopilamos para:</p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Procesar transacciones y envíos</li>
              <li>Mejorar nuestros servicios</li>
              <li>Enviar actualizaciones y comunicaciones</li>
              <li>Cumplir con obligaciones legales</li>
              <li>Prevenir fraude y abuso</li>
              <li>Personalizar tu experiencia</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">3. Protección de Datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger
              tus datos personales contra acceso no autorizado, alteración, divulgación o
              destrucción.
            </p>
            <p>
              Utilizamos encriptación SSL/TLS de 256 bits para todas las transmisiones de datos
              sensibles.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">4. Compartir Información</h2>
            <p>
              No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto
              en los siguientes casos:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Con proveedores de servicios necesarios para operar nuestro negocio</li>
              <li>Cuando requiere la ley</li>
              <li>Para proteger nuestros derechos y seguridad</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">5. Tus Derechos</h2>
            <p>Tienes derecho a:</p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Acceder a tus datos personales</li>
              <li>Corregir datos incorrectos</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Oponerme al procesamiento de datos</li>
              <li>Portabilidad de datos</li>
            </ul>
            <p className="mt-4">
              Para ejercer estos derechos,{" "}
              <a href="/contact" className="text-blue-600 hover:underline">
                contáctanos
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">6. Retención de Datos</h2>
            <p>
              Retendemos tus datos personales solo por el tiempo necesario para proporcionar
              nuestros servicios y cumplir con obligaciones legales. Después, los eliminaremos de
              manera segura.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              7. Cambios en esta Política
            </h2>
            <p>
              Podemos actualizar esta política de privacidad ocasionalmente. Los cambios serán
              publicados en esta página con la fecha de última actualización. Te recomendamos
              revisar esta política periódicamente.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">8. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política de privacidad o nuestras prácticas de
              privacidad, por favor{" "}
              <a href="/contact" className="text-blue-600 hover:underline">
                contáctanos
              </a>
              .
            </p>
          </section>

          <p className="mt-8 border-t pt-8 text-sm text-gray-500">
            Última actualización: 23 de Noviembre, 2025
          </p>
        </div>
      </article>
    </main>
  );
}
