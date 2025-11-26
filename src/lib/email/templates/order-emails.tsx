/**
 * Order Email Templates - Task 15.10
 * React Email templates for order notifications
 */

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface OrderEmailProps {
  orderNumber: string;
  customerName: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  trackingNumber?: string;
}

export function OrderCreatedEmail(props: OrderEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif" }}>
        <Container>
          <Text style={{ fontSize: "24px", fontWeight: "bold" }}>
            ✅ Order Confirmed
          </Text>
          <Text>Hi {props.customerName},</Text>
          <Text>Thank you for your order #{props.orderNumber}!</Text>
          <Hr />
          <Section>
            {props.items.map((item, i) => (
              <Text key={i}>
                {item.quantity}x {item.name} - ${item.price}
              </Text>
            ))}
          </Section>
          <Hr />
          <Text style={{ fontWeight: "bold" }}>Total: ${props.total}</Text>
          <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/orders/${props.orderNumber}`}>
            View Order
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export function OrderShippedEmail(props: OrderEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif" }}>
        <Container>
          <Text style={{ fontSize: "24px", fontWeight: "bold" }}>
            🚚 Order Shipped
          </Text>
          <Text>Hi {props.customerName},</Text>
          <Text>Your order #{props.orderNumber} has been shipped!</Text>
          <Text>Tracking Number: {props.trackingNumber}</Text>
          <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/orders/${props.orderNumber}/tracking`}>
            Track Shipment
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export function OrderDeliveredEmail(props: OrderEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif" }}>
        <Container>
          <Text style={{ fontSize: "24px", fontWeight: "bold" }}>
            ✅ Order Delivered
          </Text>
          <Text>Hi {props.customerName},</Text>
          <Text>Your order #{props.orderNumber} has been delivered!</Text>
          <Text>We hope you enjoy your purchase.</Text>
          <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/orders/${props.orderNumber}`}>
            Leave a Review
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export function OrderCancelledEmail(props: OrderEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Arial, sans-serif" }}>
        <Container>
          <Text style={{ fontSize: "24px", fontWeight: "bold" }}>
            ❌ Order Cancelled
          </Text>
          <Text>Hi {props.customerName},</Text>
          <Text>Your order #{props.orderNumber} has been cancelled.</Text>
          <Text>Total refund: ${props.total}</Text>
          <Text>If you have any questions, please contact our support team.</Text>
        </Container>
      </Body>
    </Html>
  );
}
