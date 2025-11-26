/**
 * Returns Dashboard - Task 17.3
 * Admin dashboard for managing return requests
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReturnRequest {
  id: string;
  orderNumber: string;
  customerName: string;
  reason: string;
  refundAmount: string;
  status: string;
  createdAt: string;
}

export default function ReturnsPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, [filter]);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/return-requests?tenantId=${storeId}&status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setReturns(data.returns || []);
      }
    } catch (error) {
      console.error("Failed to load returns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (returnId: string) => {
    if (!confirm("Approve this return request?")) return;

    try {
      const response = await fetch(`/api/return-requests/${returnId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalNotes: "" }),
      });

      if (response.ok) {
        loadReturns();
      }
    } catch (error) {
      console.error("Failed to approve return:", error);
    }
  };

  const handleReject = async (returnId: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/return-requests/${returnId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      if (response.ok) {
        loadReturns();
      }
    } catch (error) {
      console.error("Failed to reject return:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500",
      APPROVED: "bg-blue-500",
      REJECTED: "bg-red-500",
      SHIPPED: "bg-purple-500",
      RECEIVED: "bg-green-500",
      INSPECTED: "bg-teal-500",
      REFUNDED: "bg-green-700",
    };

    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Return Requests</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {["all", "PENDING", "APPROVED", "REJECTED", "REFUNDED"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Returns List</CardTitle>
          <CardDescription>Manage customer return requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : returns.length === 0 ? (
            <p>No return requests found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((returnReq) => (
                  <TableRow key={returnReq.id}>
                    <TableCell className="font-medium">{returnReq.orderNumber}</TableCell>
                    <TableCell>{returnReq.customerName}</TableCell>
                    <TableCell>{returnReq.reason.replace(/_/g, " ")}</TableCell>
                    <TableCell>${returnReq.refundAmount}</TableCell>
                    <TableCell>{getStatusBadge(returnReq.status)}</TableCell>
                    <TableCell>{new Date(returnReq.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {returnReq.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(returnReq.id)}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(returnReq.id)}
                          >
                            Reject
                          </Button>
                        </div>
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
