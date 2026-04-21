/**
 * Open Food Facts API integration
 * https://world.openfoodfacts.org/data
 *
 * Free, open-source food database with millions of products worldwide.
 * No API key required.
 */

import { FoodItem } from "./food-database";

const BASE_URL = "https://world.openfoodfacts.org/api/v2/product";

export interface OFFProduct {
  code: string;
  product: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    serving_size?: string;
    serving_quantity?: number;
    nutriments?: {
      "energy-kcal_100g"?: number;
      "energy-kcal_serving"?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
      fiber_100g?: number;
      sugars_100g?: number;
      sodium_100g?: number;
    };
    image_front_small_url?: string;
    categories_tags?: string[];
    quantity?: string;
  };
  status: number; // 1 = found, 0 = not found
  status_verbose?: string;
}

export interface BarcodeResult {
  found: boolean;
  food?: FoodItem & { brand?: string; imageUrl?: string };
  error?: string;
}

/**
 * Look up a food product by its barcode using the Open Food Facts API.
 * Returns a Calorly-compatible FoodItem if found.
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeResult> {
  try {
    const url = `${BASE_URL}/${barcode}.json?fields=product_name,product_name_en,brands,serving_size,serving_quantity,nutriments,image_front_small_url,categories_tags,quantity`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Calorly - Calorie Counter/1.0 (support@calorly.app)",
      },
    });

    if (!response.ok) {
      return { found: false, error: `Network error: ${response.status}` };
    }

    const data: OFFProduct = await response.json();

    if (data.status !== 1 || !data.product) {
      return { found: false, error: "Product not found in database" };
    }

    const product = data.product;
    const nutriments = product.nutriments ?? {};

    // Get product name (prefer English)
    const name =
      product.product_name_en?.trim() ||
      product.product_name?.trim() ||
      "Unknown Product";

    if (!name || name === "Unknown Product") {
      return { found: false, error: "Product has no name in database" };
    }

    // Get calories per 100g
    const calories100g = nutriments["energy-kcal_100g"] ?? 0;

    // If no calorie data, we can't use this product
    if (calories100g === 0 && !nutriments["energy-kcal_serving"]) {
      return { found: false, error: "No nutrition data available for this product" };
    }

    // Determine default serving size
    const servingGrams = product.serving_quantity
      ? Math.round(product.serving_quantity)
      : 100;

    const servingLabel = product.serving_size
      ? `1 serving (${product.serving_size})`
      : "100g";

    // Map category
    const category = mapCategory(product.categories_tags ?? []);

    // Build brand suffix
    const brand = product.brands?.split(",")[0]?.trim() ?? "";
    const displayName = brand ? `${name} (${brand})` : name;

    const food: FoodItem & { brand?: string; imageUrl?: string } = {
      id: `off_${barcode}`,
      name: displayName,
      category,
      calories: Math.round(calories100g),
      protein: Math.round((nutriments.proteins_100g ?? 0) * 10) / 10,
      carbs: Math.round((nutriments.carbohydrates_100g ?? 0) * 10) / 10,
      fat: Math.round((nutriments.fat_100g ?? 0) * 10) / 10,
      fiber: nutriments.fiber_100g
        ? Math.round(nutriments.fiber_100g * 10) / 10
        : undefined,
      sugar: nutriments.sugars_100g
        ? Math.round(nutriments.sugars_100g * 10) / 10
        : undefined,
      sodium: nutriments.sodium_100g
        ? Math.round(nutriments.sodium_100g * 1000) // convert g to mg
        : undefined,
      defaultServing: servingGrams,
      servingUnit: servingLabel,
      brand,
      imageUrl: product.image_front_small_url,
    };

    return { found: true, food };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { found: false, error: `Failed to fetch: ${message}` };
  }
}

/**
 * Map Open Food Facts category tags to Calorly categories.
 */
function mapCategory(tags: string[]): string {
  const tagStr = tags.join(" ").toLowerCase();

  if (tagStr.includes("dairy") || tagStr.includes("milk") || tagStr.includes("cheese") || tagStr.includes("yogurt")) {
    return "Dairy & Eggs";
  }
  if (tagStr.includes("meat") || tagStr.includes("beef") || tagStr.includes("chicken") || tagStr.includes("pork") || tagStr.includes("fish") || tagStr.includes("seafood")) {
    return "Meat & Fish";
  }
  if (tagStr.includes("vegetable") || tagStr.includes("veggie")) {
    return "Vegetables";
  }
  if (tagStr.includes("fruit")) {
    return "Fruits";
  }
  if (tagStr.includes("cereal") || tagStr.includes("grain") || tagStr.includes("bread") || tagStr.includes("pasta") || tagStr.includes("rice")) {
    return "Grains & Bread";
  }
  if (tagStr.includes("snack") || tagStr.includes("chip") || tagStr.includes("cracker") || tagStr.includes("cookie") || tagStr.includes("biscuit")) {
    return "Snacks";
  }
  if (tagStr.includes("beverage") || tagStr.includes("drink") || tagStr.includes("juice") || tagStr.includes("soda")) {
    return "Beverages";
  }
  if (tagStr.includes("fast-food") || tagStr.includes("restaurant") || tagStr.includes("meal")) {
    return "Fast Food";
  }
  if (tagStr.includes("legume") || tagStr.includes("bean") || tagStr.includes("lentil") || tagStr.includes("nut") || tagStr.includes("seed")) {
    return "Legumes & Nuts";
  }
  if (tagStr.includes("sauce") || tagStr.includes("condiment") || tagStr.includes("dressing")) {
    return "Condiments";
  }

  return "Other";
}
