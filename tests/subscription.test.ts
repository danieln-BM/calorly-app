import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Platform (always "web" in tests so native RC SDK is bypassed) ───────
vi.mock("react-native", () => ({
  Platform: { OS: "web", select: (obj: Record<string, unknown>) => obj.web ?? obj.default },
}));

// ─── Mock react-native-purchases (not available in Node test env) ─────────────
vi.mock("react-native-purchases", () => ({
  default: {
    configure: vi.fn(),
    setLogLevel: vi.fn(),
    getCustomerInfo: vi.fn(),
    getOfferings: vi.fn(),
    purchasePackage: vi.fn(),
    restorePurchases: vi.fn(),
    addCustomerInfoUpdateListener: vi.fn(),
    removeCustomerInfoUpdateListener: vi.fn(),
  },
  LOG_LEVEL: { ERROR: "ERROR", VERBOSE: "VERBOSE" },
}));

// ─── Mock AsyncStorage ────────────────────────────────────────────────────────
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    multiRemove: vi.fn().mockResolvedValue(undefined),
  },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadSubscription,
  purchaseSubscription,
  restorePurchases,
  cancelSubscription,
  customerInfoToState,
  DEFAULT_STATE,
  SUBSCRIPTION_PLANS,
  FREE_TIER_DAILY_LOG_LIMIT,
  PREMIUM_FEATURES,
  ENTITLEMENT_ID,
  type SubscriptionState,
} from "../lib/subscription";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal mock CustomerInfo with the given entitlement active state */
function mockCustomerInfo(
  isActive: boolean,
  planId: "annual" | "monthly" | null = null,
  expirationDate: string | null = null
) {
  const entitlementInfo = isActive
    ? {
        isActive: true,
        expirationDate,
        periodType: "normal",
      }
    : null;

  const activeSubscriptions: string[] = [];
  if (isActive && planId === "annual") activeSubscriptions.push("com.nyjl.calorly.yearly");
  if (isActive && planId === "monthly") activeSubscriptions.push("com.nyjl.calorly.monthly");

  return {
    entitlements: {
      active: isActive ? { [ENTITLEMENT_ID]: entitlementInfo } : {},
      all: isActive ? { [ENTITLEMENT_ID]: entitlementInfo } : {},
    },
    activeSubscriptions,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Subscription Plans", () => {
  it("should have exactly 2 plans (annual and monthly)", () => {
    expect(SUBSCRIPTION_PLANS).toHaveLength(2);
    expect(SUBSCRIPTION_PLANS.map((p) => p.id)).toEqual(["annual", "monthly"]);
  });

  it("annual plan should be marked as Best Value", () => {
    const annual = SUBSCRIPTION_PLANS.find((p) => p.id === "annual");
    expect(annual?.badge).toBe("Best Value");
  });

  it("annual plan should have a savings label", () => {
    const annual = SUBSCRIPTION_PLANS.find((p) => p.id === "annual");
    expect(annual?.savingsLabel).toBeTruthy();
  });

  it("annual plan should have a free trial label", () => {
    const annual = SUBSCRIPTION_PLANS.find((p) => p.id === "annual");
    expect(annual?.trialLabel).toBeTruthy();
    expect(annual?.trialLabel).toContain("trial");
  });

  it("monthly plan should NOT have a free trial (push users toward annual)", () => {
    const monthly = SUBSCRIPTION_PLANS.find((p) => p.id === "monthly");
    expect(monthly?.trialLabel).toBeFalsy();
  });

  it("annual plan should have a perMonth display price", () => {
    const annual = SUBSCRIPTION_PLANS.find((p) => p.id === "annual");
    expect(annual?.perMonth).toBeTruthy();
  });

  it("annual plan should cost less per day than monthly plan", () => {
    const annual = SUBSCRIPTION_PLANS.find((p) => p.id === "annual");
    const monthly = SUBSCRIPTION_PLANS.find((p) => p.id === "monthly");
    const annualPerDay = parseFloat(annual!.perDay.replace("$", ""));
    const monthlyPerDay = parseFloat(monthly!.perDay.replace("$", ""));
    expect(annualPerDay).toBeLessThan(monthlyPerDay);
  });

  it("each plan should have a RevenueCat package identifier", () => {
    SUBSCRIPTION_PLANS.forEach((plan) => {
      expect(plan.rcPackageId).toBeTruthy();
      expect(plan.rcPackageId).toMatch(/^\$rc_/);
    });
  });
});

describe("Free Tier Limits", () => {
  it("should have a daily log limit of 5", () => {
    expect(FREE_TIER_DAILY_LOG_LIMIT).toBe(5);
  });

  it("should have at least 5 premium features listed", () => {
    expect(PREMIUM_FEATURES.length).toBeGreaterThanOrEqual(5);
  });

  it("premium features should include barcode scanner", () => {
    const hasBarcode = PREMIUM_FEATURES.some((f) =>
      f.text.toLowerCase().includes("barcode")
    );
    expect(hasBarcode).toBe(true);
  });

  it("premium features should include macro breakdown", () => {
    const hasMacro = PREMIUM_FEATURES.some((f) =>
      f.text.toLowerCase().includes("macro")
    );
    expect(hasMacro).toBe(true);
  });

  it("premium features should include custom food", () => {
    const hasCustomFood = PREMIUM_FEATURES.some((f) =>
      f.text.toLowerCase().includes("custom food")
    );
    expect(hasCustomFood).toBe(true);
  });

  it("premium features should include unlimited food logging", () => {
    const hasUnlimited = PREMIUM_FEATURES.some((f) =>
      f.text.toLowerCase().includes("unlimited")
    );
    expect(hasUnlimited).toBe(true);
  });
});

describe("DEFAULT_STATE", () => {
  it("should start as non-premium", () => {
    expect(DEFAULT_STATE.isPremium).toBe(false);
    expect(DEFAULT_STATE.planId).toBeNull();
    expect(DEFAULT_STATE.expiresAt).toBeNull();
    expect(DEFAULT_STATE.trialUsed).toBe(false);
  });
});

describe("customerInfoToState", () => {
  it("should return isPremium=false when entitlement is not active", () => {
    const info = mockCustomerInfo(false);
    const state = customerInfoToState(info as never);
    expect(state.isPremium).toBe(false);
    expect(state.planId).toBeNull();
  });

  it("should return isPremium=true when annual entitlement is active", () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const info = mockCustomerInfo(true, "annual", future);
    const state = customerInfoToState(info as never);
    expect(state.isPremium).toBe(true);
    expect(state.planId).toBe("annual");
  });

  it("should return isPremium=true when monthly entitlement is active", () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const info = mockCustomerInfo(true, "monthly", future);
    const state = customerInfoToState(info as never);
    expect(state.isPremium).toBe(true);
    expect(state.planId).toBe("monthly");
  });

  it("should parse expirationDate from entitlement", () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const info = mockCustomerInfo(true, "monthly", future);
    const state = customerInfoToState(info as never);
    expect(state.expiresAt).toBeGreaterThan(Date.now());
  });

  it("should set expiresAt=null when no expiration date", () => {
    const info = mockCustomerInfo(true, "annual", null);
    const state = customerInfoToState(info as never);
    expect(state.expiresAt).toBeNull();
  });
});

describe("loadSubscription (web/cache fallback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return DEFAULT_STATE when no stored data", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const state = await loadSubscription();
    expect(state.isPremium).toBe(false);
    expect(state.planId).toBeNull();
  });

  it("should return stored premium state if not expired", async () => {
    const futureExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(
      JSON.stringify({ isPremium: true, planId: "annual", expiresAt: futureExpiry, trialUsed: true })
    );
    const state = await loadSubscription();
    expect(state.isPremium).toBe(true);
    expect(state.planId).toBe("annual");
  });

  it("should expire premium state if expiresAt is in the past", async () => {
    const pastExpiry = Date.now() - 1000;
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(
      JSON.stringify({ isPremium: true, planId: "monthly", expiresAt: pastExpiry, trialUsed: true })
    );
    const state = await loadSubscription();
    expect(state.isPremium).toBe(false);
  });
});

describe("purchaseSubscription (web simulation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
  });

  it("should set isPremium to true after annual purchase", async () => {
    const state = await purchaseSubscription("annual");
    expect(state.isPremium).toBe(true);
    expect(state.planId).toBe("annual");
    expect(state.trialUsed).toBe(true);
  });

  it("should set isPremium to true after monthly purchase", async () => {
    const state = await purchaseSubscription("monthly");
    expect(state.isPremium).toBe(true);
    expect(state.planId).toBe("monthly");
  });

  it("annual plan should expire in ~365 days", async () => {
    const before = Date.now();
    const state = await purchaseSubscription("annual");
    const after = Date.now();
    const expectedMs = 365 * 24 * 60 * 60 * 1000;
    expect(state.expiresAt).toBeGreaterThanOrEqual(before + expectedMs - 1000);
    expect(state.expiresAt).toBeLessThanOrEqual(after + expectedMs + 1000);
  });

  it("monthly plan should expire in ~30 days", async () => {
    const before = Date.now();
    const state = await purchaseSubscription("monthly");
    const after = Date.now();
    const expectedMs = 30 * 24 * 60 * 60 * 1000;
    expect(state.expiresAt).toBeGreaterThanOrEqual(before + expectedMs - 1000);
    expect(state.expiresAt).toBeLessThanOrEqual(after + expectedMs + 1000);
  });

  it("should persist state to AsyncStorage", async () => {
    await purchaseSubscription("annual");
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });
});

describe("cancelSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
  });

  it("should reset to non-premium state", async () => {
    await cancelSubscription();
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    const savedData = vi.mocked(AsyncStorage.setItem).mock.calls[0][1];
    const state = JSON.parse(savedData as string);
    expect(state.isPremium).toBe(false);
    expect(state.planId).toBeNull();
  });
});

describe("ENTITLEMENT_ID", () => {
  it("should match the RevenueCat dashboard entitlement", () => {
    expect(ENTITLEMENT_ID).toBe("Calorly - Calorie Counter Premium");
  });
});
