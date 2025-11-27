import { Metadata } from "next";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto | Tienda Online",
  description: "Ponte en contacto con nuestro equipo de soporte",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 text-white md:py-20">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Ponte en Contacto</h1>
          <p className="text-xl text-blue-100">
            Estamos aquí para ayudarte. Contáctanos de cualquier forma que prefieras.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <Mail className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-lg font-bold text-gray-900">Email</h3>
              <p className="text-gray-600">
                <a href="mailto:support@tiendaonline.com" className="text-blue-600 hover:underline">
                  support@tiendaonline.com
                </a>
              </p>
            </div>

            <div className="text-center">
              <Phone className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-lg font-bold text-gray-900">Teléfono</h3>
              <p className="text-gray-600">
                <a href="tel:+5218001234567" className="text-blue-600 hover:underline">
                  +52 (800) 123-4567
                </a>
              </p>
            </div>

            <div className="text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-lg font-bold text-gray-900">Chat en Vivo</h3>
              <p className="text-gray-600">
                Disponible de lunes a viernes, 9:00 - 17:00 (Hora CDMX)
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="mx-auto max-w-2xl rounded-lg bg-gray-50 p-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Envíanos un Mensaje</h2>
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-600"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-600"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-700">
                  Asunto
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-600"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-700">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-600"
                  placeholder="Cuéntanos más sobre tu consulta..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Preguntas Frecuentes
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-bold text-gray-900">¿Cuál es el tiempo de respuesta?</h3>
              <p className="text-sm text-gray-600">
                Respondemos todos los mensajes dentro de 24 horas hábiles.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-bold text-gray-900">¿Ofrecen soporte por teléfono?</h3>
              <p className="text-sm text-gray-600">
                Sí, disponible de lunes a viernes en horario comercial.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-bold text-gray-900">¿Hay soporte en español?</h3>
              <p className="text-sm text-gray-600">
                Por supuesto, todo nuestro equipo habla español e inglés.
              </p>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-bold text-gray-900">¿Cómo reporto un problema?</h3>
              <p className="text-sm text-gray-600">
                Puedes enviar un mensaje aquí o escribir a support@tiendaonline.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
