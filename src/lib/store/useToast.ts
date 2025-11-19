// Zustand Store para Toast Notifications
import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove after duration
    const duration = toast.duration || 3000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),
}));

// Helper function for common toasts
export const toast = {
  success: (title: string, message?: string) =>
    useToast.getState().addToast({ type: "success", title, message }),
  error: (title: string, message?: string) =>
    useToast.getState().addToast({ type: "error", title, message }),
  info: (title: string, message?: string) =>
    useToast.getState().addToast({ type: "info", title, message }),
  warning: (title: string, message?: string) =>
    useToast.getState().addToast({ type: "warning", title, message }),
};
