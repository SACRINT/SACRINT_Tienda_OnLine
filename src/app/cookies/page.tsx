import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies | Tienda Online",
  description: "Información sobre cómo utilizamos cookies en nuestra plataforma",
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-white">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Política de Cookies</h1>

        <div className="prose prose-lg space-y-6 text-gray-700">
          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando
              visitas un sitio web. Nos ayudan a recordar información sobre tu visita, como tus
              preferencias y configuración.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              Tipos de cookies que usamos
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-bold text-gray-900">Cookies Esenciales</h3>
                <p>
                  Necesarias para el funcionamiento básico del sitio, como autenticación y
                  seguridad. No se pueden desactivar sin afectar la funcionalidad.
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-bold text-gray-900">Cookies de Rendimiento</h3>
                <p>
                  Nos ayudan a entender cómo los usuarios interactúan con el sitio mediante análisis
                  anónimos. Mejoran la experiencia del usuario.
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-bold text-gray-900">Cookies Funcionales</h3>
                <p>
                  Recuerdan tus preferencias y configuración para personalizar tu experiencia.
                  Puedes desactivarlas sin problemas.
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-bold text-gray-900">Cookies de Marketing</h3>
                <p>
                  Utilizadas para rastrear comportamiento de navegación y mostrar anuncios
                  relevantes. Requieren consentimiento previo.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              Cómo controlar las cookies
            </h2>
            <p>
              Puedes controlar y eliminar las cookies en la configuración de tu navegador. Aquí te
              mostramos cómo hacerlo en los navegadores más populares:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>
                <strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies
              </li>
              <li>
                <strong>Firefox:</strong> Opciones → Privacidad → Historial
              </li>
              <li>
                <strong>Safari:</strong> Preferencias → Privacidad → Administrar datos de sitios web
              </li>
              <li>
                <strong>Edge:</strong> Configuración → Privacidad → Borrar datos de exploración
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">Cambios en esta política</h2>
            <p>
              Nos reservamos el derecho de actualizar esta política de cookies en cualquier momento.
              Cualquier cambio será publicado en esta página con la fecha de última actualización.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra política de cookies, por favor{" "}
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
