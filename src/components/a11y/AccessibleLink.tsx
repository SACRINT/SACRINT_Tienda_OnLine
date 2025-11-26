/**
 * Link accesible que indica cuando abre en nueva ventana
 * Cumple WCAG AA
 */

import { ReactNode } from 'react';

interface AccessibleLinkProps {
  href: string;
  children: ReactNode;
  external?: boolean;
  newTab?: boolean;
  className?: string;
}

export function AccessibleLink({
  href,
  children,
  external,
  newTab,
  className,
}: AccessibleLinkProps) {
  const shouldOpenInNewTab = external || newTab;

  return (
    <a
      href={href}
      target={shouldOpenInNewTab ? '_blank' : undefined}
      rel={shouldOpenInNewTab ? 'noopener noreferrer' : undefined}
      aria-label={
        shouldOpenInNewTab
          ? `${typeof children === 'string' ? children : 'Link'} (abre en nueva ventana)`
          : undefined
      }
      className={className}
    >
      {children}
      {shouldOpenInNewTab && (
        <span aria-label="opens in new window" className="external-icon">
          {' '}
          🔗
        </span>
      )}
    </a>
  );
}
