// Error Boundary Component
"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/lib/monitoring/logger";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error
    logger.error(
      { error, componentStack: errorInfo.componentStack },
      "React error boundary caught error",
    );

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback(this.state.error!, this.handleReset);
        }
        return this.props.fallback;
      }

      // Default fallback
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-red-800">Algo salió mal</h2>
          <p className="mb-4 text-red-600">
            Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
          </p>
          {this.props.showDetails && this.state.error && (
            <pre className="mb-4 overflow-auto rounded bg-red-100 p-2 text-xs">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName =
    "WithErrorBoundary(" +
    (WrappedComponent.displayName || WrappedComponent.name || "Component") +
    ")";

  return WithErrorBoundary;
}

// Suspense error boundary
export interface SuspenseErrorBoundaryProps extends ErrorBoundaryProps {
  loadingFallback?: ReactNode;
}

export function SuspenseErrorBoundary({
  children,
  loadingFallback,
  ...errorProps
}: SuspenseErrorBoundaryProps): JSX.Element {
  return (
    <ErrorBoundary {...errorProps}>
      <React.Suspense fallback={loadingFallback || <DefaultLoading />}>{children}</React.Suspense>
    </ErrorBoundary>
  );
}

function DefaultLoading(): JSX.Element {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
    </div>
  );
}
