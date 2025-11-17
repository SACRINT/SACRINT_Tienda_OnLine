// Lazy-loaded Account Components
// Componentes de cuenta cargados dinámicamente para mejorar performance

import { lazy } from 'react'

// Lazy load de componentes pesados de cuenta
export const LazyOrderCard = lazy(
  () => import('./OrderCard').then((mod) => ({ default: mod.OrderCard }))
)

export const LazyWishlistItem = lazy(
  () => import('./WishlistItem').then((mod) => ({ default: mod.WishlistItem }))
)

export const LazyReviewForm = lazy(
  () => import('./ReviewForm').then((mod) => ({ default: mod.ReviewForm }))
)

export const LazyRefundRequest = lazy(
  () => import('./RefundRequest').then((mod) => ({ default: mod.RefundRequest }))
)

// Re-exportar tipos para mantener compatibilidad
export type {
  OrderCardProps,
  OrderStatus,
  Order,
} from './OrderCard'

export type { WishlistItemProps, WishlistItem } from './WishlistItem'

export type { ReviewFormProps } from './ReviewForm'

export type { RefundRequestProps } from './RefundRequest'
