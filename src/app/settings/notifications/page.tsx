/**
 * Notification Preferences - Tarea 18.5
 */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState({
    emailOrders: true,
    emailShipping: true,
    emailPromotions: false,
    smsOrders: true,
    smsShipping: false,
    pushAll: true,
  });

  const handleSave = async () => {
    await fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifications: prefs }),
    });
    alert("Preferencias guardadas");
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">Preferencias de Notificaciones</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailOrders">Órdenes y confirmaciones</Label>
            <Switch
              id="emailOrders"
              checked={prefs.emailOrders}
              onCheckedChange={(checked) => setPrefs({ ...prefs, emailOrders: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="emailShipping">Envíos y entregas</Label>
            <Switch
              id="emailShipping"
              checked={prefs.emailShipping}
              onCheckedChange={(checked) => setPrefs({ ...prefs, emailShipping: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="emailPromotions">Promociones</Label>
            <Switch
              id="emailPromotions"
              checked={prefs.emailPromotions}
              onCheckedChange={(checked) => setPrefs({ ...prefs, emailPromotions: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>SMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="smsOrders">Actualizaciones de órdenes</Label>
            <Switch
              id="smsOrders"
              checked={prefs.smsOrders}
              onCheckedChange={(checked) => setPrefs({ ...prefs, smsOrders: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="smsShipping">Notificaciones de envío</Label>
            <Switch
              id="smsShipping"
              checked={prefs.smsShipping}
              onCheckedChange={(checked) => setPrefs({ ...prefs, smsShipping: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="pushAll">Todas las notificaciones</Label>
            <Switch
              id="pushAll"
              checked={prefs.pushAll}
              onCheckedChange={(checked) => setPrefs({ ...prefs, pushAll: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Guardar Preferencias
      </Button>
    </div>
  );
}
