/**
 * Botón accesible con ARIA labels
 * Cumple WCAG AA
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
}

export function AccessibleButton({
  children,
  ariaLabel,
  ariaDescribedBy,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${isLoading ? 'is-loading' : ''}`}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-describedby={ariaDescribedBy}
      aria-busy={isLoading}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span aria-hidden="true">⏳</span>}
      <span>{children}</span>
    </button>
  );
}
