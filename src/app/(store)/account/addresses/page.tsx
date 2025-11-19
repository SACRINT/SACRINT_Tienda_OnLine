"use client"

import * as React from "react"
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Home,
  Building,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  postalCode: string
  phone: string
  isDefault: boolean
  type: "home" | "work"
}

// Mock addresses
const initialAddresses: Address[] = [
  {
    id: "1",
    name: "Juan Pérez",
    street: "Av. Reforma 123, Col. Centro",
    city: "Ciudad de México",
    state: "CDMX",
    postalCode: "06000",
    phone: "55 1234 5678",
    isDefault: true,
    type: "home",
  },
  {
    id: "2",
    name: "Juan Pérez (Trabajo)",
    street: "Paseo de la Reforma 500, Piso 10",
    city: "Ciudad de México",
    state: "CDMX",
    postalCode: "06600",
    phone: "55 8765 4321",
    isDefault: false,
    type: "work",
  },
]

const mexicanStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "CDMX", "Coahuila", "Colima", "Durango",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán",
  "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro",
  "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco",
  "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
]

export default function AddressesPage() {
  const [addresses, setAddresses] = React.useState(initialAddresses)
  const [editingAddress, setEditingAddress] = React.useState<Address | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    type: "home" as "home" | "work",
  })

  const handleSave = () => {
    if (editingAddress) {
      setAddresses(
        addresses.map((addr) =>
          addr.id === editingAddress.id
            ? { ...addr, ...formData }
            : addr
        )
      )
    } else {
      setAddresses([
        ...addresses,
        {
          id: Date.now().toString(),
          ...formData,
          isDefault: addresses.length === 0,
        },
      ])
    }
    setDialogOpen(false)
    resetForm()
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      phone: address.phone,
      type: address.type,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter((addr) => addr.id !== id))
  }

  const handleSetDefault = (id: string) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    )
  }

  const resetForm = () => {
    setEditingAddress(null)
    setFormData({
      name: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      phone: "",
      type: "home",
    })
  }

  const openNewDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">Mis Direcciones</h1>
            <p className="text-muted-foreground mt-1">
              Administra tus direcciones de envío
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Dirección
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Editar Dirección" : "Nueva Dirección"}
                </DialogTitle>
                <DialogDescription>
                  Completa los datos de la dirección
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <Label htmlFor="street">Dirección</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) =>
                      setFormData({ ...formData, street: e.target.value })
                    }
                    placeholder="Calle, número, colonia"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) =>
                      setFormData({ ...formData, state: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {mexicanStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="55 1234 5678"
                  />
                </div>
                <div>
                  <Label>Tipo de Dirección</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      type="button"
                      variant={formData.type === "home" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setFormData({ ...formData, type: "home" })
                      }
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Casa
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === "work" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setFormData({ ...formData, type: "work" })
                      }
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Trabajo
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingAddress ? "Guardar Cambios" : "Agregar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No tienes direcciones guardadas
              </p>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Dirección
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className={address.isDefault ? "border-primary" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {address.type === "home" ? (
                        <Home className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Building className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base">{address.name}</CardTitle>
                    </div>
                    {address.isDefault && (
                      <Badge variant="default" className="bg-primary">
                        Predeterminada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{address.street}</p>
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p>Tel: {address.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    {!address.isDefault && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Predeterminar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(address.id)}
                          className="text-error hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
