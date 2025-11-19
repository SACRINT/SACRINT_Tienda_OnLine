"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Percent,
  DollarSign,
  Tag,
  Calendar,
  Users,
  RefreshCw,
  Copy,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/analytics/types";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  discount: number;
  maxDiscount: number | null;
  minPurchase: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  description: string | null;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: "",
    maxDiscount: "",
    minPurchase: "",
    maxUses: "",
    expiresAt: "",
    description: "",
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }

      const res = await fetch(`/api/coupons?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [filterStatus]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        maxDiscount: formData.maxDiscount
          ? parseFloat(formData.maxDiscount)
          : null,
        minPurchase: formData.minPurchase
          ? parseFloat(formData.minPurchase)
          : 0,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt).toISOString()
          : null,
        description: formData.description || null,
      };

      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsCreateOpen(false);
        setFormData({
          code: "",
          type: "PERCENTAGE",
          value: "",
          maxDiscount: "",
          minPurchase: "",
          maxUses: "",
          expiresAt: "",
          description: "",
        });
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.error || "Error creating coupon");
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.isActive)
      return { label: "Inactivo", variant: "secondary" as const };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return { label: "Expirado", variant: "destructive" as const };
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return { label: "Agotado", variant: "destructive" as const };
    }
    return { label: "Activo", variant: "default" as const };
  };

  // Summary statistics
  const activeCoupons = coupons.filter((c) => {
    if (!c.isActive) return false;
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
    if (c.maxUses && c.usedCount >= c.maxUses) return false;
    return true;
  }).length;

  const totalUses = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cupones</h1>
          <p className="text-muted-foreground">
            Crea y administra cupones de descuento para tu tienda
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Cupón
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cupón</DialogTitle>
              <DialogDescription>
                Configura los detalles del cupón de descuento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código del Cupón</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="DESCUENTO10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "PERCENTAGE" | "FIXED") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Porcentaje</SelectItem>
                      <SelectItem value="FIXED">Monto Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">
                    {formData.type === "PERCENTAGE"
                      ? "Porcentaje (%)"
                      : "Monto ($)"}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    placeholder={formData.type === "PERCENTAGE" ? "10" : "100"}
                    required
                  />
                </div>
              </div>

              {formData.type === "PERCENTAGE" && (
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">
                    Descuento Máximo (opcional)
                  </Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: e.target.value })
                    }
                    placeholder="500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="minPurchase">Compra Mínima</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  value={formData.minPurchase}
                  onChange={(e) =>
                    setFormData({ ...formData, minPurchase: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Usos Máximos</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value })
                    }
                    placeholder="Sin límite"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Fecha de Expiración</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Cupón de bienvenida para nuevos clientes"
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creando..." : "Crear Cupón"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cupones</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeCoupons}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Usos</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.length > 0 ? (totalUses / coupons.length).toFixed(1) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cupones</CardTitle>
              <CardDescription>
                Lista de todos los cupones de descuento
              </CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <div className="text-center">
                <Tag className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No hay cupones creados
                </p>
                <Button
                  variant="link"
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-2"
                >
                  Crear primer cupón
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Compra Mín.</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCode(coupon.code)}
                          >
                            {copiedCode === coupon.code ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {coupon.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coupon.type === "PERCENTAGE" ? (
                            <>
                              <Percent className="h-4 w-4" />
                              {coupon.discount}%
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(coupon.discount)}
                            </>
                          )}
                        </div>
                        {coupon.maxDiscount && (
                          <p className="text-xs text-muted-foreground">
                            Máx: {formatCurrency(coupon.maxDiscount)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {coupon.minPurchase > 0 ? (
                          formatCurrency(coupon.minPurchase)
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {coupon.usedCount}
                          {coupon.maxUses && (
                            <span className="text-muted-foreground">
                              /{coupon.maxUses}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.expiresAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(coupon.expiresAt), "dd/MM/yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Sin límite
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={coupon.isActive} disabled />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
