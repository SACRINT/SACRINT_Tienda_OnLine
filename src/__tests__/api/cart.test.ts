// Cart API Tests
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/cart/route";
import { auth } from "@/lib/auth/auth";
import {
  getOrCreateCart,
  addItemToCart,
  getCartTotal,
} from "@/lib/db/cart";

// Mock dependencies
jest.mock("@/lib/auth/auth");
jest.mock("@/lib/db/cart");

describe("Cart API", () => {
  const mockSession = {
    user: {
      id: "user_123",
      tenantId: "tenant_123",
      role: "CUSTOMER",
    },
  };

  const mockCart = {
    id: "cart_123",
    userId: "user_123",
    tenantId: "tenant_123",
    items: [
      {
        id: "item_1",
        productId: "prod_1",
        variantId: null,
        quantity: 2,
        priceSnapshot: 49.99,
        product: {
          id: "prod_1",
          name: "Test Product",
          slug: "test-product",
          basePrice: 49.99,
          salePrice: null,
          stock: 100,
          reserved: 0,
          published: true,
          images: [{ url: "/test.jpg" }],
        },
        variant: null,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTotals = {
    subtotal: 99.98,
    tax: 16,
    shipping: 0,
    total: 115.98,
    itemCount: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/cart", () => {
    it("should return cart for authenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOrCreateCart as jest.Mock).mockResolvedValue(mockCart);
      (getCartTotal as jest.Mock).mockResolvedValue(mockTotals);

      const request = new NextRequest("http://localhost:3000/api/cart");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cart.id).toBe("cart_123");
      expect(data.cart.items).toHaveLength(1);
      expect(data.totals.subtotal).toBe(99.98);
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/cart");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return 404 when user has no tenant", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: null },
      });

      const request = new NextRequest("http://localhost:3000/api/cart");
      const response = await GET(request);

      expect(response.status).toBe(404);
    });

    it("should create new cart if none exists", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOrCreateCart as jest.Mock).mockResolvedValue({
        ...mockCart,
        items: [],
      });
      (getCartTotal as jest.Mock).mockResolvedValue({
        subtotal: 0,
        tax: 0,
        shipping: 9.99,
        total: 9.99,
        itemCount: 0,
      });

      const request = new NextRequest("http://localhost:3000/api/cart");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cart.items).toHaveLength(0);
      expect(data.totals.itemCount).toBe(0);
    });

    it("should calculate item subtotals", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOrCreateCart as jest.Mock).mockResolvedValue(mockCart);
      (getCartTotal as jest.Mock).mockResolvedValue(mockTotals);

      const request = new NextRequest("http://localhost:3000/api/cart");
      const response = await GET(request);
      const data = await response.json();

      // priceSnapshot (49.99) * quantity (2) = 99.98
      expect(data.cart.items[0].subtotal).toBe(99.98);
    });

    it("should handle database errors", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOrCreateCart as jest.Mock).mockRejectedValue(new Error("DB error"));

      const request = new NextRequest("http://localhost:3000/api/cart");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/cart", () => {
    const validCartItem = {
      productId: "prod_1",
      quantity: 1,
    };

    const mockCartItem = {
      id: "item_1",
      productId: "prod_1",
      variantId: null,
      quantity: 1,
      priceSnapshot: 49.99,
    };

    it("should add item to cart", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOrCreateCart as jest.Mock).mockResolvedValue(mockCart);
      (addItemToCart as jest.Mock).mockResolvedValue(mockCartItem);

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(validCartItem),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.cartItem.productId).toBe("prod_1");
      expect(data.message).toBe("Item added to cart");
    });

    it("should return 401 for unauthenticated user", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(validCartItem),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid data", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId: "" }), // Invalid
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("should add item with variant", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOrCreateCart as jest.Mock).mockResolvedValue(mockCart);
      (addItemToCart as jest.Mock).mockResolvedValue({
        ...mockCartItem,
        variantId: "var_1",
      });

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify({
          productId: "prod_1",
          variantId: "var_1",
          quantity: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.cartItem.variantId).toBe("var_1");
    });

    it("should handle out of stock error", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOrCreateCart as jest.Mock).mockResolvedValue(mockCart);
      (addItemToCart as jest.Mock).mockRejectedValue(
        new Error("Product is out of stock")
      );

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(validCartItem),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain("out of stock");
    });

    it("should handle product not found error", async () => {
      (auth as jest.Mock).mockResolvedValue(mockSession);
      (getOrCreateCart as jest.Mock).mockResolvedValue(mockCart);
      (addItemToCart as jest.Mock).mockRejectedValue(
        new Error("Product not found")
      );

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(validCartItem),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 404 when user has no tenant", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "user_123", tenantId: null },
      });

      const request = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        body: JSON.stringify(validCartItem),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });
  });
});
