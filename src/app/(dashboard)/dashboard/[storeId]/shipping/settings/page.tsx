/**
 * Shipping Settings Page - Task 16.10
 * Admin page for configuring shipping settings
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";

interface ShippingSettings {
  enabledProviders: string[];
  markup: {
    type: "PERCENTAGE" | "FIXED";
    value: number;
  };
  defaultServiceType: string;
  packagingWeight: number;
  freeShippingThreshold?: number;
  autoGenerateLabels: boolean;
  originAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const DEFAULT_SETTINGS: ShippingSettings = {
  enabledProviders: ["ESTAFETA", "MERCADO_ENVIOS"],
  markup: { type: "PERCENTAGE", value: 10 },
  defaultServiceType: "STANDARD",
  packagingWeight: 0.1,
  freeShippingThreshold: undefined,
  autoGenerateLabels: false,
  originAddress: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "MX",
  },
};

export default function ShippingSettingsPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [storeId]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/shipping/settings?tenantId=${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/shipping/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: storeId, ...settings }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = (provider: string) => {
    setSettings((prev) => ({
      ...prev,
      enabledProviders: prev.enabledProviders.includes(provider)
        ? prev.enabledProviders.filter((p) => p !== provider)
        : [...prev.enabledProviders, provider],
    }));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Shipping Settings</h1>

      <div className="space-y-6">
        {/* Enabled Carriers */}
        <Card>
          <CardHeader>
            <CardTitle>Enabled Carriers</CardTitle>
            <CardDescription>Select which shipping carriers to use for your orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["ESTAFETA", "MERCADO_ENVIOS", "FEDEX", "DHL", "UPS"].map((provider) => (
              <div key={provider} className="flex items-center justify-between">
                <Label htmlFor={provider}>{provider.replace(/_/g, " ")}</Label>
                <Switch
                  id={provider}
                  checked={settings.enabledProviders.includes(provider)}
                  onCheckedChange={() => toggleProvider(provider)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Markup Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Markup</CardTitle>
            <CardDescription>Add extra cost to carrier rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="markupType">Markup Type</Label>
              <Select
                value={settings.markup.type}
                onValueChange={(value: "PERCENTAGE" | "FIXED") =>
                  setSettings((prev) => ({ ...prev, markup: { ...prev.markup, type: value } }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="markupValue">
                Markup Value {settings.markup.type === "PERCENTAGE" ? "(%)" : "($)"}
              </Label>
              <Input
                id="markupValue"
                type="number"
                step="0.1"
                value={settings.markup.value}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    markup: { ...prev.markup, value: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Default Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="serviceType">Default Service Type</Label>
              <Select
                value={settings.defaultServiceType}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, defaultServiceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="EXPRESS">Express</SelectItem>
                  <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="packagingWeight">Packaging Weight (kg)</Label>
              <Input
                id="packagingWeight"
                type="number"
                step="0.1"
                value={settings.packagingWeight}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, packagingWeight: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div>
              <Label htmlFor="freeShipping">Free Shipping Threshold ($)</Label>
              <Input
                id="freeShipping"
                type="number"
                placeholder="Optional - leave empty for no free shipping"
                value={settings.freeShippingThreshold || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="autoGenerate">Auto-generate Labels</Label>
              <Switch
                id="autoGenerate"
                checked={settings.autoGenerateLabels}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, autoGenerateLabels: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Origin Address */}
        <Card>
          <CardHeader>
            <CardTitle>Origin Address</CardTitle>
            <CardDescription>Your warehouse or store location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={settings.originAddress.street}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    originAddress: { ...prev.originAddress, street: e.target.value },
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={settings.originAddress.city}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      originAddress: { ...prev.originAddress, city: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={settings.originAddress.state}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      originAddress: { ...prev.originAddress, state: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={settings.originAddress.zipCode}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      originAddress: { ...prev.originAddress, zipCode: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={settings.originAddress.country}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      originAddress: { ...prev.originAddress, country: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          {saveSuccess && (
            <div className="text-green-600 font-medium self-center">Settings saved successfully!</div>
          )}
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
