import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { lookupBarcode } from "../lib/open-food-facts";

// Helper to build a mock OFF API response
function makeOFFResponse(overrides: Record<string, unknown> = {}) {
  return {
    status: 1,
    product: {
      product_name: "Test Granola Bar",
      product_name_en: "Test Granola Bar",
      brands: "TestBrand",
      serving_size: "40g",
      serving_quantity: 40,
      nutriments: {
        "energy-kcal_100g": 450,
        proteins_100g: 8,
        carbohydrates_100g: 60,
        fat_100g: 18,
        fiber_100g: 4,
        sugars_100g: 22,
        sodium_100g: 0.3,
      },
      image_front_small_url: "https://example.com/img.jpg",
      categories_tags: ["en:snacks", "en:bars"],
      ...overrides,
    },
  };
}

describe("lookupBarcode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns found=true with correct nutrition for a valid barcode", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeOFFResponse(),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.found).toBe(true);
    expect(result.food).toBeDefined();
    expect(result.food!.calories).toBe(450);
    expect(result.food!.protein).toBe(8);
    expect(result.food!.carbs).toBe(60);
    expect(result.food!.fat).toBe(18);
  });

  it("includes brand in the food name", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeOFFResponse(),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.found).toBe(true);
    expect(result.food!.name).toContain("TestBrand");
    expect(result.food!.name).toContain("Test Granola Bar");
  });

  it("uses product_name when product_name_en is absent", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        makeOFFResponse({ product_name_en: undefined }),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.found).toBe(true);
    expect(result.food!.name).toContain("Test Granola Bar");
  });

  it("converts sodium from g to mg", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeOFFResponse(),
    });

    const result = await lookupBarcode("0123456789012");
    // 0.3g sodium → 300mg
    expect(result.food!.sodium).toBe(300);
  });

  it("uses serving_quantity as defaultServing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeOFFResponse(),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.food!.defaultServing).toBe(40);
  });

  it("defaults to 100g serving when serving_quantity is absent", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        makeOFFResponse({ serving_quantity: undefined, serving_size: undefined }),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.food!.defaultServing).toBe(100);
  });

  it("returns found=false when status is 0 (not found)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0, product: null }),
    });

    const result = await lookupBarcode("9999999999999");
    expect(result.found).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns found=false when product has no name", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        makeOFFResponse({ product_name: undefined, product_name_en: undefined }),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.found).toBe(false);
  });

  it("returns found=false when product has no calorie data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () =>
        makeOFFResponse({ nutriments: {} }),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.found).toBe(false);
    expect(result.error).toContain("No nutrition data");
  });

  it("returns found=false on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const result = await lookupBarcode("0123456789012");
    expect(result.found).toBe(false);
    expect(result.error).toContain("Network failure");
  });

  it("returns found=false on non-ok HTTP response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await lookupBarcode("0123456789012");
    expect(result.found).toBe(false);
    expect(result.error).toContain("500");
  });

  it("maps snack category correctly", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeOFFResponse({ categories_tags: ["en:snacks", "en:chips"] }),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.food!.category).toBe("Snacks");
  });

  it("maps dairy category correctly", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeOFFResponse({ categories_tags: ["en:dairy", "en:yogurts"] }),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.food!.category).toBe("Dairy & Eggs");
  });

  it("maps beverage category correctly", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeOFFResponse({ categories_tags: ["en:beverages", "en:juices"] }),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.food!.category).toBe("Beverages");
  });

  it("falls back to Other for unknown categories", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeOFFResponse({ categories_tags: ["en:unknown-category"] }),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.food!.category).toBe("Other");
  });

  it("food id is prefixed with off_ and includes barcode", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeOFFResponse(),
    });

    const result = await lookupBarcode("0123456789012");
    expect(result.food!.id).toBe("off_0123456789012");
  });
});
