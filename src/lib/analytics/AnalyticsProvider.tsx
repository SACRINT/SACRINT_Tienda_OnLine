/**
 * Analytics Provider Component
 * Inicializa y gestiona el servicio de analytics
 */

"use client";

import { useEffect, ReactNode } from "react";
import { analytics } from "./events";
import { usePageTracking } from "./hooks";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Inicializar analytics en el montaje
  useEffect(() => {
    analytics.initialize();
  }, []);

  // Track page views automáticamente
  usePageTracking();

  return (
    <>
      {children}
      {/* Vercel Analytics */}
      <VercelAnalytics />
    </>
  );
}

export default AnalyticsProvider;
