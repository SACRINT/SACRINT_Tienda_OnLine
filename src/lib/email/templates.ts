/**
 * Email Templates
 * Plantillas de emails transaccionales
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  orderDate: Date;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

/**
 * Template: Confirmación de pedido
 */
export function orderConfirmationTemplate(data: OrderConfirmationData): EmailTemplate {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  return {
    subject: `Confirmación de pedido #${data.orderId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de pedido</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
    <h1 style="color: #000; margin: 0;">¡Gracias por tu pedido!</h1>
  </div>

  <div style="background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none;">
    <p>Hola ${data.customerName},</p>

    <p>Hemos recibido tu pedido y lo estamos preparando para el envío.</p>

    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Número de pedido:</strong> #${data.orderId}</p>
      <p style="margin: 5px 0 0 0;"><strong>Fecha:</strong> ${data.orderDate.toLocaleDateString()}</p>
    </div>

    <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Resumen del pedido</h2>

    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Cantidad</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Precio</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
          <td style="padding: 10px; text-align: right;">$${data.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right;"><strong>Envío:</strong></td>
          <td style="padding: 10px; text-align: right;">$${data.shipping.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right;"><strong>Impuestos:</strong></td>
          <td style="padding: 10px; text-align: right;">$${data.tax.toFixed(2)}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td colspan="2" style="padding: 15px; text-align: right;"><strong>Total:</strong></td>
          <td style="padding: 15px; text-align: right; font-size: 18px;"><strong>$${data.total.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    </table>

    <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Dirección de envío</h2>

    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0;">${data.customerName}</p>
      <p style="margin: 5px 0 0 0;">${data.shippingAddress.street}</p>
      <p style="margin: 5px 0 0 0;">${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}</p>
      <p style="margin: 5px 0 0 0;">${data.shippingAddress.country}</p>
    </div>

    <p style="margin-top: 30px;">Te enviaremos un correo cuando tu pedido haya sido enviado con el número de seguimiento.</p>

    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

    <p>¡Gracias por comprar con nosotros!</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 5px 5px; margin-top: 0;">
    <p style="margin: 0; font-size: 12px; color: #666;">
      © ${new Date().getFullYear()} Tienda Online. Todos los derechos reservados.
    </p>
  </div>
</body>
</html>
    `,
    text: `
Hola ${data.customerName},

Hemos recibido tu pedido y lo estamos preparando para el envío.

Número de pedido: #${data.orderId}
Fecha: ${data.orderDate.toLocaleDateString()}

RESUMEN DEL PEDIDO:
${data.items.map((item) => `${item.name} x${item.quantity} - $${item.price.toFixed(2)}`).join("\n")}

Subtotal: $${data.subtotal.toFixed(2)}
Envío: $${data.shipping.toFixed(2)}
Impuestos: $${data.tax.toFixed(2)}
Total: $${data.total.toFixed(2)}

DIRECCIÓN DE ENVÍO:
${data.customerName}
${data.shippingAddress.street}
${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}
${data.shippingAddress.country}

Te enviaremos un correo cuando tu pedido haya sido enviado con el número de seguimiento.

¡Gracias por comprar con nosotros!
    `,
  };
}

/**
 * Template: Pedido enviado
 */
export function orderShippedTemplate(data: {
  orderId: string;
  customerName: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: Date;
}): EmailTemplate {
  return {
    subject: `Tu pedido #${data.orderId} ha sido enviado`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1>¡Tu pedido está en camino!</h1>

  <p>Hola ${data.customerName},</p>

  <p>Tu pedido #${data.orderId} ha sido enviado y está en camino.</p>

  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <p><strong>Número de seguimiento:</strong> ${data.trackingNumber}</p>
    <p><strong>Transportista:</strong> ${data.carrier}</p>
    <p><strong>Entrega estimada:</strong> ${data.estimatedDelivery.toLocaleDateString()}</p>
  </div>

  <p>Puedes rastrear tu paquete usando el número de seguimiento proporcionado.</p>

  <p>¡Gracias por tu compra!</p>
</body>
</html>
    `,
  };
}

/**
 * Template: Bienvenida
 */
export function welcomeTemplate(data: { name: string; email: string }): EmailTemplate {
  return {
    subject: "¡Bienvenido a Tienda Online!",
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1>¡Bienvenido a Tienda Online!</h1>

  <p>Hola ${data.name},</p>

  <p>Gracias por registrarte en nuestra tienda. Estamos emocionados de tenerte con nosotros.</p>

  <p>Con tu cuenta puedes:</p>
  <ul>
    <li>Realizar pedidos de forma rápida y sencilla</li>
    <li>Guardar tus direcciones de envío favoritas</li>
    <li>Ver el historial de tus pedidos</li>
    <li>Recibir ofertas exclusivas</li>
  </ul>

  <p>¡Comienza a explorar nuestros productos ahora!</p>

  <p>Si tienes alguna pregunta, estamos aquí para ayudarte.</p>
</body>
</html>
    `,
  };
}

/**
 * Template: Recuperación de contraseña
 */
export function passwordResetTemplate(data: { name: string; resetLink: string }): EmailTemplate {
  return {
    subject: "Recuperación de contraseña",
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1>Recuperación de contraseña</h1>

  <p>Hola ${data.name},</p>

  <p>Recibimos una solicitud para restablecer tu contraseña.</p>

  <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${data.resetLink}" style="background-color: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Restablecer contraseña
    </a>
  </div>

  <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>

  <p>Este enlace expirará en 1 hora.</p>
</body>
</html>
    `,
  };
}

export default {
  orderConfirmationTemplate,
  orderShippedTemplate,
  welcomeTemplate,
  passwordResetTemplate,
};
