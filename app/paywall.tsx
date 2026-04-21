/**
 * Paywall Screen — RevenueCat Native Paywall
 *
 * Presents the paywall configured in the RevenueCat dashboard using
 * RevenueCatUI.presentPaywall(). This ensures the paywall design, copy,
 * and pricing always match what is set in the RC dashboard without
 * any code changes.
 *
 * Flow: Onboarding → Paywall (RC native UI) → ATT (native Apple dialog)
 */

import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useSubscription, PaywallSource } from "@/lib/subscription-provider";
import {
  trackPaywallViewed,
  trackPaywallDismissed,
  type PaywallTriggerSource,
  type UserState,
} from "@/lib/analytics";
import { trackAttGranted, trackAttDenied, trackAttPromptShown } from "@/lib/singular";
import { trackPermissionResult } from "@/lib/analytics";

// Lazy-load ATT — only available in native builds, not Expo Go / web
async function requestATTPermission(): Promise<"granted" | "denied" | "unavailable"> {
  if (Platform.OS !== "ios") return "unavailable";
  try {
    const { requestTrackingPermissionsAsync } = await import("expo-tracking-transparency");
    const { status } = await requestTrackingPermissionsAsync();
    return status === "granted" ? "granted" : "denied";
  } catch {
    return "unavailable";
  }
}

export default function PaywallScreen() {
  const colors = useColors();
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { isPremium } = useSubscription();
  const openedAtRef = useRef<number>(Date.now());
  const hasLaunchedRef = useRef(false);

  const userState: UserState = isPremium ? "paid" : "free";
  const triggerSource: PaywallTriggerSource =
    (source as PaywallTriggerSource) ?? "manual";

  const handleDismiss = async () => {
    const timeOnPaywall = (Date.now() - openedAtRef.current) / 1000;
    trackPaywallDismissed(timeOnPaywall, triggerSource);

    // After paywall (dismissed or purchased), show native ATT dialog
    await showATT();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const showATT = async () => {
    try {
      trackAttPromptShown();
      const result = await requestATTPermission();
      if (result !== "unavailable") {
        await trackPermissionResult("att", result === "granted");
        if (result === "granted") {
          await trackAttGranted();
        } else {
          await trackAttDenied();
        }
      }
    } catch {
      // Never block the user flow on ATT failure
    }
  };

  useEffect(() => {
    if (hasLaunchedRef.current) return;
    hasLaunchedRef.current = true;

    openedAtRef.current = Date.now();
    trackPaywallViewed(triggerSource, userState);

    // Present the RevenueCat dashboard paywall
    (async () => {
      if (Platform.OS === "web") {
        // Web: skip RC paywall, go straight to ATT (no-op) then navigate
        await handleDismiss();
        return;
      }
      try {
        const RevenueCatUI = (await import("react-native-purchases-ui")).default;
        // presentPaywall() shows the paywall configured in the RC dashboard.
        // It returns PURCHASED, RESTORED, or NOT_PRESENTED/CANCELLED.
        await RevenueCatUI.presentPaywall();
      } catch (e) {
        console.warn("[RevenueCat] presentPaywall failed:", e);
      }
      // Whether purchased, restored, or dismissed — proceed to ATT then navigate
      await handleDismiss();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show a brief loading spinner while the RC paywall is being prepared
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
