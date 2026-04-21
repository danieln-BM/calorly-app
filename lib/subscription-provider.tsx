import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import {
  configureRevenueCat,
  loadSubscription,
  purchaseSubscription,
  restorePurchases,
  cancelSubscription,
  customerInfoToState,
  recordAppOpen,
  SubscriptionState,
  PlanId,
  DEFAULT_STATE,
} from "./subscription";
import { setFirebaseUserId, setUserSubscriptionProperty } from "./analytics";
import { initSingular } from "./singular";

// Re-export DEFAULT_STATE for convenience
export { DEFAULT_STATE as DEFAULT_SUBSCRIPTION_STATE };

export type PaywallSource =
  | "onboarding_complete"
  | "day3_open"
  | "food_log_limit"
  | "progress_charts"
  | "exercise_tab"
  | "custom_food"
  | "barcode_scanner"
  | "meal_template_saved"
  | "streak_milestone"
  | "profile_upgrade_btn"
  | "manual";

interface SubscriptionContextValue {
  subscription: SubscriptionState;
  isPremium: boolean;
  loading: boolean;
  appOpenDays: number;
  purchase: (planId: PlanId) => Promise<void>;
  restore: () => Promise<boolean>;
  cancel: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Navigate to the paywall with source attribution */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  triggerPaywall: (source: PaywallSource, router: any) => void;
  /** Open the RevenueCat Customer Center (manage subscriptions) */
  openCustomerCenter: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isPremium: false,
    planId: null,
    expiresAt: null,
    trialUsed: false,
  });
  const [loading, setLoading] = useState(true);
  const [appOpenDays, setAppOpenDays] = useState(1);
  const lastPaywallTime = useRef<number>(0);
  const PAYWALL_COOLDOWN_MS = 30 * 60 * 1000; // 30 min between auto-triggers

  const refresh = useCallback(async () => {
    const state = await loadSubscription();
    setSubscription(state);
    setLoading(false);
  }, []);

  useEffect(() => {
    // 1. Configure RevenueCat SDK (safe to call multiple times)
    configureRevenueCat();

    // Sync RC anonymous user ID to Firebase + Singular for cross-platform user matching
    if (Platform.OS !== "web") {
      Purchases.getAppUserID().then((rcUserId) => {
        setFirebaseUserId(rcUserId);
        // Init Singular with the RC user ID as customUserId for attribution matching.
        // waitForTrackingAuthorizationWithTimeoutInterval: 300 is set inside initSingular
        // so Singular waits for the ATT dialog result before sending the first session.
        initSingular(rcUserId);
      }).catch(() => {});
    }

    // 2. Listen for real-time CustomerInfo updates from RevenueCat
    let removeListener: (() => boolean) | undefined;
    if (Platform.OS !== "web") {
      const listener = (info: CustomerInfo) => {
        const state = customerInfoToState(info);
        setSubscription(state);
        // Keep Firebase user property in sync with subscription state
        setUserSubscriptionProperty(state.isPremium ? "paid" : "free");
      };
      Purchases.addCustomerInfoUpdateListener(listener);
      removeListener = () => Purchases.removeCustomerInfoUpdateListener(listener);
    }

    // 3. Record app open for Day-3 trigger
    (async () => {
      const days = await recordAppOpen();
      setAppOpenDays(days);
    })();

    // 4. Load initial subscription state
    refresh();

    return () => {
      removeListener?.();
    };
  }, [refresh]);

  const purchase = useCallback(async (planId: PlanId) => {
    setLoading(true);
    try {
      const newState = await purchaseSubscription(planId);
      setSubscription(newState);
    } finally {
      setLoading(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const state = await restorePurchases();
      setSubscription(state);
      return state.isPremium;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(async () => {
    await cancelSubscription();
    await refresh();
  }, [refresh]);

  /**
   * Open the RevenueCat Customer Center (subscription management UI).
   * On web, this is a no-op.
   */
  const openCustomerCenter = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      const RevenueCatUI = (await import("react-native-purchases-ui")).default;
      await RevenueCatUI.presentCustomerCenter();
    } catch (e) {
      console.warn("[RevenueCat] presentCustomerCenter failed:", e);
    }
  }, []);

  /**
   * Navigate to the paywall with source attribution and cooldown guard.
   * Manual triggers always show immediately.
   * Automatic triggers (day3, streak) respect the cooldown.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const triggerPaywall = useCallback(
    (source: PaywallSource, router: any) => {
      if (subscription.isPremium) return;
      const now = Date.now();
      const isAutoTrigger = source === "day3_open" || source === "streak_milestone";
      if (isAutoTrigger && now - lastPaywallTime.current < PAYWALL_COOLDOWN_MS) return;
      lastPaywallTime.current = now;
      router.push(`/paywall?source=${source}`);
    },
    [subscription.isPremium]
  );

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isPremium: subscription.isPremium,
        loading,
        appOpenDays,
        purchase,
        restore,
        cancel,
        refresh,
        triggerPaywall,
        openCustomerCenter,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
