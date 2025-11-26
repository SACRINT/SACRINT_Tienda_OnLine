/**
 * Invoice Generation System - Task 13.5
 * Generación automática de facturas para órdenes
 */

import { db } from "@/lib/db";

export interface InvoiceData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

export async function generateInvoice(
  orderId: string,
): Promise<{ invoiceNumber: string; pdfUrl: string }> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: true,
    },
  });

  if (!order) throw new Error("Order not found");

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const invoice = await db.invoice.create({
    data: {
      orderId: order.id,
      tenantId: order.tenantId,
      number: invoiceNumber,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status: "PROCESSING",
    },
  });

  const pdfUrl = await generateInvoicePDF({
    orderId: order.id,
    customerName: order.user?.name || "Guest",
    customerEmail: order.customerEmail || order.customerEmail || "",
    items: order.items.map((item) => ({
      description: item.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      total: Number(item.price) * item.quantity,
    })),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    total: Number(order.total),
  });

  await db.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl },
  });

  return { invoiceNumber, pdfUrl };
}

async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  // In production: use pdfkit or similar library
  // For now, return mock URL
  return `https://invoices.example.com/${Date.now()}.pdf`;
}

export async function sendInvoiceEmail(invoiceId: string): Promise<void> {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { order: { include: { user: true } } },
  });

  if (!invoice) return;

  // TODO: Send email with invoice PDF attached
  console.log(`Invoice ${invoice.number} sent to ${invoice.order.customerEmail}`);
}
