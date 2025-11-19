import {
  Store,
  CreditCard,
  Bell,
  Truck,
  Mail,
  Shield,
  Palette,
  Globe,
} from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { getTenantById } from "@/lib/db/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>;
  }

  const tenant = await getTenantById(session.user.tenantId);

  if (!tenant) {
    return <div>Tenant not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary">Configuración</h2>
        <p className="text-muted-foreground mt-1">
          Administra la configuración de tu tienda
        </p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            Tienda
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="h-4 w-4" />
            Envíos
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Información de la Tienda
              </CardTitle>
              <CardDescription>
                Actualiza la información básica de tu tienda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm tenant={tenant} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuración Regional
              </CardTitle>
              <CardDescription>Idioma, moneda y zona horaria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Idioma</Label>
                  <Select defaultValue="es-MX">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es-MX">Español (México)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Moneda</Label>
                  <Select defaultValue="MXN">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      <SelectItem value="USD">USD - Dólar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Zona Horaria</Label>
                  <Select defaultValue="America/Mexico_City">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Mexico_City">
                        Ciudad de México (GMT-6)
                      </SelectItem>
                      <SelectItem value="America/Tijuana">
                        Tijuana (GMT-8)
                      </SelectItem>
                      <SelectItem value="America/Cancun">
                        Cancún (GMT-5)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button>Guardar Configuración Regional</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apariencia
              </CardTitle>
              <CardDescription>
                Personaliza los colores de tu tienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Color Primario</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-primary" />
                    <Input defaultValue="#0A1128" className="font-mono" />
                  </div>
                </div>
                <div>
                  <Label>Color Secundario</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-accent" />
                    <Input defaultValue="#D4AF37" className="font-mono" />
                  </div>
                </div>
              </div>
              <Button>Guardar Colores</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe
              </CardTitle>
              <CardDescription>
                Configuración de pagos con tarjeta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/20 rounded-full">
                    <Shield className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Stripe Conectado</p>
                    <p className="text-sm text-muted-foreground">
                      Tu cuenta está verificada y activa
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Administrar
                </Button>
              </div>

              <Separator />

              <div>
                <Label>Webhook URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    readOnly
                    value={`${process.env.NEXT_PUBLIC_APP_URL || "https://tutienda.com"}/api/webhooks/stripe`}
                    className="font-mono text-sm"
                  />
                  <Button variant="outline">Copiar</Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo de Prueba</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar claves de prueba de Stripe
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago Adicionales</CardTitle>
              <CardDescription>Configura otros métodos de pago</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Mercado Pago</p>
                    <p className="text-sm text-muted-foreground">
                      Pagos locales en México
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">PayPal</p>
                    <p className="text-sm text-muted-foreground">
                      Pagos internacionales
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Opciones de Envío
              </CardTitle>
              <CardDescription>
                Configura las tarifas y métodos de envío
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Envío Gratis</Label>
                  <p className="text-sm text-muted-foreground">
                    Ofrecer envío gratis en compras mayores a
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" defaultValue="999" className="w-24" />
                  <span className="text-sm text-muted-foreground">MXN</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Zonas de Envío</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Nacional</p>
                      <p className="text-sm text-muted-foreground">
                        Todo México
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">$99.00</p>
                      <p className="text-xs text-muted-foreground">
                        3-5 días hábiles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Zona Metropolitana</p>
                      <p className="text-sm text-muted-foreground">
                        CDMX y área metropolitana
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">$59.00</p>
                      <p className="text-xs text-muted-foreground">
                        1-2 días hábiles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Express</p>
                      <p className="text-sm text-muted-foreground">
                        Entrega el mismo día
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">$199.00</p>
                      <p className="text-xs text-muted-foreground">
                        Antes de 6pm
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button>Guardar Configuración de Envío</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integraciones de Paquetería</CardTitle>
              <CardDescription>
                Conecta con servicios de mensajería
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <Truck className="h-4 w-4" />
                  </div>
                  <span className="font-medium">SkyDropx</span>
                </div>
                <Button variant="outline" size="sm">
                  Conectar
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <Truck className="h-4 w-4" />
                  </div>
                  <span className="font-medium">99 Minutos</span>
                </div>
                <Button variant="outline" size="sm">
                  Conectar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Notificaciones por Email
              </CardTitle>
              <CardDescription>
                Configura qué emails enviar a los clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirmación de Orden</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar cuando se crea una orden
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirmación de Pago</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar cuando se confirma el pago
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Orden Enviada</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar con número de guía
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Orden Entregada</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar confirmación de entrega
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Carrito Abandonado</Label>
                    <p className="text-sm text-muted-foreground">
                      Recordatorio después de 24 horas
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones del Admin
              </CardTitle>
              <CardDescription>
                Alertas que recibirás como administrador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nueva Orden</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar cuando llega una orden
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Stock Bajo</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertar cuando un producto tiene menos de 5 unidades
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nueva Reseña</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar cuando dejan una reseña
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
