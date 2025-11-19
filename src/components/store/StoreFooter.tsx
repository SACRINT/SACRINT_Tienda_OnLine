import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  shop: [
    { name: "Todos los Productos", href: "/shop" },
    { name: "Nuevos Ingresos", href: "/shop?sort=newest" },
    { name: "Ofertas", href: "/shop?sale=true" },
    { name: "Más Vendidos", href: "/shop?sort=popular" },
  ],
  categories: [
    { name: "Electrónica", href: "/categories/electronica" },
    { name: "Ropa", href: "/categories/ropa" },
    { name: "Hogar", href: "/categories/hogar" },
    { name: "Deportes", href: "/categories/deportes" },
  ],
  company: [
    { name: "Sobre Nosotros", href: "/about" },
    { name: "Contacto", href: "/contact" },
    { name: "Blog", href: "/blog" },
    { name: "Trabaja con Nosotros", href: "/careers" },
  ],
  support: [
    { name: "Centro de Ayuda", href: "/help" },
    { name: "Envíos", href: "/shipping" },
    { name: "Devoluciones", href: "/returns" },
    { name: "Términos y Condiciones", href: "/terms" },
  ],
};

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
];

export function StoreFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white">
              SACRINT
            </Link>
            <p className="mt-4 text-sm">
              Tu tienda en línea de confianza. Productos de calidad con entrega rápida y segura.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                  <span className="sr-only">{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Tienda
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Categorías
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Empresa
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Soporte
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <a href="mailto:soporte@sacrint.com" className="flex items-center hover:text-white">
                <Mail className="h-4 w-4 mr-2" />
                soporte@sacrint.com
              </a>
              <a href="tel:+525512345678" className="flex items-center hover:text-white">
                <Phone className="h-4 w-4 mr-2" />
                +52 55 1234 5678
              </a>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Ciudad de México, MX
              </span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} SACRINT. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/privacy" className="hover:text-white">
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-white">
                Términos
              </Link>
              <Link href="/cookies" className="hover:text-white">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
