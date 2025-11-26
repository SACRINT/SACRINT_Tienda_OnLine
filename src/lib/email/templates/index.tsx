/**
 * Email Templates - Tarea 18.2
 */
import * as React from "react";
import { Html, Body, Container, Text, Button } from "@react-email/components";

export function OrderConfirmationTemplate({ orderNumber, total }: any) {
  return (
    <Html>
      <Body>
        <Container>
          <Text>Orden #{orderNumber} Confirmada</Text>
          <Text>Total: ${total}</Text>
          <Button href={`${process.env.NEXT_PUBLIC_BASE_URL}/orders/${orderNumber}`}>
            Ver Orden
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export function OrderShippedTemplate({ orderNumber, trackingNumber }: any) {
  return (
    <Html>
      <Body>
        <Container>
          <Text>Tu orden #{orderNumber} ha sido enviada</Text>
          <Text>Rastreo: {trackingNumber}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function AbandonedCartTemplate({ firstName }: any) {
  return (
    <Html>
      <Body>
        <Container>
          <Text>Hola {firstName}, dejaste productos en tu carrito</Text>
          <Button href={`${process.env.NEXT_PUBLIC_BASE_URL}/cart`}>Completar Compra</Button>
        </Container>
      </Body>
    </Html>
  );
}
