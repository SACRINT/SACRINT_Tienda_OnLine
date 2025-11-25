/**
 * useToast Hook
 * Semana 9.11: Error Handling - Toast Notifications
 *
 * Hook para mostrar notificaciones toast
 */

"use client";

import { useState, useCallback } from "react";
import { ToastType, ToastProps } from "@/components/dashboard/errors/Toast";

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration?: number
    ) => {
      const id = `toast-${++toastId}`;

      const toast: ToastProps = {
        id,
        type,
        title,
        message,
        duration,
        onClose: (id) => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        },
      };

      setToasts((prev) => [...prev, toast]);

      return id;
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast("success", title, message, duration);
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast("error", title, message, duration);
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast("warning", title, message, duration);
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast("info", title, message, duration);
    },
    [addToast]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast,
  };
}
