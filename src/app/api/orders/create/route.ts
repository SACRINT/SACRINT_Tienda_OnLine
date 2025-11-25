import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth"; // Corrected import to use auth()
import { authConfig } from "@/lib/auth/auth.config"; // Keeping authConfig for reference if needed elsewhere
import { db } from "@/lib/db";

const addressSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(), // Added postalCode
  country: z.string(),
});

const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const createOrderSchema = z
  .object({
    cartItems: z.array(cartItemSchema).min(1),
    shippingAddress: addressSchema,
    shippingMethod: z.object({ id: z.string(), cost: z.number() }),
    paymentIntentId: z.string(),
    tenantId: z.string(),
    userId: z.string().optional(),
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional(),
  })
  .refine(
    (data) =>
      data.userId || (data.customerName && data.customerEmail),
    "Either userId or guest details (customerName and customerEmail) must be provided."
  );

// Placeholder functions for calculations
const calculateSubtotal = (items: z.infer<typeof cartItemSchema>[]) =>
  items.reduce((acc, item) => acc + item.price * item.quantity, 0);
const calculateTax = (subtotal: number) => subtotal * 0.16; // 16% VAT
const calculateTotal = (subtotal: number, tax: number, shipping: number) =>
  subtotal + tax + shipping;

export async function POST(request: Request) {
  try {
    // TODO: Implement rate limiting (e.g., 5 attempts per 15 minutes per user/IP)
    const session = await auth(); // Using auth() to get session
    const body = await request.json();

    const validation = createOrderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten() }, { status: 400 });
    }

    const { cartItems, shippingAddress, shippingMethod, paymentIntentId, tenantId, userId, customerName, customerEmail } = validation.data;
    
    // If userId is provided, ensure it matches the session user
    if (userId && userId !== session?.user?.id) {
        return NextResponse.json({ success: false, error: "User ID mismatch" }, { status: 403 });
    }

    const subtotal = calculateSubtotal(cartItems);
    const tax = calculateTax(subtotal);
    const total = calculateTotal(subtotal, tax, shippingMethod.cost);

    // Stock validation
    for (const item of cartItems) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      });
      if (!product || product.stock < item.quantity) {
        return NextResponse.json({ success: false, error: `Stock insuficiente para el producto: ${product?.name || item.productId}` }, { status: 400 });
      }
    }

    try {
        const order = await db.$transaction(async (tx) => {
            // Create shipping address first
            const createdShippingAddress = await tx.address.create({
                data: {
                    ...shippingAddress,
                    userId: userId || null, // Associate with user if logged in, otherwise null for guest
                },
            });

            // For simplicity, assuming billingAddress is the same as shippingAddress if not explicitly provided
            // In a real scenario, you'd get billingAddress from the request body as well
            const billingAddressData = shippingAddress; 
            const createdBillingAddress = await tx.address.create({
                data: {
                    ...billingAddressData,
                    userId: userId || null, // Associate with user if logged in, otherwise null for guest
                },
            });
            const createdBillingAddressId = createdBillingAddress.id;


                        const newOrder = await tx.order.create({
                            data: {
                                userId: session?.user?.id,
                                customerName: customerName,
                                customerEmail: customerEmail,
                                tenantId: tenantId,
                                orderNumber: "ORD-" + Date.now().toString(), // Added orderNumber
                                status: "PENDING",
                                paymentMethod: "CREDIT_CARD", // Added paymentMethod (hardcoded for now)
                                subtotal: subtotal,
                                tax: tax,
                                shippingCost: shippingMethod.cost,
                                total: total,                    shippingAddressId: createdShippingAddress.id, // Use the ID of the created address
                    billingAddressId: createdBillingAddressId, // Use the ID of the created address
                    items: {
                        create: cartItems.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            priceAtPurchase: item.price 
                        }))
                    },
                    paymentId: paymentIntentId, // Corrected property name
                },
            });

            for (const item of cartItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            return newOrder;
        });

        return NextResponse.json({ success: true, orderId: order.id });
    } catch(error) {
        console.error("Transaction failed:", error);
        return NextResponse.json({ success: false, error: "No se pudo crear la orden. Por favor, inténtalo de nuevo." }, { status: 500 });
    }
  } catch (error) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
