// Cart Database Tests
import {
  getOrCreateCart,
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  getCartTotal,
} from "@/lib/db/cart";
import { db } from "@/lib/db/client";

// Mock Prisma client
jest.mock("@/lib/db/client", () => ({
  db: {
    cart: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    cartItem: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn) =>
      fn({
        cart: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
        },
        cartItem: {
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        product: {
          findUnique: jest.fn(),
        },
      })
    ),
  },
}));

describe("Cart Database Layer", () => {
  const tenantId = "tenant_123";
  const userId = "user_123";

  const mockCart = {
    id: "cart_123",
    userId,
    tenantId,
    items: [
      {
        id: "item_1",
        productId: "prod_1",
        variantId: null,
        quantity: 2,
        priceSnapshot: 50,
        product: {
          id: "prod_1",
          name: "Product 1",
          basePrice: 50,
          stock: 100,
          reserved: 0,
          images: [{ url: "/img.jpg" }],
        },
        variant: null,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: "prod_1",
    tenantId,
    name: "Product 1",
    basePrice: 50,
    salePrice: null,
    stock: 100,
    reserved: 0,
    published: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOrCreateCart", () => {
    it("should return existing cart", async () => {
      (db.cart.findFirst as jest.Mock).mockResolvedValue(mockCart);

      const result = await getOrCreateCart(userId, tenantId);

      expect(result).toEqual(mockCart);
      expect(db.cart.create).not.toHaveBeenCalled();
    });

    it("should create new cart if none exists", async () => {
      (db.cart.findFirst as jest.Mock).mockResolvedValue(null);
      (db.cart.create as jest.Mock).mockResolvedValue({
        ...mockCart,
        items: [],
      });

      const result = await getOrCreateCart(userId, tenantId);

      expect(result).toBeDefined();
      expect(db.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            tenantId,
          }),
        })
      );
    });
  });

  describe("getUserCart", () => {
    it("should return cart with items", async () => {
      (db.cart.findFirst as jest.Mock).mockResolvedValue(mockCart);

      const result = await getUserCart(userId, tenantId);

      expect(result).toEqual(mockCart);
      expect(db.cart.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, tenantId },
          include: expect.objectContaining({
            items: expect.any(Object),
          }),
        })
      );
    });

    it("should return null if no cart", async () => {
      (db.cart.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getUserCart(userId, tenantId);

      expect(result).toBeNull();
    });
  });

  describe("addItemToCart", () => {
    it("should add new item to cart", async () => {
      const transactionMock = jest.fn().mockImplementation(async (fn) => {
        const tx = {
          product: {
            findUnique: jest.fn().mockResolvedValue(mockProduct),
          },
          cartItem: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: "item_new",
              productId: "prod_1",
              variantId: null,
              quantity: 1,
              priceSnapshot: 50,
            }),
          },
        };
        return fn(tx);
      });
      (db.$transaction as jest.Mock).mockImplementation(transactionMock);

      const result = await addItemToCart(tenantId, "cart_123", "prod_1", null, 1);

      expect(result).toBeDefined();
      expect(result.productId).toBe("prod_1");
    });

    it("should increase quantity for existing item", async () => {
      const existingItem = {
        id: "item_1",
        productId: "prod_1",
        quantity: 2,
        priceSnapshot: 50,
      };

      const transactionMock = jest.fn().mockImplementation(async (fn) => {
        const tx = {
          product: {
            findUnique: jest.fn().mockResolvedValue(mockProduct),
          },
          cartItem: {
            findFirst: jest.fn().mockResolvedValue(existingItem),
            update: jest.fn().mockResolvedValue({
              ...existingItem,
              quantity: 3,
            }),
          },
        };
        return fn(tx);
      });
      (db.$transaction as jest.Mock).mockImplementation(transactionMock);

      const result = await addItemToCart(tenantId, "cart_123", "prod_1", null, 1);

      expect(result.quantity).toBe(3);
    });

    it("should throw error for out of stock product", async () => {
      const transactionMock = jest.fn().mockImplementation(async (fn) => {
        const tx = {
          product: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockProduct,
              stock: 0,
            }),
          },
          cartItem: {
            findFirst: jest.fn(),
          },
        };
        return fn(tx);
      });
      (db.$transaction as jest.Mock).mockImplementation(transactionMock);

      await expect(
        addItemToCart(tenantId, "cart_123", "prod_1", null, 1)
      ).rejects.toThrow("out of stock");
    });

    it("should throw error for unpublished product", async () => {
      const transactionMock = jest.fn().mockImplementation(async (fn) => {
        const tx = {
          product: {
            findUnique: jest.fn().mockResolvedValue({
              ...mockProduct,
              published: false,
            }),
          },
          cartItem: {
            findFirst: jest.fn(),
          },
        };
        return fn(tx);
      });
      (db.$transaction as jest.Mock).mockImplementation(transactionMock);

      await expect(
        addItemToCart(tenantId, "cart_123", "prod_1", null, 1)
      ).rejects.toThrow();
    });
  });

  describe("updateCartItemQuantity", () => {
    it("should update item quantity", async () => {
      (db.cartItem.update as jest.Mock).mockResolvedValue({
        id: "item_1",
        quantity: 5,
      });

      const result = await updateCartItemQuantity(tenantId, "item_1", 5);

      expect(result.quantity).toBe(5);
    });

    it("should remove item if quantity is 0", async () => {
      (db.cartItem.delete as jest.Mock).mockResolvedValue({ id: "item_1" });

      await updateCartItemQuantity(tenantId, "item_1", 0);

      expect(db.cartItem.delete).toHaveBeenCalled();
    });
  });

  describe("removeCartItem", () => {
    it("should delete cart item", async () => {
      (db.cartItem.delete as jest.Mock).mockResolvedValue({ id: "item_1" });

      await removeCartItem(tenantId, "item_1");

      expect(db.cartItem.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "item_1" },
        })
      );
    });
  });

  describe("clearCart", () => {
    it("should delete all items from cart", async () => {
      (db.cartItem.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      await clearCart(tenantId, "cart_123");

      expect(db.cartItem.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cartId: "cart_123" },
        })
      );
    });
  });

  describe("getCartTotal", () => {
    it("should calculate cart totals", async () => {
      (db.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

      const result = await getCartTotal(tenantId, "cart_123", 100, 0.16);

      expect(result.subtotal).toBe(100); // 2 * 50
      expect(result.tax).toBe(16); // 100 * 0.16
      expect(result.shipping).toBe(0); // >= 100 = free
      expect(result.total).toBe(116);
      expect(result.itemCount).toBe(2);
    });

    it("should include shipping for small orders", async () => {
      (db.cart.findUnique as jest.Mock).mockResolvedValue({
        ...mockCart,
        items: [
          {
            ...mockCart.items[0],
            quantity: 1,
            priceSnapshot: 50,
          },
        ],
      });

      const result = await getCartTotal(tenantId, "cart_123", 100, 0.16);

      expect(result.subtotal).toBe(50);
      expect(result.shipping).toBeGreaterThan(0);
    });
  });
});
