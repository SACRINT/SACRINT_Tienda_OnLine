// Wishlist Service Tests

import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  clearWishlist,
  toggleWishlist,
} from "@/lib/wishlist"
import { createMockLocalStorage } from "@/lib/testing"

describe("Wishlist Service", () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage()
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    })

    // Mock dispatchEvent
    window.dispatchEvent = vi.fn()
  })

  describe("getWishlist", () => {
    it("should return empty array when no items", () => {
      const wishlist = getWishlist()
      expect(wishlist).toEqual([])
    })

    it("should return stored items", () => {
      const items = [
        {
          id: "1",
          productId: "prod-1",
          name: "Test Product",
          price: 100,
          addedAt: new Date().toISOString(),
        },
      ]
      mockLocalStorage.setItem("sacrint-wishlist", JSON.stringify(items))

      const wishlist = getWishlist()
      expect(wishlist).toHaveLength(1)
      expect(wishlist[0].productId).toBe("prod-1")
    })

    it("should handle invalid JSON gracefully", () => {
      mockLocalStorage.setItem("sacrint-wishlist", "invalid-json")

      const wishlist = getWishlist()
      expect(wishlist).toEqual([])
    })
  })

  describe("addToWishlist", () => {
    it("should add item to wishlist", () => {
      const item = {
        productId: "prod-1",
        name: "Test Product",
        price: 199.99,
        image: "/test.jpg",
      }

      const result = addToWishlist(item)

      expect(result.productId).toBe("prod-1")
      expect(result.id).toBeDefined()
      expect(result.addedAt).toBeDefined()
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it("should not add duplicate items", () => {
      const item = {
        productId: "prod-1",
        name: "Test Product",
        price: 199.99,
      }

      addToWishlist(item)
      addToWishlist(item)

      const wishlist = getWishlist()
      expect(wishlist).toHaveLength(1)
    })

    it("should dispatch custom event", () => {
      const item = {
        productId: "prod-1",
        name: "Test Product",
        price: 199.99,
      }

      addToWishlist(item)

      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.any(CustomEvent)
      )
    })
  })

  describe("removeFromWishlist", () => {
    it("should remove item by product ID", () => {
      const item = {
        productId: "prod-1",
        name: "Test Product",
        price: 199.99,
      }

      addToWishlist(item)
      removeFromWishlist("prod-1")

      const wishlist = getWishlist()
      expect(wishlist).toHaveLength(0)
    })

    it("should not throw when removing non-existent item", () => {
      expect(() => removeFromWishlist("non-existent")).not.toThrow()
    })
  })

  describe("isInWishlist", () => {
    it("should return true for existing item", () => {
      addToWishlist({
        productId: "prod-1",
        name: "Test Product",
        price: 199.99,
      })

      expect(isInWishlist("prod-1")).toBe(true)
    })

    it("should return false for non-existing item", () => {
      expect(isInWishlist("non-existent")).toBe(false)
    })
  })

  describe("clearWishlist", () => {
    it("should remove all items", () => {
      addToWishlist({ productId: "1", name: "P1", price: 100 })
      addToWishlist({ productId: "2", name: "P2", price: 200 })

      clearWishlist()

      const wishlist = getWishlist()
      expect(wishlist).toHaveLength(0)
    })
  })

  describe("toggleWishlist", () => {
    it("should add item if not in wishlist", () => {
      const item = {
        productId: "prod-1",
        name: "Test Product",
        price: 199.99,
      }

      const result = toggleWishlist(item)

      expect(result).toBe(true)
      expect(isInWishlist("prod-1")).toBe(true)
    })

    it("should remove item if already in wishlist", () => {
      const item = {
        productId: "prod-1",
        name: "Test Product",
        price: 199.99,
      }

      addToWishlist(item)
      const result = toggleWishlist(item)

      expect(result).toBe(false)
      expect(isInWishlist("prod-1")).toBe(false)
    })
  })
})
