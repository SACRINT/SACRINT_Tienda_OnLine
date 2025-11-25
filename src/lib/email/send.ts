import { Resend } from 'resend';
import { env } from '@/lib/config/env';
import { OrderConfirmationEmail } from './order-confirmation';
import React from 'react';

const resend = new Resend(env.RESEND_API_KEY);

interface OrderData {
    id: string;
    customerName: string;
    items: { name: string; quantity: number; price: number; image: string; }[];
    total: number;
    shippingAddress: string;
}

export const sendOrderConfirmationEmail = async (to: string, order: OrderData) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Tienda Online <noreply@yourdomain.com>', // Replace with your domain
            to: [to],
            subject: `Confirmación de tu pedido #${order.id}`,
            react: OrderConfirmationEmail({ order }) as React.ReactElement,
        });

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error("Error sending order confirmation email:", error);
        throw new Error("Could not send email.");
    }
};