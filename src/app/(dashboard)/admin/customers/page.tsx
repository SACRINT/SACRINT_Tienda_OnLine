'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerSegmentation, CustomerSegment } from '@/components/admin/CustomerSegmentation'
import { Download, RefreshCw, Users } from 'lucide-react'
import Link from 'next/link'

export default function CustomersPage() {
  const { data: session } = useSession()
  const [customers, setCustomers] = useState<CustomerSegment[]>([])
  const [summary, setSummary] = useState({
    champions: 0,
    loyal: 0,
    atRisk: 0,
    lost: 0,
    new: 0,
    promising: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchCustomers()
    }
  }, [session])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/customers/segmentation?tenantId=${session?.user?.tenantId}`
      )
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!session?.user?.tenantId) return

    try {
      const res = await fetch(
        `/api/customers/bulk?tenantId=${session.user.tenantId}`
      )
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `customers-export-${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-gray-600">
            {customers.length} customers across all segments
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchCustomers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="segmentation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segmentation">
            <Users className="h-4 w-4 mr-2" />
            Segmentation
          </TabsTrigger>
          <TabsTrigger value="all">All Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="segmentation" className="space-y-4">
          <CustomerSegmentation customers={customers} summary={summary} />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {customers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/admin/customers/${customer.id}`}
                    className="block"
                  >
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {customer.name || customer.email}
                          </p>
                          <div className="flex gap-4 mt-1 text-sm text-gray-500">
                            <span>{customer.totalOrders} orders</span>
                            <span>
                              ${(customer.totalSpent / 100).toFixed(2)} total
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            RFM: {customer.rfmScore.recency}/{customer.rfmScore.frequency}/
                            {customer.rfmScore.monetary}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
