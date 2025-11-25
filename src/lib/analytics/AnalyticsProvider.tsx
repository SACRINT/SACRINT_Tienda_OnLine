/**
 * Analytics Provider Component
 * Inicializa y gestiona el servicio de analytics
 */

"use client";

import { ReactNode } from "react";
import analytics from "./events";
import { usePageTracking } from "./hooks";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Track page views automticamente
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