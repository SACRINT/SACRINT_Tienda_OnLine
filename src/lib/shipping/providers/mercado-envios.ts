/**
 * Week 16 Task 16.3: Mercado Envíos Integration
 */

import { ShippingProvider, Label, TrackingInfo } from "./base-provider";

export class MercadoEnviosProvider implements ShippingProvider {
  name = "MERCADO_ENVIOS";

  async createLabel(order: any): Promise<Label> {
    return {
      id: `ME${Date.now()}`,
      trackingNumber: `ME${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      labelUrl: `https://mercadoenvios.com.mx/labels/${Date.now()}.pdf`,
      carrier: "MERCADO_ENVIOS",
      cost: 65.00,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingInfo> {
    return {
      status: "in_transit",
      lastUpdate: new Date(),
      location: "Centro de distribución",
      estimatedDelivery: new Date(Date.now() + 3 * 86400000),
      events: [],
    };
  }

  async calculateRate(fromZip: string, toZip: string, weight: number): Promise<number> {
    return 45 + (weight * 8);
  }

  async cancelLabel(labelId: string): Promise<void> {
    console.log(`Label ${labelId} cancelled`);
  }
}
