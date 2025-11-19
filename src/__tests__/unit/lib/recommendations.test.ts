// Recommendation Engine Tests
import {
  getViewBasedRecommendations,
  getFrequentlyBoughtTogether,
  getTrendingProducts,
  combineRecommendations,
  Recommendation,
} from "@/lib/personalization/recommendations";

describe("Recommendation Engine", () => {
  const mockProducts = [
    { id: "prod_1", categoryId: "cat_electronics", tags: ["smartphone", "mobile"] },
    { id: "prod_2", categoryId: "cat_electronics", tags: ["laptop", "computer"] },
    { id: "prod_3", categoryId: "cat_electronics", tags: ["smartphone", "accessory"] },
    { id: "prod_4", categoryId: "cat_clothing", tags: ["shirt", "casual"] },
    { id: "prod_5", categoryId: "cat_clothing", tags: ["pants", "casual"] },
    { id: "prod_6", categoryId: "cat_home", tags: ["furniture", "modern"] },
  ];

  describe("getViewBasedRecommendations", () => {
    it("should return empty array for no viewed products", () => {
      const result = getViewBasedRecommendations([], mockProducts);
      expect(result).toEqual([]);
    });

    it("should recommend products from same category", () => {
      const viewed = ["prod_1"]; // Electronics
      const result = getViewBasedRecommendations(viewed, mockProducts);

      // Should recommend other electronics
      const recommendedIds = result.map((r) => r.productId);
      expect(recommendedIds).toContain("prod_2");
      expect(recommendedIds).toContain("prod_3");
      expect(recommendedIds).not.toContain("prod_1"); // Not the viewed product
    });

    it("should prioritize products with matching tags", () => {
      const viewed = ["prod_1"]; // Has "smartphone" tag
      const result = getViewBasedRecommendations(viewed, mockProducts);

      // prod_3 has "smartphone" tag, so should have higher score
      const prod3Rec = result.find((r) => r.productId === "prod_3");
      const prod2Rec = result.find((r) => r.productId === "prod_2");

      expect(prod3Rec!.score).toBeGreaterThan(prod2Rec!.score);
    });

    it("should respect limit parameter", () => {
      const viewed = ["prod_1"];
      const result = getViewBasedRecommendations(viewed, mockProducts, 2);

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it("should set reason as similar", () => {
      const viewed = ["prod_1"];
      const result = getViewBasedRecommendations(viewed, mockProducts);

      result.forEach((rec) => {
        expect(rec.reason).toBe("similar");
      });
    });

    it("should exclude already viewed products", () => {
      const viewed = ["prod_1", "prod_2"];
      const result = getViewBasedRecommendations(viewed, mockProducts);

      const recommendedIds = result.map((r) => r.productId);
      expect(recommendedIds).not.toContain("prod_1");
      expect(recommendedIds).not.toContain("prod_2");
    });
  });

  describe("getFrequentlyBoughtTogether", () => {
    const orderHistory = [
      { items: ["prod_1", "prod_3", "prod_6"] },
      { items: ["prod_1", "prod_3"] },
      { items: ["prod_1", "prod_2", "prod_3"] },
      { items: ["prod_4", "prod_5"] },
    ];

    it("should return products frequently bought with target", () => {
      const result = getFrequentlyBoughtTogether("prod_1", orderHistory);

      // prod_3 appears in all 3 orders with prod_1
      const prod3Rec = result.find((r) => r.productId === "prod_3");
      expect(prod3Rec).toBeDefined();
      expect(prod3Rec!.score).toBe(3);
    });

    it("should not include the target product", () => {
      const result = getFrequentlyBoughtTogether("prod_1", orderHistory);

      const hasTarget = result.some((r) => r.productId === "prod_1");
      expect(hasTarget).toBe(false);
    });

    it("should set reason as purchased", () => {
      const result = getFrequentlyBoughtTogether("prod_1", orderHistory);

      result.forEach((rec) => {
        expect(rec.reason).toBe("purchased");
      });
    });

    it("should respect limit parameter", () => {
      const result = getFrequentlyBoughtTogether("prod_1", orderHistory, 2);

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it("should return empty for product not in orders", () => {
      const result = getFrequentlyBoughtTogether("prod_999", orderHistory);
      expect(result).toEqual([]);
    });
  });

  describe("getTrendingProducts", () => {
    it("should return products ordered by recency-weighted count", () => {
      const now = new Date();
      const recentOrders = [
        { items: ["prod_1", "prod_2"], createdAt: now },
        { items: ["prod_1"], createdAt: new Date(now.getTime() - 1000) },
        { items: ["prod_3"], createdAt: new Date(now.getTime() - 86400000) }, // 1 day ago
      ];

      const result = getTrendingProducts(recentOrders);

      // prod_1 should be first (2 recent orders)
      expect(result[0].productId).toBe("prod_1");
      expect(result[0].reason).toBe("trending");
    });

    it("should apply recency decay", () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentOrders = [
        { items: ["prod_1"], createdAt: now },
        { items: ["prod_2"], createdAt: weekAgo },
      ];

      const result = getTrendingProducts(recentOrders);

      // prod_1 should have higher score (more recent)
      const prod1 = result.find((r) => r.productId === "prod_1");
      const prod2 = result.find((r) => r.productId === "prod_2");

      expect(prod1!.score).toBeGreaterThan(prod2!.score);
    });

    it("should respect limit parameter", () => {
      const now = new Date();
      const recentOrders = [
        { items: ["prod_1", "prod_2", "prod_3", "prod_4", "prod_5"], createdAt: now },
      ];

      const result = getTrendingProducts(recentOrders, 3);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe("combineRecommendations", () => {
    it("should merge recommendations from multiple sources", () => {
      const source1: Recommendation[] = [
        { productId: "prod_1", score: 5, reason: "similar" },
        { productId: "prod_2", score: 3, reason: "similar" },
      ];

      const source2: Recommendation[] = [
        { productId: "prod_1", score: 2, reason: "trending" },
        { productId: "prod_3", score: 4, reason: "trending" },
      ];

      const result = combineRecommendations([source1, source2]);

      // prod_1 should have combined score of 7
      const prod1 = result.find((r) => r.productId === "prod_1");
      expect(prod1!.score).toBe(7);

      // All products should be present
      const ids = result.map((r) => r.productId);
      expect(ids).toContain("prod_1");
      expect(ids).toContain("prod_2");
      expect(ids).toContain("prod_3");
    });

    it("should sort by combined score", () => {
      const source1: Recommendation[] = [
        { productId: "prod_1", score: 2, reason: "similar" },
        { productId: "prod_2", score: 10, reason: "similar" },
      ];

      const source2: Recommendation[] = [
        { productId: "prod_1", score: 1, reason: "trending" },
      ];

      const result = combineRecommendations([source1, source2]);

      // prod_2 should be first (score 10 > score 3)
      expect(result[0].productId).toBe("prod_2");
    });

    it("should respect limit parameter", () => {
      const source: Recommendation[] = [
        { productId: "prod_1", score: 5, reason: "similar" },
        { productId: "prod_2", score: 4, reason: "similar" },
        { productId: "prod_3", score: 3, reason: "similar" },
        { productId: "prod_4", score: 2, reason: "similar" },
      ];

      const result = combineRecommendations([source], 2);
      expect(result.length).toBe(2);
    });

    it("should handle empty sources", () => {
      const result = combineRecommendations([[], []]);
      expect(result).toEqual([]);
    });
  });
});
