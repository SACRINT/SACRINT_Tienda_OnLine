// Payment Settings Component
// Payment configuration management

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SettingsSection } from "./settings-layout";
import { BadgeCustom } from "@/components/ui/badge-custom";

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  testMode: boolean;
  configured: boolean;
  icon?: string;
}

export interface PaymentSettingsData {
  methods: PaymentMethod[];
  taxRate: number;
  taxIncluded: boolean;
  minimumOrder: number;
}

export interface PaymentSettingsProps {
  settings: PaymentSettingsData;
  onChange: (settings: PaymentSettingsData) => void;
  onConfigureMethod?: (methodId: string) => void;
  onSave: () => void;
  loading?: boolean;
  className?: string;
}

export function PaymentSettings({
  settings,
  onChange,
  onConfigureMethod,
  onSave,
  loading,
  className,
}: PaymentSettingsProps) {
  const handleToggleMethod = (methodId: string, enabled: boolean) => {
    const newMethods = settings.methods.map((method) =>
      method.id === methodId ? { ...method, enabled } : method,
    );
    onChange({ ...settings, methods: newMethods });
  };

  const handleToggleTestMode = (methodId: string, testMode: boolean) => {
    const newMethods = settings.methods.map((method) =>
      method.id === methodId ? { ...method, testMode } : method,
    );
    onChange({ ...settings, methods: newMethods });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Payment methods */}
      <SettingsSection
        title="Payment Methods"
        description="Configure how customers can pay"
        action={
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Method
          </Button>
        }
      >
        <div className="space-y-4">
          {settings.methods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{method.name}</p>
                    {method.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {method.type}
                    </span>
                    {method.testMode && (
                      <BadgeCustom variant="warning" size="sm">
                        Test Mode
                      </BadgeCustom>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={method.testMode}
                    onChange={(e) =>
                      handleToggleTestMode(method.id, e.target.checked)
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Test</span>
                </label>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={(e) =>
                      handleToggleMethod(method.id, e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>

                {onConfigureMethod && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConfigureMethod(method.id)}
                  >
                    Configure
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Tax settings */}
      <SettingsSection
        title="Tax Settings"
        description="Configure tax calculations"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tax Rate (%)">
              <input
                type="number"
                value={settings.taxRate}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    taxRate: Number(e.target.value),
                  })
                }
                min={0}
                max={100}
                step={0.01}
                className="w-full px-3 py-2 border rounded-md"
              />
            </FormField>

            <FormField label="Minimum Order Amount">
              <input
                type="number"
                value={settings.minimumOrder}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    minimumOrder: Number(e.target.value),
                  })
                }
                min={0}
                step={0.01}
                className="w-full px-3 py-2 border rounded-md"
              />
            </FormField>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.taxIncluded}
              onChange={(e) =>
                onChange({
                  ...settings,
                  taxIncluded: e.target.checked,
                })
              }
              className="rounded"
            />
            <div>
              <p className="font-medium text-sm">Prices include tax</p>
              <p className="text-xs text-muted-foreground">
                Display prices with tax already included
              </p>
            </div>
          </label>
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

export default PaymentSettings;
