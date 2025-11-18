'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Loader2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface OrderNote {
  id: string
  content: string
  type: 'INTERNAL' | 'CUSTOMER'
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface OrderNotesProps {
  orderId: string
  tenantId: string
  notes: OrderNote[]
  onRefresh?: () => void
}

export function OrderNotes({ orderId, tenantId, notes, onRefresh }: OrderNotesProps) {
  const [newNote, setNewNote] = useState('')
  const [noteType, setNoteType] = useState<'INTERNAL' | 'CUSTOMER'>('INTERNAL')
  const [loading, setLoading] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          content: newNote,
          type: noteType,
        }),
      })

      if (res.ok) {
        setNewNote('')
        onRefresh?.()
      } else {
        alert('Error adding note')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error adding note')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return

    try {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          noteId,
        }),
      })

      if (res.ok) {
        onRefresh?.()
      } else {
        alert('Error deleting note')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error deleting note')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Order Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={noteType === 'INTERNAL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNoteType('INTERNAL')}
            >
              Internal Note
            </Button>
            <Button
              variant={noteType === 'CUSTOMER' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNoteType('CUSTOMER')}
            >
              Customer Note
            </Button>
          </div>

          <div className="flex gap-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={
                noteType === 'INTERNAL'
                  ? 'Add an internal note (only visible to staff)...'
                  : 'Add a note for the customer (will be sent via email)...'
              }
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || loading}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {noteType === 'CUSTOMER' && (
            <p className="text-xs text-yellow-600">
              Note: Customer notes will be sent via email and visible in their order
              history.
            </p>
          )}
        </div>

        {/* Notes List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No notes yet. Add one above.
            </p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg border ${
                  note.type === 'INTERNAL'
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={note.type === 'INTERNAL' ? 'outline' : 'default'}
                      className="text-xs"
                    >
                      {note.type === 'INTERNAL' ? 'Internal' : 'Customer'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(new Date(note.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-600" />
                  </Button>
                </div>

                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {note.content}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  by {note.user.name || note.user.email}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
