"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingDown,
  TrendingUp,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/analytics/types";
import { format } from "date-fns";

interface StockData {
  summary: {
    totalProducts: number;
    outOfStockCount: number;
    lowStockCount: number;
    inStockCount: number;
    totalInventoryValue: number;
    lowStockThreshold: number;
  };
  products: {
    outOfStock: Product[];
    lowStock: Product[];
  };
  recentChanges: StockChange[];
  generatedAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  price: number;
  category: string | null;
  status: string;
}

interface StockChange {
  id: string;
  action: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function StockManagementPage() {
  const { data: session } = useSession();
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(
    null,
  );
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStockData = async () => {
    if (!session?.user?.tenantId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/products/stock?tenantId=${session.user.tenantId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setStockData(data);
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [session]);

  const handleStockAdjustment = async () => {
    if (!adjustingProduct || !session?.user?.tenantId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/products/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: session.user.tenantId,
          productId: adjustingProduct.id,
          adjustment,
          reason,
        }),
      });

      if (res.ok) {
        setAdjustingProduct(null);
        setAdjustment(0);
        setReason("");
        fetchStockData();
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Failed to load stock data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Management</h1>
        <p className="text-muted-foreground">
          Monitor inventory levels and manage stock across all products
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stockData.summary.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stockData.summary.outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Needs restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stockData.summary.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Below {stockData.summary.lowStockThreshold} units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stockData.summary.totalInventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts Tabs */}
      <Tabs defaultValue="out-of-stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="out-of-stock">
            Out of Stock ({stockData.products.outOfStock.length})
          </TabsTrigger>
          <TabsTrigger value="low-stock">
            Low Stock ({stockData.products.lowStock.length})
          </TabsTrigger>
          <TabsTrigger value="history">Stock History</TabsTrigger>
        </TabsList>

        <TabsContent value="out-of-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Out of Stock Products</CardTitle>
              <CardDescription>
                Products that need immediate restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockData.products.outOfStock.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      All products are in stock
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockData.products.outOfStock.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.sku || "-"}</TableCell>
                        <TableCell>{product.category || "-"}</TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Out of Stock</Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdjustingProduct(product)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Stock
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Adjust Stock - {product.name}
                                </DialogTitle>
                                <DialogDescription>
                                  Add or remove stock for this product
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Current Stock: {product.stock}</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        setAdjustment(
                                          Math.max(0, adjustment - 1),
                                        )
                                      }
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                      type="number"
                                      value={adjustment}
                                      onChange={(e) =>
                                        setAdjustment(
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="text-center"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        setAdjustment(adjustment + 1)
                                      }
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    New stock: {product.stock + adjustment}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="reason">
                                    Reason (optional)
                                  </Label>
                                  <Input
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g., Restocked from supplier"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleStockAdjustment}
                                  disabled={submitting || adjustment === 0}
                                >
                                  {submitting ? "Updating..." : "Update Stock"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Products</CardTitle>
              <CardDescription>
                Products below the low stock threshold (
                {stockData.summary.lowStockThreshold} units)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockData.products.lowStock.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No products with low stock
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockData.products.lowStock.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>{product.sku || "-"}</TableCell>
                        <TableCell>{product.category || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-yellow-600">
                            {product.stock} units
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAdjustingProduct(product)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Restock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Change History</CardTitle>
              <CardDescription>
                Recent stock adjustments (last 7 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockData.recentChanges.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No recent stock changes
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockData.recentChanges.map((change) => (
                      <TableRow key={change.id}>
                        <TableCell>
                          {format(
                            new Date(change.createdAt),
                            "MMM d, yyyy HH:mm",
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{change.action}</Badge>
                        </TableCell>
                        <TableCell>
                          {change.metadata?.adjustment && (
                            <div className="flex items-center gap-1">
                              {change.metadata.adjustment > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span>
                                {change.metadata.previousStock} →{" "}
                                {change.metadata.newStock}
                              </span>
                            </div>
                          )}
                          {change.metadata?.reason && (
                            <p className="text-sm text-muted-foreground">
                              {change.metadata.reason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {change.user.name || change.user.email}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
