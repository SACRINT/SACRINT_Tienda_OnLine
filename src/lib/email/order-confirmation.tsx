import {
    Body,
    Button,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
  } from '@react-email/components';
  import * as React from 'react';
  
  interface OrderConfirmationEmailProps {
    order: {
      id: string;
      customerName: string;
      items: {
        name: string;
        quantity: number;
        price: number;
        image: string;
      }[];
      total: number;
      shippingAddress: string;
    };
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? `https://${process.env.NEXT_PUBLIC_APP_URL}` : '';
  
  export const OrderConfirmationEmail = ({ order }: OrderConfirmationEmailProps) => (
    <Html>
      <Head />
      <Preview>Confirmación de tu pedido #{order.id}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="150"
            height="auto"
            alt="Tienda Online"
            style={logo}
          />
          <Heading style={heading}>¡Gracias por tu compra, {order.customerName}!</Heading>
          <Text style={paragraph}>
            Hemos recibido tu pedido y lo estamos procesando. Recibirás otra notificación cuando tu pedido haya sido enviado.
          </Text>
          <Section>
            <Text style={subheading}>Resumen del Pedido #{order.id}</Text>
            {order.items.map((item) => (
              <Row key={item.name} style={itemRow}>
                <Column align="left">
                    <Img src={item.image} alt={item.name} width="64" height="64" style={itemImage} />
                </Column>
                <Column style={itemName}>
                  {item.name} <Text style={itemQuantity}>× {item.quantity}</Text>
                </Column>
                <Column align="right" style={itemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Column>
              </Row>
            ))}
            <Hr style={hr} />
            <Row>
              <Column align="left"><Text style={totalLabel}>Total</Text></Column>
              <Column align="right"><Text style={totalValue}>${order.total.toFixed(2)}</Text></Column>
            </Row>
          </Section>
  
          <Section style={{ marginTop: '20px' }}>
            <Text style={subheading}>Enviado a:</Text>
            <Text style={address}>{order.shippingAddress}</Text>
          </Section>
  
          <Button style={button} href={`${baseUrl}/orders/${order.id}`}>
            Ver tu Pedido
          </Button>
  
          <Text style={footerText}>
            Si tienes alguna pregunta, responde a este correo o contáctanos en{' '}
            <Link href="mailto:soporte@tiendaonline.com">soporte@tiendaonline.com</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
  
  // Styles
  const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  };
  
  const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
  };
  
  const logo = {
    margin: '0 auto',
  };
  
  const heading = {
      fontSize: '28px',
      fontWeight: 'bold' as const,
      marginTop: '48px',
      textAlign: 'center' as const
  }

  const subheading = {
      fontSize: '18px',
      fontWeight: 'bold' as const,
      marginTop: '24px',
      marginBottom: '12px'
  }
  
  const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'center' as const,
  };

  const itemRow = {
      padding: '12px 0'
  }

  const itemImage = {
      borderRadius: '4px'
  }
  
  const itemName = {
    fontSize: '14px',
    fontWeight: '500' as const
  }

  const itemQuantity = {
      color: '#6b7280',
      fontSize: '12px'
  }

  const itemPrice = {
    fontSize: '14px',
    fontWeight: 'bold' as const
  }
  
  const hr = {
    borderColor: '#e5e7eb',
    margin: '20px 0',
  };
  
  const totalLabel = {
    fontSize: '16px',
    fontWeight: 'bold' as const
  }

  const totalValue = {
    fontSize: '20px',
    fontWeight: 'bold' as const
  }

  const address = {
      fontSize: '14px',
      color: '#374151'
  }

  const button = {
    backgroundColor: '#2563eb',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: '100%',
    padding: '12px',
  };
  
  const footerText = {
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: '24px',
  };
  