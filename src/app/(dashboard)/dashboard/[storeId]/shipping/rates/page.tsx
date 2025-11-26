/**
 * Carrier Rates Comparison UI - Task 16.9
 * Dashboard page for comparing shipping rates across providers
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface RateComparison {
  provider: string;
  rate: number;
  estimatedDays?: number;
}

export default function ShippingRatesPage() {
  const [fromZip, setFromZip] = useState("");
  const [toZip, setToZip] = useState("");
  const [weight, setWeight] = useState("");
  const [rates, setRates] = useState<RateComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompareRates = async () => {
    if (!fromZip || !toZip || !weight) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shipping/compare-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromZip,
          toZip,
          weight: parseFloat(weight),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch rates");
      }

      const data = await response.json();
      setRates(data.rates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendation = (rates: RateComparison[]): string | null => {
    if (rates.length === 0) return null;

    const cheapest = rates.reduce((prev, current) =>
      prev.rate < current.rate ? prev : current
    );

    const fastest = rates.reduce((prev, current) =>
      (prev.estimatedDays || 999) < (current.estimatedDays || 999) ? prev : current
    );

    if (cheapest.provider === fastest.provider) {
      return cheapest.provider;
    }

    // Balance between cost and speed
    const costThreshold = 1.2; // Accept 20% higher cost for 1 day faster
    const balancedOption = rates.find((r) => {
      const costRatio = r.rate / cheapest.rate;
      const speedGain = (cheapest.estimatedDays || 5) - (r.estimatedDays || 5);
      return costRatio <= costThreshold && speedGain >= 1;
    });

    return balancedOption?.provider || cheapest.provider;
  };

  const recommendation = getRecommendation(rates);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Shipping Rates Comparison</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Compare Carrier Rates</CardTitle>
          <CardDescription>
            Enter shipment details to compare rates across all available carriers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="fromZip">From ZIP Code</Label>
              <Input
                id="fromZip"
                placeholder="06600"
                value={fromZip}
                onChange={(e) => setFromZip(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="toZip">To ZIP Code</Label>
              <Input
                id="toZip"
                placeholder="64000"
                value={toZip}
                onChange={(e) => setToZip(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="1.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <Button onClick={handleCompareRates} disabled={loading}>
            {loading ? "Loading..." : "Compare Rates"}
          </Button>
        </CardContent>
      </Card>

      {rates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rates.map((rate) => (
            <Card
              key={rate.provider}
              className={rate.provider === recommendation ? "border-green-500 border-2" : ""}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{rate.provider.replace(/_/g, " ")}</span>
                  {rate.provider === recommendation && (
                    <Badge variant="default" className="bg-green-500">
                      Recommended
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {rate.estimatedDays ? `${rate.estimatedDays} business days` : "Standard delivery"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  ${rate.rate.toFixed(2)}
                </div>
                <Button className="w-full" variant="outline">
                  Select Carrier
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rates.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Rate Comparison Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cheapest</p>
                <p className="text-lg font-semibold">
                  {rates.reduce((prev, current) => (prev.rate < current.rate ? prev : current)).provider}
                </p>
                <p className="text-sm">
                  ${rates.reduce((prev, current) => (prev.rate < current.rate ? prev : current)).rate.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fastest</p>
                <p className="text-lg font-semibold">
                  {rates.reduce((prev, current) =>
                    (prev.estimatedDays || 999) < (current.estimatedDays || 999) ? prev : current
                  ).provider}
                </p>
                <p className="text-sm">
                  {rates.reduce((prev, current) =>
                    (prev.estimatedDays || 999) < (current.estimatedDays || 999) ? prev : current
                  ).estimatedDays} days
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Rate</p>
                <p className="text-lg font-semibold">
                  ${(rates.reduce((sum, r) => sum + r.rate, 0) / rates.length).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Providers Compared</p>
                <p className="text-lg font-semibold">{rates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
