'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, AlertTriangle, CheckCircle, Loader2, RotateCcw } from 'lucide-react'
import { formatCurrency } from '@/lib/analytics/types'
import { format } from 'date-fns'

interface OrderRefundProps {
  orderId: string
  tenantId: string
  orderTotal: number
  refundedAmount: number
  stripePaymentIntentId: string | null
  onRefundSuccess?: () => void
}

export function OrderRefund({
  orderId,
  tenantId,
  orderTotal,
  refundedAmount,
  stripePaymentIntentId,
  onRefundSuccess,
}: OrderRefundProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [reason, setReason] = useState<'duplicate' | 'fraudulent' | 'requested_by_customer'>(
    'requested_by_customer'
  )
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const maxRefundable = orderTotal - refundedAmount
  const isFullyRefunded = refundedAmount >= orderTotal
  const canRefund = stripePaymentIntentId && !isFullyRefunded

  const handleRefund = async () => {
    if (!canRefund) return

    const amount = refundAmount ? parseFloat(refundAmount) * 100 : maxRefundable

    if (amount <= 0 || amount > maxRefundable) {
      alert(`Invalid amount. Maximum refundable: ${formatCurrency(maxRefundable)}`)
      return
    }

    if (!confirm(`Confirm refund of ${formatCurrency(amount)}?`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          amount,
          reason,
          note,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsOpen(false)
        setRefundAmount('')
        setNote('')
        onRefundSuccess?.()
      } else {
        alert(data.error || 'Refund failed')
      }
    } catch (error) {
      console.error('Refund error:', error)
      alert('Refund failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFullRefund = () => {
    setRefundAmount((maxRefundable / 100).toFixed(2))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Refund Information
          </span>
          {canRefund && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Process Refund</DialogTitle>
                  <DialogDescription>
                    Process a full or partial refund for this order via Stripe.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Order Total:</span>
                      <span className="font-medium">{formatCurrency(orderTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Already Refunded:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(refundedAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t pt-2">
                      <span className="text-gray-900 font-medium">Max Refundable:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(maxRefundable)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Refund Amount (USD)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={(maxRefundable / 100).toFixed(2)}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="Leave empty for full refund"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFullRefund}
                      >
                        Full
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Select value={reason} onValueChange={(value: any) => setReason(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requested_by_customer">
                          Requested by Customer
                        </SelectItem>
                        <SelectItem value="duplicate">Duplicate</SelectItem>
                        <SelectItem value="fraudulent">Fraudulent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Internal Note (optional)</Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note about this refund..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Refunds cannot be undone</p>
                      <p className="mt-1">
                        This will process a refund via Stripe and update the order status.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRefund} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Process Refund
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Order Total</p>
            <p className="text-lg font-semibold">{formatCurrency(orderTotal)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Refunded Amount</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(refundedAmount)}
            </p>
          </div>
        </div>

        {isFullyRefunded && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">Fully Refunded</span>
          </div>
        )}

        {!stripePaymentIntentId && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              No payment found. Refunds not available.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Refund History Component
interface RefundHistoryProps {
  refunds: Array<{
    id: string
    amount: number
    reason: string
    note?: string
    stripeRefundId: string
    createdAt: string
    user: {
      name: string | null
      email: string
    }
  }>
}

export function RefundHistory({ refunds }: RefundHistoryProps) {
  if (refunds.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Refund History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {refunds.map((refund) => (
            <div key={refund.id} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-red-600">
                    -{formatCurrency(refund.amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Reason: {refund.reason.replace(/_/g, ' ')}
                  </p>
                  {refund.note && (
                    <p className="text-sm text-gray-500">{refund.note}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Stripe ID: {refund.stripeRefundId}
                  </p>
                  <p className="text-xs text-gray-400">
                    by {refund.user.name || refund.user.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {format(new Date(refund.createdAt), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(refund.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
