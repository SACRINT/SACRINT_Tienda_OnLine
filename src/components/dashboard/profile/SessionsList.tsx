/**
 * Sessions List
 * Semana 9.8: Profile Management - Active Sessions
 */

"use client";

import { useState } from "react";
import { User, Session } from "@prisma/client";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SessionsListProps {
  user: User & {
    sessions: Session[];
  };
}

export function SessionsList({ user }: SessionsListProps) {
  const router = useRouter();
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("¿Estás seguro de cerrar esta sesión?")) return;

    try {
      setRevoking(sessionId);

      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al revocar sesión");
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (
      !confirm(
        "¿Estás seguro de cerrar todas las sesiones? Deberás iniciar sesión nuevamente."
      )
    )
      return;

    try {
      const response = await fetch(`/api/user/sessions`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al revocar sesiones");
      }

      // Redirect to login
      window.location.href = "/login";
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return Monitor;
    if (userAgent.includes("Mobile")) return Smartphone;
    if (userAgent.includes("Tablet")) return Tablet;
    return Monitor;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sesiones Activas
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Administra tus sesiones activas y cierra las que no reconozcas
        </p>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {user.sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay sesiones activas
          </div>
        ) : (
          user.sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.userAgent || undefined);

            return (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      <DeviceIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {session.userAgent || "Dispositivo Desconocido"}
                      </h4>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>IP: {session.ipAddress || "Desconocida"}</p>
                        <p>
                          Última actividad:{" "}
                          {new Date(session.updatedAt).toLocaleString("es-MX")}
                        </p>
                        <p>
                          Creada:{" "}
                          {new Date(session.createdAt).toLocaleString("es-MX")}
                        </p>
                      </div>
                      {session.isCurrent && (
                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          Sesión Actual
                        </span>
                      )}
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Cerrar sesión"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Revoke All Button */}
      {user.sessions.length > 1 && (
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handleRevokeAllSessions}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Cerrar Todas las Sesiones
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Esto cerrará todas las sesiones en todos los dispositivos,
            incluyendo esta.
          </p>
        </div>
      )}
    </div>
  );
}
