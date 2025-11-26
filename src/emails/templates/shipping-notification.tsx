/**
 * Email Template - Notificación de Envío
 * Semanas 15-16: Email & Notifications
 * Diseño profesional y responsive
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Img,
} from "@react-email/components";

interface ShippingNotificationEmailProps {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  estimatedDelivery: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  storeName: string;
  storeEmail: string;
}

export default function ShippingNotificationEmail({
  customerName = "María González",
  orderNumber = "ORD-2025-12345",
  trackingNumber = "1Z999AA10123456784",
  trackingUrl = "https://tracking.example.com/1Z999AA10123456784",
  carrier = "Estafeta",
  estimatedDelivery = "27 de Noviembre, 2025",
  shippingAddress = {
    street: "Calle Principal 456",
    city: "Guadalajara",
    state: "Jalisco",
    zipCode: "44100",
  },
  storeName = "Mi Tienda Online",
  storeEmail = "soporte@mitienda.com",
}: ShippingNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>{storeName}</Heading>
          </Section>

          {/* Shipping Icon & Message */}
          <Section style={shippingBanner}>
            <Text style={shippingIcon}>📦</Text>
            <Heading style={shippingHeading}>¡Tu Pedido Está en Camino!</Heading>
            <Text style={shippingText}>
              Hola {customerName}, tu pedido #{orderNumber} ha sido enviado y está en ruta.
            </Text>
          </Section>

          {/* Tracking Info */}
          <Section style={trackingSection}>
            <div style={trackingBox}>
              <Text style={trackingLabel}>Número de Rastreo</Text>
              <Text style={trackingNumberStyle}>{trackingNumber}</Text>
              <Text style={carrierText}>Transportista: {carrier}</Text>
            </div>
          </Section>

          {/* Track Button */}
          <Section style={buttonSection}>
            <Button href={trackingUrl} style={button}>
              Rastrear mi Paquete
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Delivery Info */}
          <Section style={section}>
            <Heading as="h2" style={sectionHeading}>
              Información de Entrega
            </Heading>
            <div style={infoRow}>
              <Text style={infoLabel}>Fecha Estimada de Entrega:</Text>
              <Text style={infoValue}>{estimatedDelivery}</Text>
            </div>
            <div style={infoRow}>
              <Text style={infoLabel}>Dirección de Envío:</Text>
              <Text style={addressText}>
                {shippingAddress.street}
                <br />
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              </Text>
            </div>
          </Section>

          <Hr style={divider} />

          {/* Tips */}
          <Section style={tipsSection}>
            <Heading as="h3" style={tipsHeading}>
              💡 Consejos para Recibir tu Pedido
            </Heading>
            <ul style={tipsList}>
              <li style={tipItem}>
                <Text style={tipText}>
                  Asegúrate de que alguien esté disponible en la dirección de entrega
                </Text>
              </li>
              <li style={tipItem}>
                <Text style={tipText}>
                  Ten tu identificación lista en caso de que sea necesaria
                </Text>
              </li>
              <li style={tipItem}>
                <Text style={tipText}>Revisa el paquete antes de firmar la entrega</Text>
              </li>
              <li style={tipItem}>
                <Text style={tipText}>Contacta inmediatamente si hay algún problema</Text>
              </li>
            </ul>
          </Section>

          <Hr style={divider} />

          {/* Support */}
          <Section style={supportSection}>
            <Text style={supportText}>
              ¿Tienes preguntas sobre tu envío? Estamos aquí para ayudarte.
            </Text>
            <Text style={contactText}>
              📧{" "}
              <a href={`mailto:${storeEmail}`} style={link}>
                {storeEmail}
              </a>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>© 2025 {storeName}</Text>
            <Text style={footerTextSmall}>
              Este email fue enviado automáticamente. Por favor no respondas a este mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos
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

const shippingBanner = {
  backgroundColor: "#f0fdf4",
  padding: "32px 40px",
  textAlign: "center" as const,
  borderBottom: "3px solid #22c55e",
};

const shippingIcon = {
  fontSize: "48px",
  margin: "0 0 16px",
};

const shippingHeading = {
  color: "#15803d",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const shippingText = {
  color: "#166534",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
};

const trackingSection = {
  padding: "32px 40px",
};

const trackingBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center" as const,
  border: "2px solid #fbbf24",
};

const trackingLabel = {
  color: "#78350f",
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
  fontWeight: "600",
};

const trackingNumberStyle = {
  color: "#92400e",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 12px",
  fontFamily: "monospace",
  letterSpacing: "1px",
};

const carrierText = {
  color: "#92400e",
  fontSize: "14px",
  margin: "0",
};

const buttonSection = {
  padding: "0 40px 32px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#22c55e",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "0",
};

const section = {
  padding: "24px 40px",
};

const sectionHeading = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const infoRow = {
  marginBottom: "16px",
};

const infoLabel = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const infoValue = {
  color: "#111827",
  fontSize: "16px",
  margin: "0",
};

const addressText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const tipsSection = {
  padding: "24px 40px",
  backgroundColor: "#f9fafb",
};

const tipsHeading = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const tipsList = {
  margin: "0",
  padding: "0 0 0 20px",
};

const tipItem = {
  marginBottom: "8px",
};

const tipText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const supportSection = {
  padding: "24px 40px",
  textAlign: "center" as const,
};

const supportText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 8px",
};

const contactText = {
  color: "#374151",
  fontSize: "14px",
  margin: "0",
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
  margin: "4px 0",
};

const footerTextSmall = {
  color: "#9ca3af",
  fontSize: "11px",
  margin: "8px 0 0",
};
