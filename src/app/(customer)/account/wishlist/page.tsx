// Wishlist Page
// Display and manage saved products

'use client'

import { useState } from 'react'
import { AccountLayout, WishlistItem } from '@/components/account'
import { Heart, Share2, ShoppingCart, Trash2 } from 'lucide-react'

// Mock data - In production, fetch from API
const getMockUser = () => ({
  name: 'John Doe',
  email: 'john.doe@example.com',
  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
})

const getMockWishlistItems = () => {
  return [
    {
      id: '1',
      productId: '1',
      productName: 'Premium Wireless Headphones',
      productSlug: 'premium-wireless-headphones',
      productImage:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      price: 299.99,
      salePrice: 249.99,
      inStock: true,
      rating: 4.5,
      reviewCount: 128,
      addedAt: new Date(2024, 10, 10).toISOString(),
    },
    {
      id: '2',
      productId: '2',
      productName: 'Wireless Earbuds Pro',
      productSlug: 'wireless-earbuds-pro',
      productImage:
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df',
      price: 199.99,
      salePrice: 149.99,
      inStock: true,
      rating: 4.6,
      reviewCount: 89,
      addedAt: new Date(2024, 10, 5).toISOString(),
    },
    {
      id: '3',
      productId: '3',
      productName: 'Studio Monitor Headphones',
      productSlug: 'studio-monitor-headphones',
      productImage:
        'https://images.unsplash.com/photo-1528148343865-51218c4a13e6',
      price: 349.99,
      inStock: true,
      rating: 4.8,
      reviewCount: 156,
      addedAt: new Date(2024, 9, 28).toISOString(),
    },
    {
      id: '4',
      productId: '4',
      productName: 'Portable Bluetooth Speaker',
      productSlug: 'portable-bluetooth-speaker',
      productImage:
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1',
      price: 129.99,
      inStock: false,
      rating: 4.3,
      reviewCount: 67,
      addedAt: new Date(2024, 9, 15).toISOString(),
    },
    {
      id: '5',
      productId: '5',
      productName: 'USB-C Charging Cable (3-Pack)',
      productSlug: 'usb-c-charging-cable',
      price: 24.99,
      salePrice: 19.99,
      inStock: true,
      rating: 4.4,
      reviewCount: 234,
      addedAt: new Date(2024, 9, 1).toISOString(),
    },
  ]
}

export default function WishlistPage() {
  const user = getMockUser()
  const [wishlistItems, setWishlistItems] = useState(getMockWishlistItems())

  const handleAddToCart = async (itemId: string) => {
    // In production, make API call to add to cart
    console.log('Add to cart:', itemId)
    // Simulate success
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const handleRemoveItem = async (itemId: string) => {
    // In production, make API call to remove from wishlist
    console.log('Remove from wishlist:', itemId)
    // Update local state
    setWishlistItems((items) => items.filter((item) => item.id !== itemId))
  }

  const handleAddAllToCart = async () => {
    const inStockItems = wishlistItems.filter((item) => item.inStock)
    console.log('Add all in-stock items to cart:', inStockItems.length)
    // In production, make batch API call
  }

  const handleClearWishlist = async () => {
    if (
      !window.confirm('Are you sure you want to clear your entire wishlist?')
    ) {
      return
    }
    // In production, make API call
    setWishlistItems([])
  }

  const handleShareWishlist = () => {
    // In production, generate shareable link
    const shareUrl = `${window.location.origin}/wishlist/share/${user.email}`
    navigator.clipboard.writeText(shareUrl)
    alert('Wishlist link copied to clipboard!')
  }

  const inStockCount = wishlistItems.filter((item) => item.inStock).length
  const totalValue = wishlistItems.reduce(
    (sum, item) => sum + (item.salePrice || item.price),
    0
  )

  return (
    <AccountLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="mt-2 text-gray-600">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}{' '}
                saved • {inStockCount} in stock
              </p>
            </div>
            <button
              onClick={handleShareWishlist}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Summary Card */}
        {wishlistItems.length > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {wishlistItems.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">In Stock</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {inStockCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  ${totalValue.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleAddAllToCart}
                disabled={inStockCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Add All to Cart ({inStockCount})</span>
              </button>
              <button
                onClick={handleClearWishlist}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-6 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5" />
                <span>Clear Wishlist</span>
              </button>
            </div>
          </div>
        )}

        {/* Wishlist Items */}
        {wishlistItems.length > 0 ? (
          <div className="space-y-4">
            {wishlistItems.map((item) => (
              <WishlistItem
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Heart className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Your wishlist is empty
            </h3>
            <p className="mt-2 text-gray-600">
              Save items you love to buy them later
            </p>
            <a
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Heart className="h-5 w-5" />
              <span>Start Shopping</span>
            </a>
          </div>
        )}

        {/* Tips */}
        {wishlistItems.length > 0 && (
          <div className="mt-8 rounded-lg bg-blue-50 p-6">
            <h3 className="font-semibold text-blue-900">Wishlist Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-blue-800">
              <li>• Items in your wishlist are not reserved - add to cart to secure them</li>
              <li>• Share your wishlist with friends and family for gift ideas</li>
              <li>• Get notified when wishlist items go on sale (coming soon)</li>
              <li>• Wishlist items stay saved across devices when you're signed in</li>
            </ul>
          </div>
        )}
      </div>
    </AccountLayout>
  )
}
