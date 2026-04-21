/**
 * Subscription / Paywall management — RevenueCat SDK integration
 *
 * Uses react-native-purchases (v10) for real StoreKit 2 billing on iOS.
 * Entitlement: "Calorly - Calorie Counter Premium"
 * Products: com.nyjl.calorly.yearly | com.nyjl.calorly.monthly
 * Offering: "default" ($rc_annual + $rc_monthly packages)
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
  type PurchasesOfferings,
} from "react-native-purchases";

// ─── Constants ────────────────────────────────────────────────────────────────

/** RevenueCat public API key for iOS (App Store app) */
export const RC_API_KEY_IOS = "appl_VrogSTzrAxZSTqvfDQgTQgCPcsW";

/** The entitlement identifier configured in RevenueCat dashboard */
export const ENTITLEMENT_ID = "Calorly - Calorie Counter Premium";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanId = "monthly" | "annual";

export interface SubscriptionPlan {
  id: PlanId;
  label: string;
  price: string;          // display price, e.g. "$9.99"
  period: string;         // e.g. "month" | "year"
  perDay: string;         // e.g. "$0.11/day" | "$0.33/day"
  perMonth?: string;      // e.g. "$3.33/month" (shown on annual plan)
  savingsLabel?: string;  // e.g. "Save 67%"
  badge?: string;         // e.g. "Best Value"
  trialLabel?: string;    // Only set when a free trial is available (annual only)
  /** RevenueCat package identifier, e.g. "$rc_annual" */
  rcPackageId: string;
}

export interface SubscriptionState {
  isPremium: boolean;
  planId: PlanId | null;
  expiresAt: number | null; // unix ms, null = not subscribed
  trialUsed: boolean;
}

// ─── Plans (display metadata — prices shown to user before StoreKit loads) ───

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "annual",
    label: "Annual",
    price: "$39.99",
    period: "year",
    perDay: "$0.11/day",
    perMonth: "$3.33/month",
    savingsLabel: "Save 67%",
    badge: "Best Value",
    trialLabel: "7-day free trial", // Annual plan includes a free trial
    rcPackageId: "$rc_annual",
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "$9.99",
    period: "month",
    perDay: "$0.33/day",
    // No free trial on monthly — intentional to push users toward annual
    rcPackageId: "$rc_monthly",
  },
];

// ─── Free-tier limits ─────────────────────────────────────────────────────────

export const FREE_TIER_DAILY_LOG_LIMIT = 5; // food entries per day

// ─── Premium features list (shown on paywall) ─────────────────────────────────

export const PREMIUM_FEATURES = [
  { icon: "📷", text: "Barcode scanner — instant food lookup" },
  { icon: "🥗", text: "Full macro breakdown (protein, carbs, fat)" },
  { icon: "🍽️", text: "Custom food creation" },
  { icon: "📈", text: "Advanced progress charts & trends" },
  { icon: "📊", text: "Unlimited food logging" },
  { icon: "⚖️", text: "Weight trend chart & history" },
];

// ─── RevenueCat SDK initialisation ───────────────────────────────────────────

let _configured = false;

/**
 * Initialise the RevenueCat SDK.
 * Call once from the root layout (app/_layout.tsx) before any purchase calls.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function configureRevenueCat(appUserId?: string): void {
  if (_configured) return;
  if (Platform.OS === "web") return; // RevenueCat is native-only

  try {
    Purchases.setLogLevel(LOG_LEVEL.ERROR); // reduce noise in production

    Purchases.configure({
      apiKey: RC_API_KEY_IOS,
      appUserID: appUserId ?? null, // null = anonymous user (RC generates UUID)
    });

    _configured = true;
  } catch (e) {
    console.warn("[RevenueCat] configure failed:", e);
  }
}

// ─── Offerings ────────────────────────────────────────────────────────────────

/**
 * Fetch the current RevenueCat offerings.
 * Returns null on web or if the SDK is not configured.
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (Platform.OS === "web" || !_configured) return null;
  try {
    return await Purchases.getOfferings();
  } catch (e) {
    console.warn("[RevenueCat] getOfferings failed:", e);
    return null;
  }
}

/**
 * Find a specific package from the default offering by its RC identifier.
 * e.g. "$rc_annual" or "$rc_monthly"
 */
export async function getPackageById(rcPackageId: string): Promise<PurchasesPackage | null> {
  const offerings = await getOfferings();
  if (!offerings?.current) return null;
  return offerings.current.availablePackages.find(
    (pkg) => pkg.identifier === rcPackageId
  ) ?? null;
}

// ─── Customer info helpers ────────────────────────────────────────────────────

/**
 * Convert a RevenueCat CustomerInfo object into our local SubscriptionState.
 */
export function customerInfoToState(info: CustomerInfo): SubscriptionState {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  const isPremium = !!entitlement?.isActive;

  // Determine planId from active subscriptions
  let planId: PlanId | null = null;
  if (isPremium) {
    const activeSubs = info.activeSubscriptions;
    if (activeSubs.some((s) => s.includes("yearly") || s.includes("annual"))) {
      planId = "annual";
    } else if (activeSubs.some((s) => s.includes("monthly"))) {
      planId = "monthly";
    }
  }

  // expiresAt from entitlement
  const expiresAt = entitlement?.expirationDate
    ? new Date(entitlement.expirationDate).getTime()
    : null;

  return {
    isPremium,
    planId,
    expiresAt,
    trialUsed: info.entitlements.all[ENTITLEMENT_ID]?.periodType === "trial"
      ? true
      : isPremium, // if ever premium, consider trial used
  };
}

/**
 * Fetch the latest CustomerInfo from RevenueCat and return our SubscriptionState.
 */
export async function loadSubscription(): Promise<SubscriptionState> {
  if (Platform.OS === "web" || !_configured) {
    return loadSubscriptionFromCache();
  }
  try {
    const info = await Purchases.getCustomerInfo();
    const state = customerInfoToState(info);
    await saveSubscription(state); // keep local cache in sync
    return state;
  } catch (e) {
    console.warn("[RevenueCat] getCustomerInfo failed, using cache:", e);
    return loadSubscriptionFromCache();
  }
}

// ─── Local cache (fallback + web) ────────────────────────────────────────────

const KEY = "calorly_subscription";

export const DEFAULT_STATE: SubscriptionState = {
  isPremium: false,
  planId: null,
  expiresAt: null,
  trialUsed: false,
};

async function loadSubscriptionFromCache(): Promise<SubscriptionState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed: SubscriptionState = JSON.parse(raw);
      // Check expiry on cached state
      if (parsed.isPremium && parsed.expiresAt && parsed.expiresAt < Date.now()) {
        const expired = { ...parsed, isPremium: false };
        await AsyncStorage.setItem(KEY, JSON.stringify(expired));
        return expired;
      }
      return parsed;
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

export async function saveSubscription(state: SubscriptionState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

/**
 * Purchase a subscription plan via RevenueCat.
 * Throws if the user cancels or if a purchase error occurs.
 */
export async function purchaseSubscription(planId: PlanId): Promise<SubscriptionState> {
  if (Platform.OS === "web") {
    // Web fallback: simulate purchase for preview/testing
    return simulatePurchase(planId);
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const pkg = await getPackageById(plan.rcPackageId);
  if (!pkg) throw new Error(`Package ${plan.rcPackageId} not found in current offering`);

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const state = customerInfoToState(customerInfo);
  await saveSubscription(state);
  return state;
}

/**
 * Restore previous purchases via RevenueCat.
 * Returns the updated SubscriptionState.
 */
export async function restorePurchases(): Promise<SubscriptionState> {
  if (Platform.OS === "web") {
    return loadSubscriptionFromCache();
  }
  const info = await Purchases.restorePurchases();
  const state = customerInfoToState(info);
  await saveSubscription(state);
  return state;
}

/**
 * Cancel / reset subscription (for account deletion / testing).
 * Note: This only clears the local cache. The actual subscription
 * must be cancelled through the App Store.
 */
export async function cancelSubscription(): Promise<void> {
  await saveSubscription({ ...DEFAULT_STATE });
}

// ─── Web / preview simulation ─────────────────────────────────────────────────

/** Simulate a purchase on web (for Expo web preview only). */
async function simulatePurchase(planId: PlanId): Promise<SubscriptionState> {
  const now = Date.now();
  const durationMs = planId === "annual"
    ? 365 * 24 * 60 * 60 * 1000
    : 30 * 24 * 60 * 60 * 1000;

  const newState: SubscriptionState = {
    isPremium: true,
    planId,
    expiresAt: now + durationMs,
    trialUsed: true,
  };
  await saveSubscription(newState);
  return newState;
}

// ─── App open tracking (for Day-3 paywall trigger) ────────────────────────────

const OPEN_HISTORY_KEY = "calorly_app_opens";

/**
 * Records today's app open date and returns the total number of distinct days
 * the app has been opened. Used to trigger the Day-3 paywall.
 */
export async function recordAppOpen(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(OPEN_HISTORY_KEY);
    const opens: string[] = raw ? JSON.parse(raw) : [];
    const today = new Date().toISOString().split("T")[0];
    if (!opens.includes(today)) {
      opens.push(today);
      await AsyncStorage.setItem(OPEN_HISTORY_KEY, JSON.stringify(opens));
    }
    return opens.length;
  } catch {
    return 1;
  }
}

/**
 * Returns the number of distinct days the app has been opened.
 */
export async function getAppOpenDays(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(OPEN_HISTORY_KEY);
    const opens: string[] = raw ? JSON.parse(raw) : [];
    return opens.length;
  } catch {
    return 1;
  }
}
