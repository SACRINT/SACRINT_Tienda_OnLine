// Form Field Component
// Wrapper component for form fields with label, error, and description

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  children,
  label,
  description,
  error,
  required,
  className,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Form Section for grouping related fields
export interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function FormSection({
  children,
  title,
  description,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Form Actions for submit/cancel buttons
export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right" | "between";
}

export function FormActions({
  children,
  className,
  align = "right",
}: FormActionsProps) {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 pt-4",
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}
