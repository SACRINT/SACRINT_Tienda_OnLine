// Coupon service and types

export type CouponType =
  | "percentage"
  | "fixed"
  | "free_shipping"
  | "buy_x_get_y";

export type CouponStatus = "active" | "expired" | "used" | "inactive";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // percentage or fixed amount
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  validFrom: Date;
  validUntil: Date;
  status: CouponStatus;
  description?: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  firstPurchaseOnly?: boolean;
  onePerCustomer?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount?: number;
  message: string;
}

// Mock coupons (in production, fetch from database)
const mockCoupons: Coupon[] = [
  {
    id: "1",
    code: "DESCUENTO10",
    type: "percentage",
    value: 10,
    minPurchase: 500,
    usageLimit: 100,
    usageCount: 45,
    validFrom: new Date("2024-01-01"),
    validUntil: new Date("2024-12-31"),
    status: "active",
    description: "10% de descuento en compras mayores a $500",
  },
  {
    id: "2",
    code: "ENVIOGRATIS",
    type: "free_shipping",
    value: 0,
    minPurchase: 300,
    usageLimit: 200,
    usageCount: 89,
    validFrom: new Date("2024-01-01"),
    validUntil: new Date("2024-12-31"),
    status: "active",
    description: "Envío gratis en compras mayores a $300",
  },
  {
    id: "3",
    code: "BIENVENIDO",
    type: "fixed",
    value: 100,
    minPurchase: 500,
    usageLimit: 1000,
    usageCount: 234,
    validFrom: new Date("2024-01-01"),
    validUntil: new Date("2024-12-31"),
    status: "active",
    description: "Descuento de $100 para nuevos clientes",
    firstPurchaseOnly: true,
    onePerCustomer: true,
  },
  {
    id: "4",
    code: "BLACKFRIDAY",
    type: "percentage",
    value: 25,
    maxDiscount: 500,
    usageLimit: 500,
    usageCount: 500,
    validFrom: new Date("2024-11-25"),
    validUntil: new Date("2024-11-30"),
    status: "used",
    description: "25% de descuento Black Friday (máximo $500)",
  },
];

// Find coupon by code
export function findCoupon(code: string): Coupon | undefined {
  return mockCoupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
}

// Validate coupon
export function validateCoupon(
  code: string,
  cartTotal: number,
  options?: {
    customerId?: string;
    isFirstPurchase?: boolean;
    productIds?: string[];
    categoryIds?: string[];
  },
): CouponValidationResult {
  const coupon = findCoupon(code);

  if (!coupon) {
    return {
      valid: false,
      message: "Cupón no encontrado",
    };
  }

  // Check status
  if (coupon.status !== "active") {
    return {
      valid: false,
      message:
        coupon.status === "expired"
          ? "Este cupón ha expirado"
          : "Este cupón no está disponible",
    };
  }

  // Check dates
  const now = new Date();
  if (now < coupon.validFrom) {
    return {
      valid: false,
      message: "Este cupón aún no está activo",
    };
  }

  if (now > coupon.validUntil) {
    return {
      valid: false,
      message: "Este cupón ha expirado",
    };
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return {
      valid: false,
      message: "Este cupón ha alcanzado su límite de uso",
    };
  }

  // Check minimum purchase
  if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
    return {
      valid: false,
      message: `Compra mínima de $${coupon.minPurchase} requerida`,
    };
  }

  // Check first purchase only
  if (coupon.firstPurchaseOnly && !options?.isFirstPurchase) {
    return {
      valid: false,
      message: "Este cupón es solo para primera compra",
    };
  }

  // Calculate discount
  let discount = 0;

  switch (coupon.type) {
    case "percentage":
      discount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
      break;
    case "fixed":
      discount = coupon.value;
      break;
    case "free_shipping":
      // Shipping cost would be applied separately
      discount = 0;
      break;
  }

  return {
    valid: true,
    coupon,
    discount,
    message: getCouponSuccessMessage(coupon, discount),
  };
}

// Get success message for coupon
function getCouponSuccessMessage(coupon: Coupon, discount: number): string {
  switch (coupon.type) {
    case "percentage":
      return `¡${coupon.value}% de descuento aplicado! Ahorras $${discount.toFixed(0)}`;
    case "fixed":
      return `¡Descuento de $${coupon.value} aplicado!`;
    case "free_shipping":
      return "¡Envío gratis aplicado!";
    default:
      return "Cupón aplicado exitosamente";
  }
}

// Format coupon for display
export function formatCoupon(coupon: Coupon): string {
  switch (coupon.type) {
    case "percentage":
      return `${coupon.value}% OFF`;
    case "fixed":
      return `-$${coupon.value}`;
    case "free_shipping":
      return "Envío Gratis";
    case "buy_x_get_y":
      return "Compra X lleva Y";
    default:
      return coupon.code;
  }
}

// Get coupon badge color
export function getCouponColor(type: CouponType): string {
  switch (type) {
    case "percentage":
      return "bg-accent text-white";
    case "fixed":
      return "bg-success text-white";
    case "free_shipping":
      return "bg-primary text-white";
    default:
      return "bg-muted text-foreground";
  }
}

// Get all active coupons (for admin or promotions display)
export function getActiveCoupons(): Coupon[] {
  const now = new Date();
  return mockCoupons.filter(
    (c) =>
      c.status === "active" &&
      c.validFrom <= now &&
      c.validUntil >= now &&
      (!c.usageLimit || c.usageCount < c.usageLimit),
  );
}

// Check if coupon gives free shipping
export function givesFreeShipping(coupon: Coupon): boolean {
  return coupon.type === "free_shipping";
}
