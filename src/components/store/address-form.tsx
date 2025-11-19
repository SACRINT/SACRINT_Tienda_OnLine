// Address Form Component
// Shipping/billing address form

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { CheckboxField } from "@/components/ui/checkbox-field";

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface AddressFormProps {
  address: Partial<Address>;
  onChange: (address: Partial<Address>) => void;
  onSubmit?: () => void;
  errors?: Partial<Record<keyof Address, string>>;
  showCompany?: boolean;
  showPhone?: boolean;
  countries?: Array<{ value: string; label: string }>;
  states?: Array<{ value: string; label: string }>;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

const defaultCountries = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "MX", label: "Mexico" },
  { value: "GB", label: "United Kingdom" },
  { value: "ES", label: "Spain" },
];

const usStates = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "WA", label: "Washington" },
];

export function AddressForm({
  address,
  onChange,
  onSubmit,
  errors = {},
  showCompany = true,
  showPhone = true,
  countries = defaultCountries,
  states = usStates,
  submitLabel = "Continue",
  loading,
  className,
}: AddressFormProps) {
  const handleChange = (field: keyof Address, value: string) => {
    onChange({ ...address, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First name" required error={errors.firstName}>
          <input
            type="text"
            value={address.firstName || ""}
            onChange={(e) => handleChange("firstName", e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm",
              errors.firstName && "border-destructive",
            )}
            required
          />
        </FormField>

        <FormField label="Last name" required error={errors.lastName}>
          <input
            type="text"
            value={address.lastName || ""}
            onChange={(e) => handleChange("lastName", e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm",
              errors.lastName && "border-destructive",
            )}
            required
          />
        </FormField>
      </div>

      {/* Company */}
      {showCompany && (
        <FormField label="Company" error={errors.company}>
          <input
            type="text"
            value={address.company || ""}
            onChange={(e) => handleChange("company", e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </FormField>
      )}

      {/* Address */}
      <FormField label="Address" required error={errors.address1}>
        <input
          type="text"
          value={address.address1 || ""}
          onChange={(e) => handleChange("address1", e.target.value)}
          placeholder="Street address"
          className={cn(
            "w-full px-3 py-2 border rounded-md text-sm",
            errors.address1 && "border-destructive",
          )}
          required
        />
      </FormField>

      <FormField label="Apartment, suite, etc." error={errors.address2}>
        <input
          type="text"
          value={address.address2 || ""}
          onChange={(e) => handleChange("address2", e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </FormField>

      {/* City, State, Zip */}
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-2">
          <FormField label="City" required error={errors.city}>
            <input
              type="text"
              value={address.city || ""}
              onChange={(e) => handleChange("city", e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-md text-sm",
                errors.city && "border-destructive",
              )}
              required
            />
          </FormField>
        </div>

        <div className="col-span-2">
          <FormField label="State" required error={errors.state}>
            <SelectField
              options={states}
              value={address.state || ""}
              onChange={(e) => handleChange("state", e.target.value)}
              placeholder="Select state"
              error={!!errors.state}
            />
          </FormField>
        </div>

        <div className="col-span-2">
          <FormField label="ZIP code" required error={errors.postalCode}>
            <input
              type="text"
              value={address.postalCode || ""}
              onChange={(e) => handleChange("postalCode", e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-md text-sm",
                errors.postalCode && "border-destructive",
              )}
              required
            />
          </FormField>
        </div>
      </div>

      {/* Country */}
      <FormField label="Country" required error={errors.country}>
        <SelectField
          options={countries}
          value={address.country || ""}
          onChange={(e) => handleChange("country", e.target.value)}
          placeholder="Select country"
          error={!!errors.country}
        />
      </FormField>

      {/* Phone */}
      {showPhone && (
        <FormField
          label="Phone"
          description="For delivery updates"
          error={errors.phone}
        >
          <input
            type="tel"
            value={address.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-md text-sm",
              errors.phone && "border-destructive",
            )}
          />
        </FormField>
      )}

      {/* Submit */}
      {onSubmit && (
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      )}
    </form>
  );
}

// Saved address selector
export interface SavedAddressProps {
  addresses: Array<Address & { id: string; isDefault?: boolean }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  onEdit?: (id: string) => void;
  className?: string;
}

export function SavedAddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  onEdit,
  className,
}: SavedAddressProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {addresses.map((addr) => (
        <label
          key={addr.id}
          className={cn(
            "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
            selectedId === addr.id
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/50",
          )}
        >
          <input
            type="radio"
            name="address"
            checked={selectedId === addr.id}
            onChange={() => onSelect(addr.id)}
            className="mt-1"
          />
          <div className="flex-1">
            <p className="font-medium">
              {addr.firstName} {addr.lastName}
              {addr.isDefault && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                  Default
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {addr.address1}
              {addr.address2 && `, ${addr.address2}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {addr.city}, {addr.state} {addr.postalCode}
            </p>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(addr.id)}
                className="text-sm text-primary mt-2"
              >
                Edit
              </button>
            )}
          </div>
        </label>
      ))}

      <Button variant="outline" className="w-full" onClick={onAddNew}>
        Add new address
      </Button>
    </div>
  );
}

export default AddressForm;
