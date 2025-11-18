'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react'

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

interface OrderStatusWorkflowProps {
  orderId: string
  currentStatus: OrderStatus
  tenantId: string
  onStatusChange?: () => void
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    nextStates: ['PROCESSING', 'CANCELLED'],
  },
  PROCESSING: {
    label: 'Processing',
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    nextStates: ['SHIPPED', 'CANCELLED'],
  },
  SHIPPED: {
    label: 'Shipped',
    icon: Truck,
    color: 'bg-purple-100 text-purple-800',
    nextStates: ['DELIVERED', 'CANCELLED'],
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    nextStates: [],
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    nextStates: [],
  },
}

export function OrderStatusWorkflow({
  orderId,
  currentStatus,
  tenantId,
  onStatusChange,
}: OrderStatusWorkflowProps) {
  const [isChanging, setIsChanging] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const config = STATUS_CONFIG[currentStatus]
  const StatusIcon = config.icon

  const handleStatusChange = async () => {
    if (!selectedStatus) return

    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          status: selectedStatus,
          note,
        }),
      })

      if (res.ok) {
        setIsChanging(false)
        setSelectedStatus(null)
        setNote('')
        onStatusChange?.()
      } else {
        alert('Error updating status')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Status Display */}
      <div className="flex items-center gap-3">
        <StatusIcon className="h-5 w-5 text-gray-500" />
        <div>
          <p className="text-sm text-gray-500">Current Status</p>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
      </div>

      {/* Next Actions */}
      {config.nextStates.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {config.nextStates.map((status) => {
              const nextConfig = STATUS_CONFIG[status as OrderStatus]
              const NextIcon = nextConfig.icon
              return (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStatus(status as OrderStatus)
                    setIsChanging(true)
                  }}
                >
                  <NextIcon className="h-4 w-4 mr-2" />
                  Move to {nextConfig.label}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Status Change Dialog */}
      <Dialog open={isChanging} onOpenChange={setIsChanging}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of this order and optionally add a note.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                value={selectedStatus || ''}
                onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {config.nextStates.map((status) => {
                    const statusConfig = STATUS_CONFIG[status as OrderStatus]
                    return (
                      <SelectItem key={status} value={status}>
                        {statusConfig.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this status change..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsChanging(false)
                setSelectedStatus(null)
                setNote('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={!selectedStatus || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Status Timeline Component
interface StatusTimelineProps {
  history: Array<{
    id: string
    status: OrderStatus
    note?: string
    createdAt: string
    user?: {
      name: string | null
      email: string
    }
  }>
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Status History</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {history.map((item, index) => {
            const config = STATUS_CONFIG[item.status]
            const StatusIcon = config.icon
            const isLast = index === history.length - 1

            return (
              <li key={item.id}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          config.color.split(' ')[0]
                        }`}
                      >
                        <StatusIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-900">
                          Status changed to <strong>{config.label}</strong>
                        </p>
                        {item.note && (
                          <p className="mt-1 text-sm text-gray-500">{item.note}</p>
                        )}
                        {item.user && (
                          <p className="mt-1 text-xs text-gray-400">
                            by {item.user.name || item.user.email}
                          </p>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
