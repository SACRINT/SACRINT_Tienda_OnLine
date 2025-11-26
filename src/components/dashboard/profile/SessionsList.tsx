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
    if (!confirm("¿Estás seguro de cerrar todas las sesiones? Deberás iniciar sesión nuevamente."))
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Sesiones Activas</h3>
        <p className="mb-6 text-sm text-gray-600">
          Administra tus sesiones activas y cierra las que no reconozcas
        </p>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {user.sessions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No hay sesiones activas</div>
        ) : (
          user.sessions.map((session) => {
            const DeviceIcon = Smartphone;

            return (
              <div
                key={session.id}
                className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded bg-gray-100 p-2">
                      <DeviceIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Sesión Activa</h4>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p>Token: {session.sessionToken.substring(0, 16)}...</p>
                        <p>Expira: {new Date(session.expires).toLocaleString("es-MX")}</p>
                      </div>
                      {false && (
                        <span className="mt-2 inline-block rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Sesión Actual
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revoking === session.id}
                    className="rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Cerrar sesión"
                  >
                    <X className="h-5 w-5" />
                  </button>
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
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Cerrar Todas las Sesiones
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Esto cerrará todas las sesiones en todos los dispositivos, incluyendo esta.
          </p>
        </div>
      )}
    </div>
  );
}
