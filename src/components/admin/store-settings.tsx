// Store Settings Component
// Store configuration form

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { SettingsSection } from "./settings-layout";
import Image from "next/image";


export interface StoreSettingsData {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  currency: string;
  timezone: string;
  logo?: string;
  favicon?: string;
}

export interface StoreSettingsProps {
  settings: StoreSettingsData;
  onChange: (settings: StoreSettingsData) => void;
  onSave: () => void;
  loading?: boolean;
  className?: string;
}

export function StoreSettings({
  settings,
  onChange,
  onSave,
  loading,
  className,
}: StoreSettingsProps) {
  const handleChange = (field: keyof StoreSettingsData, value: string) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Basic info */}
      <SettingsSection
        title="Store Information"
        description="Basic information about your store"
      >
        <div className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
              {settings.logo ? (
                <Image
                                src={settings.logo}
                                alt="Store logo"
                                width={80}
                                height={80}
                                className="w-full h-full object-cover rounded-lg"
                              />              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">Store Logo</p>
              <p className="text-sm text-muted-foreground">
                Recommended size: 512x512px
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Upload
              </Button>
            </div>
          </div>

          <FormField label="Store Name" required>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>

          <FormField label="Description">
            <TextareaField
              value={settings.description}
              onChange={(e) => handleChange("description", e.target.value)}
              showCount
              maxLength={500}
            />
          </FormField>
        </div>
      </SettingsSection>

      {/* Contact */}
      <SettingsSection
        title="Contact Information"
        description="How customers can reach you"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" required>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>

          <FormField label="Phone">
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>
        </div>
      </SettingsSection>

      {/* Address */}
      <SettingsSection
        title="Business Address"
        description="Your store's physical address"
      >
        <div className="space-y-4">
          <FormField label="Address">
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="City">
              <input
                type="text"
                value={settings.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </FormField>

            <FormField label="State">
              <input
                type="text"
                value={settings.state}
                onChange={(e) => handleChange("state", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </FormField>

            <FormField label="Postal Code">
              <input
                type="text"
                value={settings.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </FormField>
          </div>

          <FormField label="Country">
            <SelectField
              options={[
                { value: "US", label: "United States" },
                { value: "CA", label: "Canada" },
                { value: "GB", label: "United Kingdom" },
                { value: "MX", label: "Mexico" },
                { value: "ES", label: "Spain" },
              ]}
              value={settings.country}
              onChange={(e) => handleChange("country", e.target.value)}
            />
          </FormField>
        </div>
      </SettingsSection>

      {/* Regional */}
      <SettingsSection
        title="Regional Settings"
        description="Currency and timezone preferences"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Currency">
            <SelectField
              options={[
                { value: "USD", label: "US Dollar (USD)" },
                { value: "EUR", label: "Euro (EUR)" },
                { value: "GBP", label: "British Pound (GBP)" },
                { value: "CAD", label: "Canadian Dollar (CAD)" },
                { value: "MXN", label: "Mexican Peso (MXN)" },
              ]}
              value={settings.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
            />
          </FormField>

          <FormField label="Timezone">
            <SelectField
              options={[
                { value: "America/New_York", label: "Eastern Time" },
                { value: "America/Chicago", label: "Central Time" },
                { value: "America/Denver", label: "Mountain Time" },
                { value: "America/Los_Angeles", label: "Pacific Time" },
                { value: "Europe/London", label: "London" },
                { value: "Europe/Madrid", label: "Madrid" },
              ]}
              value={settings.timezone}
              onChange={(e) => handleChange("timezone", e.target.value)}
            />
          </FormField>
        </div>
      </SettingsSection>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

export default StoreSettings;
