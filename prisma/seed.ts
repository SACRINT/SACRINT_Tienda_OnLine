// Prisma Seed Data
// Demo store with sample products

import { PrismaClient, UserRole, PaymentMethod, OrderStatus, PaymentStatus, CouponType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create Demo Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "SACRINT Demo Store",
      slug: "demo-store",
      logo: "/images/logo.png",
      primaryColor: "#0A1128",
      accentColor: "#D4AF37",
      domain: null,
      featureFlags: {
        reviews: true,
        wishlist: true,
        coupons: true,
        guestCheckout: false,
      },
    },
  });

  console.log("🏪 Created tenant:", tenant.name);

  // Create Users
  const hashedPassword = await hash("demo123456", 12);

  const owner = await prisma.user.create({
    data: {
      email: "owner@demo.com",
      password: hashedPassword,
      name: "Demo Owner",
      role: UserRole.STORE_OWNER,
      tenantId: tenant.id,
      emailVerified: new Date(),
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@demo.com",
      password: hashedPassword,
      name: "Demo Customer",
      role: UserRole.CUSTOMER,
      tenantId: tenant.id,
      emailVerified: new Date(),
      phone: "+52 55 1234 5678",
    },
  });

  console.log("👥 Created users: owner, customer");

  // Create Address for customer
  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      name: "Demo Customer",
      email: "customer@demo.com",
      phone: "+52 55 1234 5678",
      street: "Av. Reforma 222, Piso 10",
      city: "Ciudad de México",
      state: "CDMX",
      postalCode: "06600",
      country: "MX",
      isDefault: true,
    },
  });

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: "Electrónica",
        slug: "electronica",
        description: "Dispositivos electrónicos y gadgets",
        image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
      },
    }),
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: "Ropa",
        slug: "ropa",
        description: "Moda y vestimenta para toda la familia",
        image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
      },
    }),
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: "Hogar",
        slug: "hogar",
        description: "Artículos para el hogar y decoración",
        image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400",
      },
    }),
    prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: "Deportes",
        slug: "deportes",
        description: "Equipamiento deportivo y fitness",
        image: "https://images.unsplash.com/photo-1461896836934- voices-of-sport?w=400",
      },
    }),
  ]);

  console.log("📁 Created", categories.length, "categories");

  // Create Products
  const products = [];

  // Electronics
  const phone = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: categories[0].id,
      name: "Smartphone Pro Max",
      slug: "smartphone-pro-max",
      description: "El smartphone más avanzado con cámara de 108MP, pantalla AMOLED 6.7\", 5G y batería de larga duración. Ideal para fotografía profesional y gaming.",
      shortDescription: "Smartphone premium con cámara 108MP",
      sku: "PHONE-001",
      basePrice: 15999.00,
      salePrice: 13999.00,
      stock: 50,
      lowStockThreshold: 10,
      weight: 0.2,
      length: 16,
      width: 7.5,
      height: 0.8,
      tags: ["smartphone", "5g", "camara", "premium"],
      published: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800", alt: "Smartphone Pro Max", order: 0 },
          { url: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800", alt: "Smartphone detalle", order: 1 },
        ],
      },
      variants: {
        create: [
          { size: null, color: "Negro", sku: "PHONE-001-BLK", stock: 20, price: null },
          { size: null, color: "Blanco", sku: "PHONE-001-WHT", stock: 15, price: null },
          { size: null, color: "Azul", sku: "PHONE-001-BLU", stock: 15, price: null },
        ],
      },
    },
  });
  products.push(phone);

  const laptop = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: categories[0].id,
      name: "Laptop UltraBook Pro",
      slug: "laptop-ultrabook-pro",
      description: "Laptop ultradelgada con procesador de última generación, 16GB RAM, 512GB SSD. Perfecta para trabajo y entretenimiento.",
      shortDescription: "Laptop potente y ultraligera",
      sku: "LAPTOP-001",
      basePrice: 24999.00,
      stock: 30,
      lowStockThreshold: 5,
      weight: 1.4,
      length: 32,
      width: 22,
      height: 1.5,
      tags: ["laptop", "trabajo", "ultrabook"],
      published: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800", alt: "Laptop UltraBook", order: 0 },
        ],
      },
    },
  });
  products.push(laptop);

  const headphones = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: categories[0].id,
      name: "Audífonos Bluetooth Premium",
      slug: "audifonos-bluetooth-premium",
      description: "Audífonos inalámbricos con cancelación de ruido activa, 30 horas de batería y sonido Hi-Fi.",
      shortDescription: "Audio premium inalámbrico",
      sku: "AUDIO-001",
      basePrice: 3499.00,
      salePrice: 2999.00,
      stock: 100,
      lowStockThreshold: 15,
      weight: 0.25,
      length: 20,
      width: 18,
      height: 8,
      tags: ["audifonos", "bluetooth", "musica"],
      published: true,
      featured: false,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800", alt: "Audífonos Premium", order: 0 },
        ],
      },
      variants: {
        create: [
          { size: null, color: "Negro", sku: "AUDIO-001-BLK", stock: 50, price: null },
          { size: null, color: "Blanco", sku: "AUDIO-001-WHT", stock: 50, price: null },
        ],
      },
    },
  });
  products.push(headphones);

  // Clothing
  const tshirt = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: "Playera Premium Algodón",
      slug: "playera-premium-algodon",
      description: "Playera de algodón 100% premium, suave y cómoda. Corte regular fit, perfecta para uso diario.",
      shortDescription: "Playera algodón premium",
      sku: "SHIRT-001",
      basePrice: 499.00,
      stock: 200,
      lowStockThreshold: 30,
      weight: 0.2,
      length: 70,
      width: 50,
      height: 2,
      tags: ["playera", "algodon", "casual"],
      published: true,
      featured: false,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800", alt: "Playera Premium", order: 0 },
        ],
      },
      variants: {
        create: [
          { size: "S", color: "Blanco", sku: "SHIRT-001-S-WHT", stock: 25, price: null },
          { size: "M", color: "Blanco", sku: "SHIRT-001-M-WHT", stock: 30, price: null },
          { size: "L", color: "Blanco", sku: "SHIRT-001-L-WHT", stock: 30, price: null },
          { size: "XL", color: "Blanco", sku: "SHIRT-001-XL-WHT", stock: 20, price: null },
          { size: "S", color: "Negro", sku: "SHIRT-001-S-BLK", stock: 25, price: null },
          { size: "M", color: "Negro", sku: "SHIRT-001-M-BLK", stock: 35, price: null },
          { size: "L", color: "Negro", sku: "SHIRT-001-L-BLK", stock: 35, price: null },
        ],
      },
    },
  });
  products.push(tshirt);

  const jeans = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: "Jeans Slim Fit",
      slug: "jeans-slim-fit",
      description: "Jeans de mezclilla premium con stretch para mayor comodidad. Corte slim fit moderno.",
      shortDescription: "Jeans stretch slim fit",
      sku: "JEANS-001",
      basePrice: 899.00,
      salePrice: 699.00,
      stock: 150,
      lowStockThreshold: 20,
      weight: 0.5,
      length: 100,
      width: 35,
      height: 3,
      tags: ["jeans", "mezclilla", "slim"],
      published: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", alt: "Jeans Slim Fit", order: 0 },
        ],
      },
      variants: {
        create: [
          { size: "28", color: "Azul", sku: "JEANS-001-28", stock: 30, price: null },
          { size: "30", color: "Azul", sku: "JEANS-001-30", stock: 40, price: null },
          { size: "32", color: "Azul", sku: "JEANS-001-32", stock: 40, price: null },
          { size: "34", color: "Azul", sku: "JEANS-001-34", stock: 30, price: null },
          { size: "36", color: "Azul", sku: "JEANS-001-36", stock: 10, price: null },
        ],
      },
    },
  });
  products.push(jeans);

  // Home
  const lamp = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: categories[2].id,
      name: "Lámpara LED Inteligente",
      slug: "lampara-led-inteligente",
      description: "Lámpara de escritorio LED con control por app, temperatura de color ajustable y timer.",
      shortDescription: "Lámpara LED smart WiFi",
      sku: "LAMP-001",
      basePrice: 1299.00,
      stock: 75,
      lowStockThreshold: 10,
      weight: 0.8,
      length: 40,
      width: 15,
      height: 50,
      tags: ["lampara", "led", "smart", "oficina"],
      published: true,
      featured: false,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800", alt: "Lámpara LED", order: 0 },
        ],
      },
    },
  });
  products.push(lamp);

  const cushion = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: categories[2].id,
      name: "Cojín Decorativo Premium",
      slug: "cojin-decorativo-premium",
      description: "Cojín decorativo de terciopelo con relleno de alta densidad. Perfecto para sala o recámara.",
      shortDescription: "Cojín terciopelo premium",
      sku: "CUSHION-001",
      basePrice: 399.00,
      stock: 120,
      lowStockThreshold: 20,
      weight: 0.4,
      length: 45,
      width: 45,
      height: 12,
      tags: ["cojin", "decoracion", "sala"],
      published: true,
      featured: false,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800", alt: "Cojín Decorativo", order: 0 },
        ],
      },
      variants: {
        create: [
          { size: null, color: "Gris", sku: "CUSHION-001-GRY", stock: 40, price: null },
          { size: null, color: "Azul", sku: "CUSHION-001-BLU", stock: 40, price: null },
          { size: null, color: "Rosa", sku: "CUSHION-001-PNK", stock: 40, price: null },
        ],
      },
    },
  });
  products.push(cushion);

  // Sports
  const yoga = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: categories[3].id,
      name: "Tapete Yoga Premium",
      slug: "tapete-yoga-premium",
      description: "Tapete de yoga antideslizante de 6mm, ecológico y fácil de limpiar. Incluye correa de transporte.",
      shortDescription: "Tapete yoga antideslizante",
      sku: "YOGA-001",
      basePrice: 699.00,
      salePrice: 549.00,
      stock: 80,
      lowStockThreshold: 15,
      weight: 1.0,
      length: 180,
      width: 60,
      height: 0.6,
      tags: ["yoga", "fitness", "ejercicio"],
      published: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800", alt: "Tapete Yoga", order: 0 },
        ],
      },
      variants: {
        create: [
          { size: null, color: "Morado", sku: "YOGA-001-PUR", stock: 30, price: null },
          { size: null, color: "Negro", sku: "YOGA-001-BLK", stock: 30, price: null },
          { size: null, color: "Azul", sku: "YOGA-001-BLU", stock: 20, price: null },
        ],
      },
    },
  });
  products.push(yoga);

  const dumbbell = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: categories[3].id,
      name: "Set Mancuernas Ajustables",
      slug: "set-mancuernas-ajustables",
      description: "Par de mancuernas ajustables de 2.5 a 24kg cada una. Sistema de ajuste rápido.",
      shortDescription: "Mancuernas ajustables 2.5-24kg",
      sku: "DUMB-001",
      basePrice: 4999.00,
      stock: 25,
      lowStockThreshold: 5,
      weight: 50.0,
      length: 45,
      width: 20,
      height: 20,
      tags: ["mancuernas", "pesas", "gym", "fitness"],
      published: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800", alt: "Mancuernas", order: 0 },
        ],
      },
    },
  });
  products.push(dumbbell);

  console.log("📦 Created", products.length, "products");

  // Create Coupons
  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        tenantId: tenant.id,
        code: "BIENVENIDO10",
        description: "10% de descuento para nuevos clientes",
        type: CouponType.PERCENTAGE,
        value: 10,
        minPurchase: 500,
        maxUses: 1000,
        maxUsesPerUser: 1,
        startDate: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    }),
    prisma.coupon.create({
      data: {
        tenantId: tenant.id,
        code: "ENVIOGRATIS",
        description: "Envío gratis en compras mayores a $1,000",
        type: CouponType.FIXED,
        value: 99,
        minPurchase: 1000,
        maxUses: 500,
        maxUsesPerUser: 3,
        startDate: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    }),
    prisma.coupon.create({
      data: {
        tenantId: tenant.id,
        code: "SUMMER20",
        description: "20% descuento de verano",
        type: CouponType.PERCENTAGE,
        value: 20,
        minPurchase: 1500,
        maxDiscount: 500,
        maxUses: 200,
        maxUsesPerUser: 1,
        startDate: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
    }),
  ]);

  console.log("🎟️ Created", coupons.length, "coupons");

  // Create sample order
  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      userId: customer.id,
      orderNumber: "ORD-2025-000001",
      subtotal: 14698.00,
      shippingCost: 99.00,
      tax: 2351.68,
      discount: 0,
      total: 17148.68,
      shippingAddressId: address.id,
      shippingMethod: "express",
      paymentMethod: PaymentMethod.STRIPE,
      paymentStatus: PaymentStatus.COMPLETED,
      status: OrderStatus.DELIVERED,
      paymentId: "pi_demo_123456",
      items: {
        create: [
          {
            productId: phone.id,
            quantity: 1,
            priceAtPurchase: 13999.00,
          },
          {
            productId: jeans.id,
            quantity: 1,
            priceAtPurchase: 699.00,
          },
        ],
      },
    },
  });

  console.log("📋 Created sample order:", order.orderNumber);

  // Create sample reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        productId: phone.id,
        userId: customer.id,
        rating: 5,
        title: "Excelente smartphone",
        content: "La cámara es increíble y la batería dura todo el día. Muy satisfecho con la compra.",
        status: "APPROVED",
      },
    }),
    prisma.review.create({
      data: {
        productId: jeans.id,
        userId: customer.id,
        rating: 4,
        title: "Muy cómodos",
        content: "El stretch es perfecto, muy cómodos para uso diario. El color es exactamente como en las fotos.",
        status: "APPROVED",
      },
    }),
  ]);

  console.log("⭐ Created", reviews.length, "reviews");

  console.log("");
  console.log("✅ Seed completed successfully!");
  console.log("");
  console.log("📝 Demo Credentials:");
  console.log("   Store Owner: owner@demo.com / demo123456");
  console.log("   Customer: customer@demo.com / demo123456");
  console.log("");
  console.log("🏪 Demo Store: demo-store");
  console.log("🎟️ Coupon Codes: BIENVENIDO10, ENVIOGRATIS, SUMMER20");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
