"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
}

const statuses = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PROCESSING", label: "Procesando" },
  { value: "PAID", label: "Pagado" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: OrderStatusUpdaterProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async () => {
    if (status === currentStatus) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        router.refresh();
        alert("Estado actualizado correctamente");
      } else {
        alert("Error al actualizar el estado");
      }
    } catch (error) {
      alert("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {status !== currentStatus && (
        <Button
          onClick={handleUpdateStatus}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Actualizando..." : "Actualizar Estado"}
        </Button>
      )}
    </div>
  );
}
