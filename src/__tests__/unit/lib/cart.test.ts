// Cart Store Tests
import { act, renderHook } from "@testing-library/react";
import { useCart, CartItem } from "@/lib/store/useCart";

// Reset store between tests
const resetStore = () => {
  const { result } = renderHook(() => useCart());
  act(() => {
    result.current.clear();
  });
};

describe("Cart Store", () => {
  beforeEach(() => {
    resetStore();
  });

  const mockItem: CartItem = {
    productId: "prod_1",
    variantId: null,
    quantity: 1,
    price: 99.99,
    name: "Test Product",
    image: "/test.jpg",
    sku: "SKU001",
  };

  const mockVariantItem: CartItem = {
    productId: "prod_1",
    variantId: "var_1",
    quantity: 1,
    price: 109.99,
    name: "Test Product - Large",
    image: "/test.jpg",
    sku: "SKU001-L",
  };

  describe("addItem", () => {
    it("should add new item to cart", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(mockItem);
    });

    it("should increase quantity for existing item", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem({ ...mockItem, quantity: 2 });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
    });

    it("should treat different variants as separate items", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockVariantItem);
      });

      expect(result.current.items).toHaveLength(2);
    });
  });

  describe("removeItem", () => {
    it("should remove item from cart", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.removeItem("prod_1");
      });

      expect(result.current.items).toHaveLength(0);
    });

    it("should remove specific variant", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockVariantItem);
        result.current.removeItem("prod_1", "var_1");
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].variantId).toBeNull();
    });

    it("should handle non-existent item", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.removeItem("prod_999");
      });

      expect(result.current.items).toHaveLength(1);
    });
  });

  describe("updateQuantity", () => {
    it("should update quantity", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.updateQuantity("prod_1", 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it("should remove item when quantity is 0", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.updateQuantity("prod_1", 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it("should remove item when quantity is negative", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.updateQuantity("prod_1", -1);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it("should update specific variant quantity", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockVariantItem);
        result.current.updateQuantity("prod_1", 3, "var_1");
      });

      expect(result.current.items[0].quantity).toBe(1); // Original item
      expect(result.current.items[1].quantity).toBe(3); // Variant item
    });

    it("should handle non-existent item", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.updateQuantity("prod_999", 5);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(1);
    });
  });

  describe("clear", () => {
    it("should remove all items", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockVariantItem);
        result.current.clear();
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe("itemCount", () => {
    it("should return total quantity", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({ ...mockItem, quantity: 2 });
        result.current.addItem({ ...mockVariantItem, quantity: 3 });
      });

      expect(result.current.itemCount()).toBe(5);
    });

    it("should return 0 for empty cart", () => {
      const { result } = renderHook(() => useCart());
      expect(result.current.itemCount()).toBe(0);
    });
  });

  describe("subtotal", () => {
    it("should calculate correct subtotal", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({ ...mockItem, quantity: 2, price: 50 }); // 100
        result.current.addItem({ ...mockVariantItem, quantity: 1, price: 75 }); // 75
      });

      expect(result.current.subtotal()).toBe(175);
    });

    it("should return 0 for empty cart", () => {
      const { result } = renderHook(() => useCart());
      expect(result.current.subtotal()).toBe(0);
    });

    it("should round to 2 decimal places", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({ ...mockItem, quantity: 3, price: 9.99 }); // 29.97
      });

      expect(result.current.subtotal()).toBe(29.97);
    });
  });

  describe("tax", () => {
    it("should calculate 16% tax", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({ ...mockItem, quantity: 1, price: 100 });
      });

      expect(result.current.tax()).toBe(16);
    });

    it("should return 0 for empty cart", () => {
      const { result } = renderHook(() => useCart());
      expect(result.current.tax()).toBe(0);
    });

    it("should round tax to 2 decimal places", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({ ...mockItem, quantity: 1, price: 33.33 });
      });

      expect(result.current.tax()).toBe(5.33);
    });
  });

  describe("shipping", () => {
    it("should return 9.99 for subtotal under 100", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({ ...mockItem, quantity: 1, price: 50 });
      });

      expect(result.current.shipping()).toBe(9.99);
    });

    it("should return 0 for subtotal >= 100", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({ ...mockItem, quantity: 1, price: 100 });
      });

      expect(result.current.shipping()).toBe(0);
    });

    it("should return 9.99 for empty cart", () => {
      const { result } = renderHook(() => useCart());
      expect(result.current.shipping()).toBe(9.99);
    });
  });

  describe("total", () => {
    it("should calculate subtotal + tax + shipping", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({ ...mockItem, quantity: 1, price: 100 });
      });

      // Subtotal: 100
      // Tax: 16
      // Shipping: 0 (free for >= 100)
      // Total: 116
      expect(result.current.total()).toBe(116);
    });

    it("should include shipping for small orders", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({ ...mockItem, quantity: 1, price: 50 });
      });

      // Subtotal: 50
      // Tax: 8
      // Shipping: 9.99
      // Total: 67.99
      expect(result.current.total()).toBe(67.99);
    });

    it("should handle empty cart", () => {
      const { result } = renderHook(() => useCart());

      // Subtotal: 0
      // Tax: 0
      // Shipping: 9.99
      // Total: 9.99
      expect(result.current.total()).toBe(9.99);
    });
  });

  describe("variant matching", () => {
    it("should correctly match items with null variantId", () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(mockItem);
        result.current.addItem(mockItem);
      });

      // Should merge into single item with quantity 2
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });

    it("should not merge items with different variantIds", () => {
      const { result } = renderHook(() => useCart());

      const item1: CartItem = {
        ...mockItem,
        variantId: "var_1",
      };

      const item2: CartItem = {
        ...mockItem,
        variantId: "var_2",
      };

      act(() => {
        result.current.addItem(item1);
        result.current.addItem(item2);
      });

      expect(result.current.items).toHaveLength(2);
    });
  });
});
