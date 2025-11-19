"use client";

import * as React from "react";
import { MapPin, Building2, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export interface ShippingAddress {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  references?: string;
  isDefault?: boolean;
}

interface ShippingAddressFormProps {
  initialData?: Partial<ShippingAddress>;
  onSubmit: (address: ShippingAddress) => void;
  onCancel?: () => void;
  loading?: boolean;
  showSaveOption?: boolean;
}

const mexicanStates = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

export function ShippingAddressForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  showSaveOption = false,
}: ShippingAddressFormProps) {
  const [formData, setFormData] = React.useState<ShippingAddress>({
    fullName: initialData?.fullName || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    street: initialData?.street || "",
    exteriorNumber: initialData?.exteriorNumber || "",
    interiorNumber: initialData?.interiorNumber || "",
    neighborhood: initialData?.neighborhood || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    postalCode: initialData?.postalCode || "",
    country: initialData?.country || "México",
    references: initialData?.references || "",
    isDefault: initialData?.isDefault || false,
  });

  const [saveAddress, setSaveAddress] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "El nombre es requerido";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Ingresa un teléfono válido de 10 dígitos";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido";
    }
    if (!formData.street.trim()) {
      newErrors.street = "La calle es requerida";
    }
    if (!formData.exteriorNumber.trim()) {
      newErrors.exteriorNumber = "El número exterior es requerido";
    }
    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = "La colonia es requerida";
    }
    if (!formData.city.trim()) {
      newErrors.city = "La ciudad es requerida";
    }
    if (!formData.state) {
      newErrors.state = "El estado es requerido";
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "El código postal es requerido";
    } else if (!/^\d{5}$/.test(formData.postalCode)) {
      newErrors.postalCode = "El código postal debe tener 5 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        isDefault: saveAddress ? formData.isDefault : undefined,
      });
    }
  };

  const handleChange = (
    field: keyof ShippingAddress,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Dirección de Envío
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="pl-10"
                  placeholder="Juan Pérez"
                />
              </div>
              {errors.fullName && (
                <p className="text-sm text-error mt-1">{errors.fullName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Teléfono *</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    handleChange(
                      "phone",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  className="pl-10"
                  placeholder="55 1234 5678"
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-error mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="pl-10"
                placeholder="juan@email.com"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-error mt-1">{errors.email}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="street">Calle *</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => handleChange("street", e.target.value)}
              className="mt-1"
              placeholder="Av. Reforma"
            />
            {errors.street && (
              <p className="text-sm text-error mt-1">{errors.street}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exteriorNumber">Número Exterior *</Label>
              <Input
                id="exteriorNumber"
                value={formData.exteriorNumber}
                onChange={(e) => handleChange("exteriorNumber", e.target.value)}
                className="mt-1"
                placeholder="123"
              />
              {errors.exteriorNumber && (
                <p className="text-sm text-error mt-1">
                  {errors.exteriorNumber}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="interiorNumber">Número Interior</Label>
              <Input
                id="interiorNumber"
                value={formData.interiorNumber}
                onChange={(e) => handleChange("interiorNumber", e.target.value)}
                className="mt-1"
                placeholder="Depto 4B"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="neighborhood">Colonia *</Label>
            <div className="relative mt-1">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleChange("neighborhood", e.target.value)}
                className="pl-10"
                placeholder="Juárez"
              />
            </div>
            {errors.neighborhood && (
              <p className="text-sm text-error mt-1">{errors.neighborhood}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="mt-1"
                placeholder="Ciudad de México"
              />
              {errors.city && (
                <p className="text-sm text-error mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <Label htmlFor="state">Estado *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleChange("state", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {mexicanStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-error mt-1">{errors.state}</p>
              )}
            </div>
            <div>
              <Label htmlFor="postalCode">Código Postal *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) =>
                  handleChange(
                    "postalCode",
                    e.target.value.replace(/\D/g, "").slice(0, 5),
                  )
                }
                className="mt-1"
                placeholder="06600"
                maxLength={5}
              />
              {errors.postalCode && (
                <p className="text-sm text-error mt-1">{errors.postalCode}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="references">Referencias (Opcional)</Label>
            <Input
              id="references"
              value={formData.references}
              onChange={(e) => handleChange("references", e.target.value)}
              className="mt-1"
              placeholder="Entre calle A y calle B, edificio azul"
            />
          </div>

          {/* Save Options */}
          {showSaveOption && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveAddress"
                  checked={saveAddress}
                  onCheckedChange={(checked) =>
                    setSaveAddress(checked as boolean)
                  }
                />
                <Label htmlFor="saveAddress" className="text-sm font-normal">
                  Guardar esta dirección para futuras compras
                </Label>
              </div>
              {saveAddress && (
                <div className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      handleChange("isDefault", checked as boolean)
                    }
                  />
                  <Label htmlFor="isDefault" className="text-sm font-normal">
                    Establecer como dirección predeterminada
                  </Label>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Continuar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
