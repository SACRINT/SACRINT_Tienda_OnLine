// Wishlist service and types

export interface WishlistItem {
  id: string
  productId: string
  productName: string
  productImage?: string
  price: number
  compareAtPrice?: number
  inStock: boolean
  addedAt: Date
}

// Local storage key
const WISHLIST_KEY = "sacrint_wishlist"

// Get wishlist from localStorage
export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return []

  try {
    const saved = localStorage.getItem(WISHLIST_KEY)
    if (!saved) return []
    return JSON.parse(saved)
  } catch {
    return []
  }
}

// Save wishlist to localStorage
export function saveWishlist(items: WishlistItem[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
}

// Add item to wishlist
export function addToWishlist(item: Omit<WishlistItem, "id" | "addedAt">): WishlistItem {
  const wishlist = getWishlist()

  // Check if already exists
  const existing = wishlist.find((i) => i.productId === item.productId)
  if (existing) return existing

  const newItem: WishlistItem = {
    ...item,
    id: `wish_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    addedAt: new Date(),
  }

  wishlist.push(newItem)
  saveWishlist(wishlist)

  return newItem
}

// Remove item from wishlist
export function removeFromWishlist(productId: string): boolean {
  const wishlist = getWishlist()
  const filtered = wishlist.filter((i) => i.productId !== productId)

  if (filtered.length === wishlist.length) return false

  saveWishlist(filtered)
  return true
}

// Check if product is in wishlist
export function isInWishlist(productId: string): boolean {
  const wishlist = getWishlist()
  return wishlist.some((i) => i.productId === productId)
}

// Get wishlist count
export function getWishlistCount(): number {
  return getWishlist().length
}

// Clear wishlist
export function clearWishlist(): void {
  saveWishlist([])
}

// Move item to cart (would integrate with cart service)
export function moveToCart(productId: string): boolean {
  const wishlist = getWishlist()
  const item = wishlist.find((i) => i.productId === productId)

  if (!item) return false

  // Here you would add to cart
  // cart.addItem({ productId: item.productId, quantity: 1, ... })

  // Remove from wishlist
  removeFromWishlist(productId)

  return true
}

// Sort wishlist
export function sortWishlist(
  by: "date" | "price" | "name",
  order: "asc" | "desc" = "desc"
): WishlistItem[] {
  const wishlist = getWishlist()

  return wishlist.sort((a, b) => {
    let comparison = 0

    switch (by) {
      case "date":
        comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
        break
      case "price":
        comparison = a.price - b.price
        break
      case "name":
        comparison = a.productName.localeCompare(b.productName)
        break
    }

    return order === "asc" ? comparison : -comparison
  })
}

// Share wishlist (generate shareable link)
export function generateShareableWishlist(): string {
  const wishlist = getWishlist()
  const productIds = wishlist.map((i) => i.productId)
  const encoded = btoa(JSON.stringify(productIds))
  return `${window.location.origin}/wishlist/shared?items=${encoded}`
}

// Load shared wishlist
export function loadSharedWishlist(encoded: string): string[] {
  try {
    const decoded = atob(encoded)
    return JSON.parse(decoded)
  } catch {
    return []
  }
}
