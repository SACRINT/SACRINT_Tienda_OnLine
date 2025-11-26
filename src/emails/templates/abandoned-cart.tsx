/**
 * Email Template - Carrito Abandonado
 * Semanas 15-16: Email Marketing & Automation
 * Diseño optimizado para conversión
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Button,
  Hr,
  Img,
} from "@react-email/components";

interface AbandonedCartEmailProps {
  customerName: string;
  cartItems: Array<{
    name: string;
    price: number;
    image?: string;
    quantity: number;
  }>;
  cartTotal: number;
  cartUrl: string;
  couponCode?: string;
  couponDiscount?: number;
  storeName: string;
  storeUrl: string;
}

export default function AbandonedCartEmail({
  customerName = "Ana López",
  cartItems = [
    {
      name: "Smartphone Samsung Galaxy A54",
      price: 6999,
      image: "https://placehold.co/100x100",
      quantity: 1,
    },
    {
      name: "Funda Protectora",
      price: 299,
      image: "https://placehold.co/100x100",
      quantity: 1,
    },
  ],
  cartTotal = 7298,
  cartUrl = "https://example.com/cart",
  couponCode = "VUELVE15",
  couponDiscount = 15,
  storeName = "Mi Tienda Online",
  storeUrl = "https://example.com",
}: AbandonedCartEmailProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  const discountedTotal = couponDiscount
    ? cartTotal * (1 - couponDiscount / 100)
    : cartTotal;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={`${storeUrl}/logo.png`}
              width="120"
              alt={storeName}
              style={logo}
            />
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Text style={heroIcon}>🛒</Text>
            <Heading style={heroHeading}>
              ¡Dejaste algo en tu carrito!
            </Heading>
            <Text style={heroText}>
              Hola {customerName}, notamos que dejaste algunos artículos en tu carrito.
              ¡No te preocupes! Los guardamos para ti.
            </Text>
          </Section>

          {/* Coupon Section (if available) */}
          {couponCode && couponDiscount && (
            <Section style={couponSection}>
              <div style={couponBox}>
                <Text style={couponLabel}>🎁 OFERTA ESPECIAL PARA TI</Text>
                <Heading style={couponHeading}>
                  {couponDiscount}% DE DESCUENTO
                </Heading>
                <div style={couponCodeBox}>
                  <Text style={couponCode as any}>{couponCode}</Text>
                </div>
                <Text style={couponExpiry}>
                  Válido por las próximas 24 horas
                </Text>
              </div>
            </Section>
          )}

          <Hr style={divider} />

          {/* Cart Items */}
          <Section style={section}>
            <Heading as="h2" style={sectionHeading}>
              Tus Artículos Guardados
            </Heading>

            {cartItems.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemImageColumn}>
                  {item.image && (
                    <Img
                      src={item.image}
                      alt={item.name}
                      width="80"
                      height="80"
                      style={itemImage}
                    />
                  )}
                </Column>
                <Column style={itemDetailsColumn}>
                  <Text style={itemName}>{item.name}</Text>
                  <Text style={itemQuantity}>Cantidad: {item.quantity}</Text>
                </Column>
                <Column align="right" style={itemPriceColumn}>
                  <Text style={itemPrice}>
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={divider} />

            {/* Totals */}
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Subtotal:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{formatCurrency(cartTotal)}</Text>
              </Column>
            </Row>

            {couponDiscount && (
              <>
                <Row style={totalRow}>
                  <Column>
                    <Text style={discountLabel}>
                      Descuento ({couponDiscount}%):
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text style={discountValue}>
                      -{formatCurrency(cartTotal * (couponDiscount / 100))}
                    </Text>
                  </Column>
                </Row>
                <Row style={totalRow}>
                  <Column>
                    <Text style={finalTotalLabel}>Total con descuento:</Text>
                  </Column>
                  <Column align="right">
                    <Text style={finalTotalValue}>
                      {formatCurrency(discountedTotal)}
                    </Text>
                  </Column>
                </Row>
              </>
            )}
          </Section>

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Button href={cartUrl} style={ctaButton}>
              Completar mi Compra
            </Button>
            <Text style={ctaSubtext}>
              {couponCode
                ? `Usa el código ${couponCode} al finalizar tu compra`
                : "Tus artículos te esperan"}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Benefits Section */}
          <Section style={benefitsSection}>
            <Heading as="h3" style={benefitsHeading}>
              ¿Por qué comprar con nosotros?
            </Heading>
            <div style={benefitRow}>
              <Text style={benefitIcon}>✅</Text>
              <div>
                <Text style={benefitTitle}>Envío Gratis</Text>
                <Text style={benefitText}>En compras mayores a $999</Text>
              </div>
            </div>
            <div style={benefitRow}>
              <Text style={benefitIcon}>🔒</Text>
              <div>
                <Text style={benefitTitle}>Pago Seguro</Text>
                <Text style={benefitText}>Tus datos están protegidos</Text>
              </div>
            </div>
            <div style={benefitRow}>
              <Text style={benefitIcon}>↩️</Text>
              <div>
                <Text style={benefitTitle}>Devoluciones Fáciles</Text>
                <Text style={benefitText}>30 días para cambios y devoluciones</Text>
              </div>
            </div>
            <div style={benefitRow}>
              <Text style={benefitIcon}>⚡</Text>
              <div>
                <Text style={benefitTitle}>Entrega Rápida</Text>
                <Text style={benefitText}>Recibe tu pedido en 3-5 días</Text>
              </div>
            </div>
          </Section>

          <Hr style={divider} />

          {/* Alternative CTA */}
          <Section style={alternativeSection}>
            <Text style={alternativeText}>
              ¿Necesitas ayuda para decidir? Navega nuestro catálogo completo.
            </Text>
            <Button href={storeUrl} style={alternativeButton}>
              Ver Más Productos
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2025 {storeName}. Todos los derechos reservados.
            </Text>
            <Text style={footerTextSmall}>
              Recibiste este correo porque tienes artículos en tu carrito.
              Si ya completaste tu compra, ignora este mensaje.
            </Text>
            <Text style={footerTextSmall}>
              <a href={`${storeUrl}/unsubscribe`} style={unsubscribeLink}>
                No deseo recibir recordatorios de carrito
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos optimizados para conversión
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "24px 40px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const heroSection = {
  padding: "32px 40px",
  textAlign: "center" as const,
  backgroundColor: "#fef3c7",
  borderBottom: "3px solid #f59e0b",
};

const heroIcon = {
  fontSize: "48px",
  margin: "0 0 16px",
};

const heroHeading = {
  color: "#92400e",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 12px",
};

const heroText = {
  color: "#78350f",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
};

const couponSection = {
  padding: "32px 40px",
};

const couponBox = {
  backgroundColor: "#dc2626",
  borderRadius: "12px",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const couponLabel = {
  color: "#fef2f2",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 8px",
};

const couponHeading = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const couponCodeBox = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "16px 24px",
  display: "inline-block",
  margin: "0 0 12px",
};

const couponCodeStyle = {
  color: "#dc2626",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
  fontFamily: "monospace",
  letterSpacing: "2px",
};

const couponExpiry = {
  color: "#fef2f2",
  fontSize: "14px",
  margin: "0",
};

const section = {
  padding: "24px 40px",
};

const sectionHeading = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 20px",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "0",
};

const itemRow = {
  marginBottom: "16px",
  paddingBottom: "16px",
  borderBottom: "1px solid #f3f4f6",
};

const itemImageColumn = {
  width: "100px",
  paddingRight: "16px",
};

const itemImage = {
  borderRadius: "8px",
};

const itemDetailsColumn = {
  verticalAlign: "top" as const,
};

const itemName = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const itemQuantity = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0",
};

const itemPriceColumn = {
  verticalAlign: "top" as const,
  width: "120px",
};

const itemPrice = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const totalRow = {
  marginTop: "12px",
};

const totalLabel = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
};

const totalValue = {
  color: "#111827",
  fontSize: "14px",
  margin: "0",
};

const discountLabel = {
  color: "#16a34a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const discountValue = {
  color: "#16a34a",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const finalTotalLabel = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const finalTotalValue = {
  color: "#dc2626",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0",
};

const ctaSection = {
  padding: "32px 40px",
  textAlign: "center" as const,
};

const ctaButton = {
  backgroundColor: "#D4AF37",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 48px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};

const ctaSubtext = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "12px 0 0",
};

const benefitsSection = {
  padding: "24px 40px",
  backgroundColor: "#f9fafb",
};

const benefitsHeading = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const benefitRow = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "16px",
};

const benefitIcon = {
  fontSize: "24px",
  marginRight: "12px",
  flexShrink: 0,
};

const benefitTitle = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 2px",
};

const benefitText = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0",
};

const alternativeSection = {
  padding: "24px 40px",
  textAlign: "center" as const,
};

const alternativeText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 16px",
};

const alternativeButton = {
  backgroundColor: "transparent",
  border: "2px solid #0A1128",
  borderRadius: "8px",
  color: "#0A1128",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const footer = {
  padding: "24px 40px",
  backgroundColor: "#f3f4f6",
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "4px 0",
};

const footerTextSmall = {
  color: "#9ca3af",
  fontSize: "11px",
  margin: "8px 0",
};

const unsubscribeLink = {
  color: "#9ca3af",
  textDecoration: "underline",
};
