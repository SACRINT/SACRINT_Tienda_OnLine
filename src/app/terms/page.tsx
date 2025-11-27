import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Tienda Online",
  description: "Términos legales de uso de nuestra plataforma",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Términos y Condiciones</h1>

        <div className="prose prose-lg space-y-6 text-gray-700">
          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              1. Aceptación de Términos
            </h2>
            <p>
              Al acceder y utilizar esta plataforma, aceptas estos términos y condiciones en su
              totalidad. Si no estás de acuerdo con alguna parte de estos términos, por favor no
              utilices nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">2. Uso de la Plataforma</h2>
            <p>
              Te comprometes a utilizar esta plataforma solo para propósitos legales y de acuerdo
              con estos términos. No debe:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Utilizar la plataforma para actividades ilícitas</li>
              <li>Infringir derechos de terceros</li>
              <li>Transmitir malware o virus</li>
              <li>Intentar obtener acceso no autorizado</li>
              <li>Acosar o dañar a otros usuarios</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">3. Cuentas de Usuario</h2>
            <p>
              Eres responsable de mantener la confidencialidad de tu contraseña y por toda actividad
              que ocurra en tu cuenta. Debes notificarnos inmediatamente de cualquier acceso no
              autorizado.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">4. Propiedad Intelectual</h2>
            <p>
              Todo contenido en esta plataforma, incluyendo texto, gráficos, logos, imágenes y
              software, es propiedad de Tienda Online o sus proveedores de contenido y está
              protegido por leyes de derechos de autor.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              5. Limitación de Responsabilidad
            </h2>
            <p>Tienda Online no será responsable por:</p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Daños indirectos o incidentales</li>
              <li>Pérdida de datos o ganancias</li>
              <li>Interrupciones del servicio</li>
              <li>Daños causados por terceros</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">6. Transacciones y Pagos</h2>
            <p>
              Todas las transacciones deben ser acuerdos legales entre el comprador y el vendedor.
              Tienda Online actúa solo como intermediario y no es parte de la transacción.
            </p>
            <p className="mt-4">
              Los pagos se procesan a través de proveedores de pagos seguros. Aceptas los términos
              de estos proveedores de pago al realizar una transacción.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              7. Políticas de Devolución
            </h2>
            <p>
              Las políticas de devolución son determinadas por los vendedores individuales. Por
              favor revisa la política específica antes de realizar una compra.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              8. Suspensión y Terminación
            </h2>
            <p>Nos reservamos el derecho de suspender o terminar tu cuenta si:</p>
            <ul className="mt-4 list-inside list-disc space-y-2">
              <li>Violas estos términos</li>
              <li>Incurres en actividad fraudulenta</li>
              <li>Realizas transacciones ilegales</li>
              <li>Amenazas o acosas a otros usuarios</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">
              9. Cambios en los Términos
            </h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los
              cambios entran en vigencia inmediatamente. Tu uso continuado de la plataforma
              constituye aceptación de los términos modificados.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">10. Ley Aplicable</h2>
            <p>
              Estos términos se rigen por las leyes de México y estás de acuerdo en someterse a la
              jurisdicción exclusiva de los tribunales mexicanos.
            </p>
          </section>

          <section>
            <h2 className="mb-4 mt-8 text-2xl font-bold text-gray-900">11. Contacto</h2>
            <p>
              Si tienes preguntas sobre estos términos, por favor{" "}
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
