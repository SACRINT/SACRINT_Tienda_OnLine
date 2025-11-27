/**
 * Checkout Component & UI
 * Semana 35, Tarea 35.5: Checkout Component & UI
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CheckoutFormProps {
  orderId: string;
  amount: number;
  currency: string;
  customerId: string;
}

interface FormData {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  cardholderName: string;
  email: string;
  country: string;
  state: string;
  zipCode: string;
}

export function CheckoutForm({ orderId, amount, currency, customerId }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fraudWarning, setFraudWarning] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    cardholderName: "",
    email: "",
    country: "",
    state: "",
    zipCode: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          paymentMethod: "card",
          customerId,
          metadata: {
            cardholderName: formData.cardholderName,
            country: formData.country,
            email: formData.email,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Payment processing failed");
        return;
      }

      if (data.fraudScore?.riskLevel === "high" || data.fraudScore?.riskLevel === "medium") {
        setFraudWarning(true);
      }

      setSuccess(true);
      router.push(`/orders/${orderId}/confirmation`);
    } catch (err) {
      setError("An error occurred during payment processing");
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <h3 className="text-lg font-semibold text-green-900">Payment Successful</h3>
        <p className="mt-2 text-green-700">Your order has been processed successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-900">Order Summary</h3>
        <div className="mt-4 flex justify-between">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-semibold text-gray-900">
            {amount} {currency}
          </span>
        </div>
      </div>

      {/* Fraud Warning */}
      {fraudWarning && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">
            This transaction is being reviewed for verification purposes.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Checkout Form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 p-6">
        {/* Personal Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Cardholder Name</label>
          <input
            type="text"
            name="cardholderName"
            value={formData.cardholderName}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="john@example.com"
          />
        </div>

        {/* Card Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Card Number</label>
          <input
            type="text"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="4242 4242 4242 4242"
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
            <input
              type="text"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CVC</label>
            <input
              type="text"
              name="cvc"
              value={formData.cvc}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="123"
              maxLength={4}
            />
          </div>
        </div>

        {/* Billing Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <select
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select a country</option>
            <option value="US">United States</option>
            <option value="AR">Argentina</option>
            <option value="MX">Mexico</option>
            <option value="BR">Brazil</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : `Pay ${amount} ${currency}`}
        </button>
      </form>
    </div>
  );
}
