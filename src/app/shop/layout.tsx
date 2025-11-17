// Server-side wrapper layout for /shop
// This allows us to export const dynamic = 'force-dynamic' for client components below

import { ReactNode } from 'react'
import ShopLayout from './client-layout'

// Mark as dynamic to prevent static prerendering of client components below
export const dynamic = 'force-dynamic'

interface ShopLayoutWrapperProps {
  children: ReactNode
}

export default function ShopLayoutWrapper({ children }: ShopLayoutWrapperProps) {
  return <ShopLayout>{children}</ShopLayout>
}
