// Confirmation Dialog Component
// Modal dialog for confirming actions

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Trash2,
  LogOut,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import { Button } from "./button";

export type ConfirmationType = "danger" | "warning" | "info";

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  type?: ConfirmationType;
  icon?: LucideIcon;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  className?: string;
}

const typeStyles: Record<
  ConfirmationType,
  {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    buttonVariant: "destructive" | "default";
  }
> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100 dark:bg-red-900",
    iconColor: "text-red-600 dark:text-red-400",
    buttonVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-yellow-100 dark:bg-yellow-900",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    buttonVariant: "default",
  },
  info: {
    icon: AlertCircle,
    iconBg: "bg-blue-100 dark:bg-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
    buttonVariant: "default",
  },
};

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  type = "danger",
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading,
  className,
}: ConfirmationDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const {
    icon: DefaultIcon,
    iconBg,
    iconColor,
    buttonVariant,
  } = typeStyles[type];
  const Icon = icon || DefaultIcon;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6",
          className,
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
          <div
            className={cn(
              "flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full mb-4 sm:mb-0 sm:mr-4",
              iconBg,
            )}
          >
            <Icon className={cn("h-6 w-6", iconColor)} aria-hidden="true" />
          </div>

          <div className="flex-1">
            <h3 id="dialog-title" className="text-lg font-semibold">
              {title}
            </h3>
            {description && (
              <p
                id="dialog-description"
                className="mt-2 text-sm text-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading || loading}
          >
            {(isLoading || loading) && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Preset dialogs
export function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  itemName = "this item",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  loading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      type="danger"
      icon={Trash2}
      title={`Delete ${itemName}?`}
      description="This action cannot be undone. This will permanently delete the item and all associated data."
      confirmLabel="Delete"
      loading={loading}
    />
  );
}

export function LogoutConfirmationDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      type="warning"
      icon={LogOut}
      title="Sign out?"
      description="Are you sure you want to sign out? You will need to sign in again to access your account."
      confirmLabel="Sign out"
    />
  );
}

export default ConfirmationDialog;
