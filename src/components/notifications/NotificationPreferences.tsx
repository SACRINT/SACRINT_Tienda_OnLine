"use client";

import * as React from "react";
import { Bell, Mail, Smartphone, Monitor, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  requestPushPermission,
  type NotificationPreferences as PreferencesType,
} from "@/lib/notifications";
import { useToast } from "./Toast";

interface NotificationPreferencesProps {
  className?: string;
}

export function NotificationPreferences({
  className,
}: NotificationPreferencesProps) {
  const { success, error } = useToast();
  const [preferences, setPreferences] = React.useState<PreferencesType>(
    getNotificationPreferences(),
  );
  const [pushPermission, setPushPermission] = React.useState<
    NotificationPermission | "unsupported"
  >("default");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(Notification.permission);
    } else {
      setPushPermission("unsupported");
    }
  }, []);

  const handleToggle = (
    channel: "email" | "push" | "inApp",
    key: string,
    value: boolean,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: value,
      },
    }));
  };

  const handleRequestPush = async () => {
    const granted = await requestPushPermission();
    setPushPermission(granted ? "granted" : "denied");
    if (granted) {
      success("Notificaciones push activadas");
    } else {
      error(
        "Permiso denegado",
        "Puedes habilitarlo desde la configuración del navegador",
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      saveNotificationPreferences(preferences);
      success("Preferencias guardadas");
    } catch {
      error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const preferenceGroups = [
    {
      title: "Correo electrónico",
      description: "Recibe notificaciones en tu correo",
      icon: Mail,
      channel: "email" as const,
      options: [
        { key: "orders", label: "Actualizaciones de pedidos" },
        { key: "promotions", label: "Promociones y descuentos" },
        { key: "newsletter", label: "Newsletter semanal" },
        { key: "priceAlerts", label: "Alertas de precios" },
        { key: "stockAlerts", label: "Alertas de stock" },
      ],
    },
    {
      title: "Notificaciones push",
      description: "Recibe alertas en tu dispositivo",
      icon: Smartphone,
      channel: "push" as const,
      options: [
        { key: "orders", label: "Actualizaciones de pedidos" },
        { key: "promotions", label: "Promociones y descuentos" },
        { key: "priceAlerts", label: "Alertas de precios" },
      ],
    },
    {
      title: "En la aplicación",
      description: "Notificaciones dentro de la tienda",
      icon: Monitor,
      channel: "inApp" as const,
      options: [
        { key: "orders", label: "Actualizaciones de pedidos" },
        { key: "promotions", label: "Promociones y descuentos" },
        { key: "system", label: "Avisos del sistema" },
      ],
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Push permission banner */}
      {pushPermission === "default" && (
        <Card className="border-accent bg-accent/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-sm">
                  Activa las notificaciones push
                </p>
                <p className="text-xs text-muted-foreground">
                  Recibe alertas instantáneas de tus pedidos
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleRequestPush}>
              Activar
            </Button>
          </CardContent>
        </Card>
      )}

      {pushPermission === "denied" && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-sm">Notificaciones bloqueadas</p>
                <p className="text-xs text-muted-foreground">
                  Habilita los permisos desde la configuración de tu navegador
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preference groups */}
      {preferenceGroups.map((group) => {
        const Icon = group.icon;
        const isPushDisabled =
          group.channel === "push" && pushPermission !== "granted";

        return (
          <Card key={group.channel}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.options.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between"
                >
                  <label
                    htmlFor={`${group.channel}-${option.key}`}
                    className={cn(
                      "text-sm",
                      isPushDisabled && "text-muted-foreground",
                    )}
                  >
                    {option.label}
                  </label>
                  <Switch
                    id={`${group.channel}-${option.key}`}
                    checked={
                      preferences[group.channel][
                        option.key as keyof (typeof preferences)[typeof group.channel]
                      ]
                    }
                    onCheckedChange={(checked) =>
                      handleToggle(group.channel, option.key, checked)
                    }
                    disabled={isPushDisabled}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar preferencias"}
        </Button>
      </div>
    </div>
  );
}

// Quick toggle for all notifications
export function NotificationQuickToggle({ className }: { className?: string }) {
  const [enabled, setEnabled] = React.useState(true);

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    // Update all preferences
    const preferences = getNotificationPreferences();
    const updated = {
      email: Object.keys(preferences.email).reduce(
        (acc, key) => ({ ...acc, [key]: value }),
        {} as typeof preferences.email,
      ),
      push: Object.keys(preferences.push).reduce(
        (acc, key) => ({ ...acc, [key]: value }),
        {} as typeof preferences.push,
      ),
      inApp: Object.keys(preferences.inApp).reduce(
        (acc, key) => ({ ...acc, [key]: value }),
        {} as typeof preferences.inApp,
      ),
    };
    saveNotificationPreferences(updated);
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">Notificaciones</span>
      </div>
      <Switch checked={enabled} onCheckedChange={handleToggle} />
    </div>
  );
}
