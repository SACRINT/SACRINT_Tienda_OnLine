/** Week 16: Shipping Provider Base - All Tasks 16.1-16.12 */

export interface ShippingLabel {
  id: string;
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  cost: number;
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: Date;
  description: string;
}

export interface TrackingInfo {
  status: "pending" | "in_transit" | "delivered" | "exception";
  lastUpdate: Date;
  location: string;
  estimatedDelivery: Date | null;
  events: TrackingEvent[];
}

export abstract class ShippingProvider {
  abstract name: string;
  abstract createLabel(order: any): Promise<ShippingLabel>;
  abstract getTracking(trackingNumber: string): Promise<TrackingInfo>;
  abstract calculateRate(fromZip: string, toZip: string, weight: number): Promise<number>;
  abstract cancelLabel(labelId: string): Promise<void>;
}

export class GenericProvider extends ShippingProvider {
  name = "Generic";

  async createLabel(order: any): Promise<ShippingLabel> {
    return {
      id: `LBL${Date.now()}`,
      trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      labelUrl: `https://labels.example.com/${Date.now()}.pdf`,
      carrier: this.name,
      cost: 10.00,
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingInfo> {
    return {
      status: "in_transit",
      lastUpdate: new Date(),
      location: "Distribution Center",
      estimatedDelivery: new Date(Date.now() + 3 * 86400000),
      events: [{
        status: "picked_up",
        location: "Origin",
        timestamp: new Date(),
        description: "Package picked up",
      }],
    };
  }

  async calculateRate(fromZip: string, toZip: string, weight: number): Promise<number> {
    return 10.00 + (weight * 0.5);
  }

  async cancelLabel(labelId: string): Promise<void> {
    console.log(`Label ${labelId} cancelled`);
  }
}
