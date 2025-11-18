// Lazy-loaded Checkout Components
// Componentes de checkout cargados dinámicamente

import { lazy } from 'react'

// Lazy load de componentes de checkout
export const LazyCheckoutWizard = lazy(
  () => import('./CheckoutWizard').then((mod) => ({ default: mod.CheckoutWizard }))
)

export const LazyAddressSelector = lazy(
  () => import('./AddressSelector').then((mod) => ({ default: mod.AddressSelector }))
)

export const LazyShippingMethod = lazy(
  () => import('./ShippingMethod').then((mod) => ({ default: mod.ShippingMethod }))
)

export const LazyPaymentForm = lazy(
  () => import('./PaymentForm').then((mod) => ({ default: mod.PaymentForm }))
)

export const LazyOrderSummary = lazy(
  () => import('./OrderSummary').then((mod) => ({ default: mod.OrderSummary }))
)

// Re-exportar tipos
export type { CheckoutWizardProps, CheckoutData, StepConfig } from './CheckoutWizard'
export type { AddressSelectorProps } from './AddressSelector'
export type { ShippingMethodProps, ShippingOption } from './ShippingMethod'
export type { PaymentFormProps } from './PaymentForm'
export type { OrderSummaryProps } from './OrderSummary'
