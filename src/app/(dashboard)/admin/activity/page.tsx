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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Filter,
  RefreshCw,
  User,
  Package,
  ShoppingCart,
  DollarSign,
  Settings,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: "",
    entityType: "",
    userId: "",
  });

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchLogs();
    }
  }, [session]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId: session?.user?.tenantId || "",
        ...(filter.action && { action: filter.action }),
        ...(filter.entityType && { entityType: filter.entityType }),
        ...(filter.userId && { userId: filter.userId }),
      });

      const res = await fetch(`/api/activity?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (entityType: string) => {
    const icons: Record<string, any> = {
      PRODUCT: Package,
      ORDER: ShoppingCart,
      USER: User,
      TENANT: Settings,
      REFUND: DollarSign,
    };
    const Icon = icons[entityType] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE"))
      return <Badge className="bg-green-500">Create</Badge>;
    if (action.includes("UPDATE"))
      return <Badge className="bg-blue-500">Update</Badge>;
    if (action.includes("DELETE"))
      return <Badge className="bg-red-500">Delete</Badge>;
    if (action.includes("REFUND"))
      return <Badge className="bg-orange-500">Refund</Badge>;
    if (action.includes("BULK"))
      return <Badge className="bg-purple-500">Bulk</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Activity Logs
          </h1>
          <p className="text-gray-600">Monitor all system activity</p>
        </div>
        <Button onClick={fetchLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select
                value={filter.action}
                onValueChange={(value) =>
                  setFilter({ ...filter, action: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="PRODUCT_UPDATE">Product Update</SelectItem>
                  <SelectItem value="ORDER_STATUS_UPDATE">
                    Order Status
                  </SelectItem>
                  <SelectItem value="ORDER_REFUND">Refund</SelectItem>
                  <SelectItem value="BULK_">Bulk Operations</SelectItem>
                  <SelectItem value="SETTINGS_UPDATE">Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select
                value={filter.entityType}
                onValueChange={(value) =>
                  setFilter({ ...filter, entityType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Entities</SelectItem>
                  <SelectItem value="PRODUCT">Products</SelectItem>
                  <SelectItem value="ORDER">Orders</SelectItem>
                  <SelectItem value="USER">Users</SelectItem>
                  <SelectItem value="TENANT">Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchLogs} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({logs.length})</CardTitle>
          <CardDescription>Recent activity in your store</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No activity logs found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.entityType)}
                        <span className="text-sm">{log.entityType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.user.name || log.user.email}
                    </TableCell>
                    <TableCell>
                      {log.metadata && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:underline">
                            View metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
