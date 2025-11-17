'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SettingsFormProps {
  tenant: {
    id: string
    name: string
    domain: string | null
  }
}

export function SettingsForm({ tenant }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: tenant.name,
    domain: tenant.domain || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.refresh()
        alert('Configuración actualizada correctamente')
      } else {
        alert('Error al actualizar la configuración')
      }
    } catch (error) {
      alert('Error al actualizar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre de la Tienda *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Mi Tienda Online"
        />
      </div>

      <div>
        <Label htmlFor="domain">Dominio Personalizado</Label>
        <Input
          id="domain"
          name="domain"
          value={formData.domain}
          onChange={handleChange}
          placeholder="mitienda.com"
        />
        <p className="text-xs text-gray-500 mt-1">
          Opcional: Configura un dominio personalizado para tu tienda
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </form>
  )
}
