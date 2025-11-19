// Notification Settings Component
// Notification preferences management

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "./settings-layout";

export interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface NotificationSettingsData {
  preferences: NotificationPreference[];
  emailDigest: "instant" | "daily" | "weekly" | "none";
}

export interface NotificationSettingsProps {
  settings: NotificationSettingsData;
  onChange: (settings: NotificationSettingsData) => void;
  onSave: () => void;
  loading?: boolean;
  className?: string;
}

const defaultPreferences: NotificationPreference[] = [
  {
    id: "new_order",
    label: "New Orders",
    description: "When a customer places a new order",
    email: true,
    push: true,
    sms: false,
  },
  {
    id: "order_cancelled",
    label: "Order Cancelled",
    description: "When an order is cancelled",
    email: true,
    push: true,
    sms: false,
  },
  {
    id: "low_stock",
    label: "Low Stock Alert",
    description: "When product stock falls below threshold",
    email: true,
    push: false,
    sms: false,
  },
  {
    id: "new_review",
    label: "New Reviews",
    description: "When a customer leaves a review",
    email: true,
    push: false,
    sms: false,
  },
  {
    id: "new_customer",
    label: "New Customers",
    description: "When a new customer registers",
    email: false,
    push: false,
    sms: false,
  },
  {
    id: "payment_failed",
    label: "Payment Failed",
    description: "When a payment fails",
    email: true,
    push: true,
    sms: true,
  },
];

export function NotificationSettings({
  settings,
  onChange,
  onSave,
  loading,
  className,
}: NotificationSettingsProps) {
  const preferences =
    settings.preferences.length > 0 ? settings.preferences : defaultPreferences;

  const handleToggle = (
    prefId: string,
    channel: "email" | "push" | "sms",
    value: boolean,
  ) => {
    const newPreferences = preferences.map((pref) =>
      pref.id === prefId ? { ...pref, [channel]: value } : pref,
    );
    onChange({ ...settings, preferences: newPreferences });
  };

  const handleDigestChange = (value: string) => {
    onChange({
      ...settings,
      emailDigest: value as NotificationSettingsData["emailDigest"],
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Email digest */}
      <SettingsSection
        title="Email Digest"
        description="How often you receive email summaries"
      >
        <div className="space-y-2">
          {[
            {
              value: "instant",
              label: "Instant",
              description: "Get emails immediately",
            },
            {
              value: "daily",
              label: "Daily",
              description: "Daily summary at 9am",
            },
            {
              value: "weekly",
              label: "Weekly",
              description: "Weekly summary on Monday",
            },
            { value: "none", label: "None", description: "Don't send digests" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
            >
              <input
                type="radio"
                name="emailDigest"
                value={option.value}
                checked={settings.emailDigest === option.value}
                onChange={(e) => handleDigestChange(e.target.value)}
                className="h-4 w-4"
              />
              <div>
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </SettingsSection>

      {/* Notification preferences */}
      <SettingsSection
        title="Notification Preferences"
        description="Choose how you want to be notified"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-4 gap-4 pb-2 border-b">
            <div className="col-span-1 text-sm font-medium">Event</div>
            <div className="text-center text-sm font-medium">Email</div>
            <div className="text-center text-sm font-medium">Push</div>
            <div className="text-center text-sm font-medium">SMS</div>
          </div>

          {/* Preferences */}
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className="grid sm:grid-cols-4 gap-4 items-center py-2"
            >
              <div className="col-span-1">
                <p className="font-medium text-sm">{pref.label}</p>
                <p className="text-xs text-muted-foreground">
                  {pref.description}
                </p>
              </div>

              <div className="flex sm:justify-center items-center gap-2">
                <span className="sm:hidden text-sm">Email:</span>
                <input
                  type="checkbox"
                  checked={pref.email}
                  onChange={(e) =>
                    handleToggle(pref.id, "email", e.target.checked)
                  }
                  className="h-4 w-4 rounded"
                />
              </div>

              <div className="flex sm:justify-center items-center gap-2">
                <span className="sm:hidden text-sm">Push:</span>
                <input
                  type="checkbox"
                  checked={pref.push}
                  onChange={(e) =>
                    handleToggle(pref.id, "push", e.target.checked)
                  }
                  className="h-4 w-4 rounded"
                />
              </div>

              <div className="flex sm:justify-center items-center gap-2">
                <span className="sm:hidden text-sm">SMS:</span>
                <input
                  type="checkbox"
                  checked={pref.sms}
                  onChange={(e) =>
                    handleToggle(pref.id, "sms", e.target.checked)
                  }
                  className="h-4 w-4 rounded"
                />
              </div>
            </div>
          ))}
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

export default NotificationSettings;
