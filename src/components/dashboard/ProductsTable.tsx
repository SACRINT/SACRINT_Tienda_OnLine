'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActions, PRODUCT_BULK_ACTIONS } from '@/components/admin/BulkActions'
import { AdvancedFilters, PRODUCT_FILTERS } from '@/components/admin/AdvancedFilters'
import { QuickEdit } from '@/components/admin/QuickEdit'
import { formatCurrency } from '@/lib/analytics/types'

interface Product {
  id: string
  name: string
  sku: string | null
  basePrice: number | any
  salePrice?: number | any | null
  stock: number
  published: boolean
  featured?: boolean
  images: { url: string }[]
  category: { name: string } | null
}

interface ProductsTableProps {
  products: Product[]
  currentPage: number
}

export function ProductsTable({ products, currentPage }: ProductsTableProps) {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(window.location.search)
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    window.location.href = `?${params.toString()}`
  }

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(window.location.search)
    if (status !== 'all') {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    params.set('page', '1')
    window.location.href = `?${params.toString()}`
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        window.location.reload()
      } else {
        alert('Error al eliminar el producto')
      }
    } catch (error) {
      alert('Error al eliminar el producto')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map((p) => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId))
    }
  }

  const handleBulkAction = async (actionId: string, value?: any) => {
    if (!session?.user?.tenantId) return

    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: session.user.tenantId,
          productIds: selectedProducts,
          operation: actionId,
          value,
        }),
      })

      if (res.ok) {
        setSelectedProducts([])
        window.location.reload()
      } else {
        alert('Error en la operación masiva')
      }
    } catch (error) {
      alert('Error en la operación masiva')
    }
  }

  const handleClearSelection = () => {
    setSelectedProducts([])
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilterValues(newFilters)
    // Apply filters to URL
    const params = new URLSearchParams(window.location.search)
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1')
    window.location.href = `?${params.toString()}`
  }

  const handleClearFilters = () => {
    setFilterValues({})
    window.location.href = window.location.pathname
  }

  const handleQuickEditSuccess = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Advanced Filters */}
      <AdvancedFilters
        filters={PRODUCT_FILTERS}
        values={filterValues}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Bulk Actions (sticky bar when items selected) */}
      {selectedProducts.length > 0 && (
        <BulkActions
          selectedCount={selectedProducts.length}
          actions={PRODUCT_BULK_ACTIONS}
          onAction={handleBulkAction}
          onClear={handleClearSelection}
        />
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No se encontraron productos
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isSelected = selectedProducts.includes(product.id)
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectProduct(product.id, checked as boolean)
                        }
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.images[0] && (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session?.user?.tenantId ? (
                        <QuickEdit
                          entityId={product.id}
                          tenantId={session.user.tenantId}
                          field="price"
                          currentValue={parseFloat(String(product.basePrice))}
                          onSuccess={handleQuickEditSuccess}
                        />
                      ) : (
                        formatCurrency(parseFloat(String(product.basePrice)))
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session?.user?.tenantId ? (
                        <QuickEdit
                          entityId={product.id}
                          tenantId={session.user.tenantId}
                          field="stock"
                          currentValue={product.stock}
                          onSuccess={handleQuickEditSuccess}
                        />
                      ) : (
                        product.stock
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.published ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Página {currentPage}
        </p>
        <div className="flex gap-2">
          {currentPage > 1 && (
            <Link href={`?page=${currentPage - 1}`}>
              <Button variant="outline" size="sm">
                Anterior
              </Button>
            </Link>
          )}
          {products.length === 10 && (
            <Link href={`?page=${currentPage + 1}`}>
              <Button variant="outline" size="sm">
                Siguiente
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
