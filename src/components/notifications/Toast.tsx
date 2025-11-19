"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  Check,
  X,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "warning" | "info" | "loading"

export interface ToastData {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps extends ToastData {
  onClose: (id: string) => void
}

function Toast({ id, type, title, message, action, onClose }: ToastProps) {
  const icons = {
    success: <Check className="h-5 w-5 text-success" />,
    error: <X className="h-5 w-5 text-error" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-primary" />,
    loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
  }

  const bgColors = {
    success: "bg-success/10 border-success/20",
    error: "bg-error/10 border-error/20",
    warning: "bg-warning/10 border-warning/20",
    info: "bg-primary/10 border-primary/20",
    loading: "bg-primary/10 border-primary/20",
  }

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg",
        "animate-in slide-in-from-right-full fade-in duration-200",
        bgColors[type]
      )}
      role="alert"
    >
      <div className="shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {message && (
          <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-medium text-primary hover:underline mt-1"
          >
            {action.label}
          </button>
        )}
      </div>
      {type !== "loading" && (
        <button
          onClick={() => onClose(id)}
          className="shrink-0 p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}

// Toast Container with Context
interface ToastContextType {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, "id">) => string
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  loading: (title: string, message?: string) => string
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const addToast = React.useCallback(
    (toast: Omit<ToastData, "id">): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newToast: ToastData = { ...toast, id }

      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss
      if (toast.type !== "loading" && toast.duration !== 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, toast.duration || 5000)
      }

      return id
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = React.useCallback(
    (title: string, message?: string) => {
      addToast({ type: "success", title, message })
    },
    [addToast]
  )

  const error = React.useCallback(
    (title: string, message?: string) => {
      addToast({ type: "error", title, message })
    },
    [addToast]
  )

  const warning = React.useCallback(
    (title: string, message?: string) => {
      addToast({ type: "warning", title, message })
    },
    [addToast]
  )

  const info = React.useCallback(
    (title: string, message?: string) => {
      addToast({ type: "info", title, message })
    },
    [addToast]
  )

  const loading = React.useCallback(
    (title: string, message?: string): string => {
      return addToast({ type: "loading", title, message, duration: 0 })
    },
    [addToast]
  )

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    loading,
    dismiss: removeToast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
            {toasts.map((toast) => (
              <Toast key={toast.id} {...toast} onClose={removeToast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Standalone toast function (for use outside React components)
let toastRef: ToastContextType | null = null

export function setToastRef(ref: ToastContextType) {
  toastRef = ref
}

export const toast = {
  success: (title: string, message?: string) => {
    toastRef?.success(title, message)
  },
  error: (title: string, message?: string) => {
    toastRef?.error(title, message)
  },
  warning: (title: string, message?: string) => {
    toastRef?.warning(title, message)
  },
  info: (title: string, message?: string) => {
    toastRef?.info(title, message)
  },
  loading: (title: string, message?: string) => {
    return toastRef?.loading(title, message) || ""
  },
  dismiss: (id: string) => {
    toastRef?.dismiss(id)
  },
}
