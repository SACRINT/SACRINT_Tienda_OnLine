// Payment Provider Factory
// Week 19-20: Centralized provider management

import {
  IPaymentProvider,
  IPaymentProviderFactory,
  PaymentProvider,
} from "./payment-provider.interface";
import { StripePaymentProvider } from "./providers/stripe-provider";
import { PayPalPaymentProvider } from "./providers/paypal-provider";

/**
 * Singleton factory for managing payment providers
 */
export class PaymentProviderFactory implements IPaymentProviderFactory {
  private static instance: PaymentProviderFactory;
  private providers: Map<PaymentProvider, IPaymentProvider>;
  private defaultProvider: PaymentProvider;

  private constructor() {
    this.providers = new Map();
    this.defaultProvider = PaymentProvider.STRIPE;

    // Initialize providers
    this.registerProvider(new StripePaymentProvider());
    this.registerProvider(new PayPalPaymentProvider());

    // TODO: Add more providers
    // this.registerProvider(new MercadoPagoProvider());
    // this.registerProvider(new OpenPayProvider());
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PaymentProviderFactory {
    if (!PaymentProviderFactory.instance) {
      PaymentProviderFactory.instance = new PaymentProviderFactory();
    }
    return PaymentProviderFactory.instance;
  }

  /**
   * Register a payment provider
   */
  private registerProvider(provider: IPaymentProvider): void {
    this.providers.set(provider.provider, provider);
  }

  /**
   * Get a specific payment provider
   */
  getProvider(provider: PaymentProvider): IPaymentProvider {
    const paymentProvider = this.providers.get(provider);

    if (!paymentProvider) {
      throw new Error(`Payment provider ${provider} not registered`);
    }

    if (!paymentProvider.isConfigured) {
      console.warn(
        `Payment provider ${provider} is not configured. Check environment variables.`,
      );
    }

    return paymentProvider;
  }

  /**
   * Get the default payment provider
   */
  getDefaultProvider(): IPaymentProvider {
    return this.getProvider(this.defaultProvider);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): IPaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all configured (ready to use) providers
   */
  getConfiguredProviders(): IPaymentProvider[] {
    return this.getAllProviders().filter((p) => p.isConfigured);
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: PaymentProvider): boolean {
    try {
      const paymentProvider = this.getProvider(provider);
      return paymentProvider.isConfigured;
    } catch {
      return false;
    }
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(provider: PaymentProvider): void {
    if (!this.isProviderAvailable(provider)) {
      throw new Error(
        `Cannot set ${provider} as default: provider not configured`,
      );
    }
    this.defaultProvider = provider;
  }

  /**
   * Get provider by name (case-insensitive)
   */
  getProviderByName(name: string): IPaymentProvider {
    const providerEnum = Object.values(PaymentProvider).find(
      (p) => p.toLowerCase() === name.toLowerCase(),
    );

    if (!providerEnum) {
      throw new Error(`Unknown payment provider: ${name}`);
    }

    return this.getProvider(providerEnum);
  }
}

/**
 * Export singleton instance
 */
export const paymentProviderFactory = PaymentProviderFactory.getInstance();

/**
 * Convenience function to get default provider
 */
export function getPaymentProvider(
  provider?: PaymentProvider,
): IPaymentProvider {
  if (provider) {
    return paymentProviderFactory.getProvider(provider);
  }
  return paymentProviderFactory.getDefaultProvider();
}
