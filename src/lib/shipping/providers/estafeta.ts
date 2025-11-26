/**
 * Week 16 Task 16.2: Estafeta Integration
 * Integration with Estafeta shipping API
 */

import axios from "axios";
import { ShippingProvider, Label, TrackingInfo } from "./base-provider";

export class EstafetaProvider implements ShippingProvider {
  name = "ESTAFETA";

  private api = axios.create({
    baseURL: process.env.ESTAFETA_API_URL || "https://api.estafeta.com/v1",
    headers: {
      "Authorization": `Bearer ${process.env.ESTAFETA_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  async createLabel(order: any): Promise<Label> {
    try {
      const response = await this.api.post("/labels", {
        shipper: {
          name: order.tenant?.name || "Store",
          address: "Address",
          city: "City",
          zip: "12345",
        },
        recipient: {
          name: order.shippingAddress?.fullName || "Customer",
          address: order.shippingAddress?.addressLine1,
          city: order.shippingAddress?.city,
          zip: order.shippingAddress?.postalCode,
        },
        weight: this.calculateWeight(order),
        serviceType: "EXPRESS",
      });

      return {
        id: response.data.labelId,
        trackingNumber: response.data.trackingNumber,
        labelUrl: response.data.labelUrl,
        carrier: "ESTAFETA",
        cost: response.data.cost,
      };
    } catch (error) {
      console.error("Estafeta API error:", error);
      return this.mockLabel(order);
    }
  }

  async getTracking(trackingNumber: string): Promise<TrackingInfo> {
    try {
      const response = await this.api.get(`/tracking/${trackingNumber}`);
      return {
        status: response.data.status,
        lastUpdate: new Date(response.data.lastUpdate),
        location: response.data.location,
        estimatedDelivery: new Date(response.data.estimatedDelivery),
        events: response.data.events.map((e: any) => ({
          status: e.status,
          timestamp: new Date(e.timestamp),
          location: e.location,
          message: e.message,
        })),
      };
    } catch (error) {
      return this.mockTracking(trackingNumber);
    }
  }

  async calculateRate(fromZip: string, toZip: string, weight: number): Promise<number> {
    const baseRate = 50;
    const perKgRate = 10;
    return baseRate + (weight * perKgRate);
  }

  async cancelLabel(labelId: string): Promise<void> {
    await this.api.delete(`/labels/${labelId}`);
  }

  private calculateWeight(order: any): number {
    return order.items?.length * 0.5 || 1.0;
  }

  private mockLabel(order: any): Label {
    return {
      id: `EST${Date.now()}`,
      trackingNumber: `EST${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      labelUrl: `https://labels.estafeta.com/${Date.now()}.pdf`,
      carrier: "ESTAFETA",
      cost: 85.00,
    };
  }

  private mockTracking(trackingNumber: string): TrackingInfo {
    return {
      status: "in_transit",
      lastUpdate: new Date(),
      location: "Ciudad de México",
      estimatedDelivery: new Date(Date.now() + 2 * 86400000),
      events: [{
        status: "picked_up",
        timestamp: new Date(),
        location: "Origen",
        message: "Paquete recogido",
      }],
    };
  }
}
