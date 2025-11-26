/**
 * Shipping Provider Manager - Task 16.4
 * Centralized provider selection and instantiation
 */

import { ShippingProvider as ShippingProviderInterface } from "./providers/base-provider";
import { EstafetaProvider } from "./providers/estafeta";
import { MercadoEnviosProvider } from "./providers/mercado-envios";

export type ShippingProviderType = "ESTAFETA" | "MERCADO_ENVIOS" | "FEDEX" | "DHL" | "UPS" | "CUSTOM";

export function getProvider(providerType: ShippingProviderType): ShippingProviderInterface {
  switch (providerType) {
    case "ESTAFETA":
      return new EstafetaProvider();
    case "MERCADO_ENVIOS":
      return new MercadoEnviosProvider();
    case "FEDEX":
    case "DHL":
    case "UPS":
    case "CUSTOM":
      throw new Error(`Provider ${providerType} not yet implemented`);
    default:
      throw new Error(`Unknown provider: ${providerType}`);
  }
}

export function getSupportedProviders(): ShippingProviderType[] {
  return ["ESTAFETA", "MERCADO_ENVIOS"];
}

export function isProviderSupported(providerType: string): providerType is ShippingProviderType {
  return getSupportedProviders().includes(providerType as ShippingProviderType);
}
