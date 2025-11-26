/**
 * Week 16 Task 16.1: Shipping Provider Interface
 * Base interface for all shipping providers
 */

export interface TrackingEvent {
  status: string;
  timestamp: Date;
  location: string;
  message: string;
}

export interface TrackingInfo {
  status: "pending" | "in_transit" | "delivered" | "exception";
  lastUpdate: Date;
  location: string;
  estimatedDelivery: Date | null;
  events: TrackingEvent[];
}

export interface Label {
  id: string;
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  cost: number;
}

export interface ShippingProvider {
  name: string;
  createLabel(order: any): Promise<Label>;
  getTracking(trackingNumber: string): Promise<TrackingInfo>;
  calculateRate(fromZip: string, toZip: string, weight: number): Promise<number>;
  cancelLabel(labelId: string): Promise<void>;
}

export function calculateWeight(order: any): number {
  // Default 500g per item
  return order.items.length * 0.5;
}

export function getProvider(name: string): ShippingProvider {
  const providers: Record<string, any> = {
    ESTAFETA: require('./estafeta').EstafetaProvider,
    MERCADO_ENVIOS: require('./mercado-envios').MercadoEnviosProvider,
  };
  const ProviderClass = providers[name];
  return new ProviderClass();
}
