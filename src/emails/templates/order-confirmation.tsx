/**
 * Email Template - Confirmación de Orden
 * Semanas 15-16: Email & Notifications
 * Calidad Mundial: Diseño responsive, profesional, optimizado
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

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingUrl?: string;
  storeName: string;
  storeEmail: string;
  storePhone?: string;
}

export default function OrderConfirmationEmail({
  orderNumber = "ORD-2025-12345",
  customerName = "Juan Pérez",
  orderDate = "25 de Noviembre, 2025",
  items = [
    {
      name: "Laptop HP 15.6\"",
      quantity: 1,
      price: 12999,
      image: "https://placehold.co/100x100",
    },
    {
      name: "Mouse Inalámbrico",
      quantity: 2,
      price: 299,
      image: "https://placehold.co/100x100",
    },
  ],
  subtotal = 13597,
  shipping = 150,
  tax = 2175,
  total = 15922,
  shippingAddress = {
    name: "Juan Pérez",
    street: "Av. Insurgentes Sur 1234",
    city: "Ciudad de México",
    state: "CDMX",
    zipCode: "03100",
    country: "México",
  },
  trackingUrl = "https://example.com/track/ORD-2025-12345",
  storeName = "Mi Tienda Online",
  storeEmail = "soporte@mitienda.com",
  storePhone = "+52 55 1234 5678",
}: OrderConfirmationEmailProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>{storeName}</Heading>
          </Section>

          {/* Success Message */}
          <Section style={successBanner}>
            <Text style={successIcon}>✅</Text>
            <Heading style={successHeading}>
              ¡Pedido Confirmado!
            </Heading>
            <Text style={successText}>
              Gracias por tu compra, {customerName}. Tu pedido ha sido confirmado
              y está siendo procesado.
            </Text>
          </Section>

          {/* Order Details */}
          <Section style={section}>
            <Row>
              <Column>
                <Text style={label}>Número de Orden:</Text>
                <Text style={value}>{orderNumber}</Text>
              </Column>
              <Column align="right">
                <Text style={label}>Fecha:</Text>
                <Text style={value}>{orderDate}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Items */}
          <Section style={section}>
            <Heading as="h2" style={sectionHeading}>
              Detalles del Pedido
            </Heading>

            {items.map((item, index) => (
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
                  <Text style={itemQuantity}>
                    Cantidad: {item.quantity}
                  </Text>
                </Column>
                <Column align="right" style={itemPriceColumn}>
                  <Text style={itemPrice}>
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={divider} />

          {/* Totals */}
          <Section style={section}>
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Subtotal:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{formatCurrency(subtotal)}</Text>
              </Column>
            </Row>
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Envío:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{formatCurrency(shipping)}</Text>
              </Column>
            </Row>
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Impuestos:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{formatCurrency(tax)}</Text>
              </Column>
            </Row>
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabelBold}>Total:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValueBold}>{formatCurrency(total)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Shipping Address */}
          <Section style={section}>
            <Heading as="h2" style={sectionHeading}>
              Dirección de Envío
            </Heading>
            <Text style={addressText}>
              {shippingAddress.name}<br />
              {shippingAddress.street}<br />
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}<br />
              {shippingAddress.country}
            </Text>
          </Section>

          {/* Track Order Button */}
          {trackingUrl && (
            <Section style={buttonSection}>
              <Button href={trackingUrl} style={button}>
                Rastrear mi Pedido
              </Button>
            </Section>
          )}

          <Hr style={divider} />

          {/* Help Section */}
          <Section style={helpSection}>
            <Heading as="h3" style={helpHeading}>
              ¿Necesitas Ayuda?
            </Heading>
            <Text style={helpText}>
              Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos:
            </Text>
            <Text style={contactInfo}>
              📧 Email: <a href={`mailto:${storeEmail}`} style={link}>{storeEmail}</a>
            </Text>
            {storePhone && (
              <Text style={contactInfo}>
                📞 Teléfono: {storePhone}
              </Text>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2025 {storeName}. Todos los derechos reservados.
            </Text>
            <Text style={footerText}>
              Este correo fue enviado a {customerName} en respuesta a tu orden #{orderNumber}
            </Text>
            <Text style={footerTextSmall}>
              Si no realizaste esta compra, por favor contacta inmediatamente a nuestro equipo de soporte.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos profesionales con calidad mundial
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 40px",
  backgroundColor: "#0A1128",
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "center" as const,
};

const successBanner = {
  backgroundColor: "#f0f9ff",
  padding: "32px 40px",
  textAlign: "center" as const,
  borderBottom: "3px solid #0ea5e9",
};

const successIcon = {
  fontSize: "48px",
  margin: "0 0 16px",
};

const successHeading = {
  color: "#0369a1",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const successText = {
  color: "#075985",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
};

const section = {
  padding: "24px 40px",
};

const label = {
  color: "#6b7280",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const value = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "0",
};

const sectionHeading = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
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
  objectFit: "cover" as const,
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
  marginBottom: "8px",
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

const totalLabelBold = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0",
};

const totalValueBold = {
  color: "#0A1128",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
};

const addressText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const buttonSection = {
  padding: "32px 40px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#D4AF37",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const helpSection = {
  padding: "24px 40px",
  backgroundColor: "#f9fafb",
};

const helpHeading = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const helpText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 12px",
};

const contactInfo = {
  color: "#374151",
  fontSize: "14px",
  margin: "4px 0",
};

const link = {
  color: "#0ea5e9",
  textDecoration: "none",
};

const footer = {
  padding: "24px 40px",
  backgroundColor: "#f3f4f6",
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "4px 0",
};

const footerTextSmall = {
  color: "#9ca3af",
  fontSize: "11px",
  lineHeight: "14px",
  margin: "8px 0 0",
};
