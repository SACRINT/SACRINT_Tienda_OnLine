/**
 * Analytics API Routes & Data Endpoints
 * Semana 35, Tarea 35.3: Analytics API Routes & Data Endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getAnalyticsDashboard, getPaymentAnalytics, getCampaignAnalytics } from "@/lib/analytics";
import { logger } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dashboardId = request.nextUrl.searchParams.get("dashboardId");
    const tenantId = request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const dashboard = getAnalyticsDashboard();

    if (dashboardId) {
      const dashboardData = dashboard.getDashboard(dashboardId);
      if (!dashboardData) {
        return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        dashboard: dashboardData,
      });
    }

    // Obtener datos para dashboards por defecto
    const paymentAnalytics = getPaymentAnalytics();
    const campaignAnalytics = getCampaignAnalytics();

    const metrics = paymentAnalytics.getPaymentMetrics(tenantId);
    const dailyRevenue = paymentAnalytics.getDailyRevenue(tenantId, 30);
    const monthlyRevenue = paymentAnalytics.getMonthlyRevenue(tenantId, 12);

    logger.info(
      { type: "analytics_dashboard_fetched", tenantId },
      `Dashboard de analytics obtenido`,
    );

    return NextResponse.json({
      success: true,
      metrics: {
        payment: metrics,
        dailyRevenue,
        monthlyRevenue,
      },
    });
  } catch (error) {
    logger.error(
      { type: "analytics_fetch_error", error: String(error) },
      "Error al obtener analytics",
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { dashboardId, name, layout, widgets } = body;

    const dashboard = getAnalyticsDashboard();
    const newDashboard = dashboard.createDashboard(name, layout, 2, 6);

    if (widgets && Array.isArray(widgets)) {
      widgets.forEach((widget) => {
        dashboard.addWidget(newDashboard.id, widget);
      });
    }

    logger.info(
      { type: "analytics_dashboard_created", dashboardId: newDashboard.id },
      `Nuevo dashboard de analytics creado`,
    );

    return NextResponse.json({
      success: true,
      dashboard: newDashboard,
    });
  } catch (error) {
    logger.error(
      { type: "dashboard_creation_error", error: String(error) },
      "Error al crear dashboard",
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
