/**
 * @jest-environment jsdom
 */

// Wishlist Service Tests

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  clearWishlist,
  getWishlistCount,
  sortWishlist,
} from "@/lib/wishlist";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Wishlist Service", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe("getWishlist", () => {
    it("should return empty array when no items", () => {
      const wishlist = getWishlist();
      expect(wishlist).toEqual([]);
    });

    it("should return stored items", () => {
      const items = [
        {
          id: "1",
          productId: "prod-1",
          productName: "Test Product",
          price: 100,
          inStock: true,
          addedAt: new Date().toISOString(),
        },
      ];
      localStorageMock.setItem("sacrint_wishlist", JSON.stringify(items));

      const wishlist = getWishlist();
      expect(wishlist).toHaveLength(1);
      expect(wishlist[0].productId).toBe("prod-1");
    });
  });

  describe("addToWishlist", () => {
    it("should add item to wishlist", () => {
      const item = {
        productId: "prod-1",
        productName: "Test Product",
        price: 199.99,
        productImage: "/test.jpg",
        inStock: true,
      };

      const result = addToWishlist(item);

      expect(result.productId).toBe("prod-1");
      expect(result.id).toBeDefined();
      expect(result.addedAt).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("should not add duplicate items", () => {
      const item = {
        productId: "prod-1",
        productName: "Test Product",
        price: 199.99,
        inStock: true,
      };

      addToWishlist(item);
      addToWishlist(item);

      const wishlist = getWishlist();
      expect(wishlist).toHaveLength(1);
    });
  });

  describe("removeFromWishlist", () => {
    it("should remove item by product ID", () => {
      const item = {
        productId: "prod-1",
        productName: "Test Product",
        price: 199.99,
        inStock: true,
      };

      addToWishlist(item);
      removeFromWishlist("prod-1");

      const wishlist = getWishlist();
      expect(wishlist).toHaveLength(0);
    });

    it("should return false when removing non-existent item", () => {
      const result = removeFromWishlist("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("isInWishlist", () => {
    it("should return true for existing item", () => {
      addToWishlist({
        productId: "prod-1",
        productName: "Test Product",
        price: 199.99,
        inStock: true,
      });

      expect(isInWishlist("prod-1")).toBe(true);
    });

    it("should return false for non-existing item", () => {
      expect(isInWishlist("non-existent")).toBe(false);
    });
  });

  describe("clearWishlist", () => {
    it("should remove all items", () => {
      addToWishlist({
        productId: "1",
        productName: "P1",
        price: 100,
        inStock: true,
      });
      addToWishlist({
        productId: "2",
        productName: "P2",
        price: 200,
        inStock: true,
      });

      clearWishlist();

      const wishlist = getWishlist();
      expect(wishlist).toHaveLength(0);
    });
  });

  describe("getWishlistCount", () => {
    it("should return correct count", () => {
      addToWishlist({
        productId: "1",
        productName: "P1",
        price: 100,
        inStock: true,
      });
      addToWishlist({
        productId: "2",
        productName: "P2",
        price: 200,
        inStock: true,
      });

      expect(getWishlistCount()).toBe(2);
    });

    it("should return 0 for empty wishlist", () => {
      expect(getWishlistCount()).toBe(0);
    });
  });
});
