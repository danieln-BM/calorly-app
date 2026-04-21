/**
 * Analytics Service — Calorly Event Tracking
 *
 * Event schema based on the Calorly Event Tracking System Guide.
 * Uses Firebase Analytics for all custom product/behavior events.
 * RevenueCat handles all subscription events automatically (trial_started,
 * subscription_purchased, trial_converted, subscription_renewed, subscription_cancelled).
 *
 * NOTE: Firebase SDK requires a real native build (EAS / development build).
 * On web or when the native module is unavailable, all calls are silently no-ops.
 *
 * Platform: iOS (Singular attribution — fully integrated; all events mirror to Singular SDK)
 */

import { Platform } from "react-native";
import {
  singularTrackAppOpen,
  singularTrackOnboardingStarted,
  singularTrackOnboardingStepCompleted,
  singularTrackOnboardingCompleted,
  singularTrackPermissionResult,
  singularTrackAhaMomentReached,
  singularTrackPaywallViewed,
  singularTrackPaywallDismissed,
  singularTrackPaywallCtaTapped,
  singularTrackPricingPlanSelected,
  singularTrackCoreActionPerformed,
  singularTrackFeatureUsed,
  singularTrackCriticalError,
} from "./singular";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaywallTriggerSource =
  | "onboarding"
  | "feature_gate"
  | "barcode_scanner"
  | "custom_food"
  | "macro_breakdown"
  | "progress_charts"
  | "manual";

export type UserState = "free" | "trial" | "paid";

export type PermissionType = "camera" | "notifications" | "health" | "photo_library" | "att";

export type FeatureName =
  | "barcode_scanner"
  | "custom_food"
  | "progress_charts"
  | "weight_chart"
  | "macro_breakdown"
  | "meal_templates"
  | "exercise_log";

// ─── Firebase Analytics lazy loader ──────────────────────────────────────────

/**
 * Lazily import Firebase Analytics only on native platforms.
 * Returns null on web or if the module is unavailable (e.g. Expo Go without dev client).
 */
async function getAnalytics() {
  if (Platform.OS === "web") return null;
  try {
    const analytics = await import("@react-native-firebase/analytics");
    return analytics.default();
  } catch {
    // Firebase not yet configured (missing GoogleService-Info.plist) — silent no-op
    return null;
  }
}

/**
 * Core log function. All event helpers funnel through here.
 * Silently no-ops if Firebase is not available.
 */
async function logEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) return;
    await analytics.logEvent(name, params);
  } catch (e) {
    // Never throw from analytics — never break the app for tracking failures
    if (__DEV__) {
      console.warn(`[Analytics] Failed to log "${name}":`, e);
    }
  }
}

// ─── Session / App Open Events ──────────────────────────────────────────────

/**
 * Custom session_start / app_open wrapper.
 * Firebase fires app_open and session_start automatically, but this explicit
 * call gives you a custom event you can use to build funnels in Firebase
 * and confirms the SDK is initialised correctly (visible in DebugView).
 * Call once from the root layout on mount.
 */
export async function trackAppOpen(): Promise<void> {
  await logEvent("app_open_custom", {
    platform: Platform.OS,
  });
  singularTrackAppOpen();
}

// ─── Onboarding Events ────────────────────────────────────────────────────────

/**
 * Fires when the first onboarding screen becomes visible.
 * Sets the baseline for onboarding_completed ÷ onboarding_started ratio.
 */
export async function trackOnboardingStarted(): Promise<void> {
  await logEvent("onboarding_started");
  singularTrackOnboardingStarted();
}

/**
 * Fires each time a user completes an individual onboarding step.
 * Use this to build a step-by-step funnel and find drop-off points.
 *
 * @param stepNumber - 1-indexed step number (1, 2, 3…)
 * @param stepName - human-readable step name e.g. "goal_selected", "personal_info"
 */
export async function trackOnboardingStepCompleted(
  stepNumber: number,
  stepName: string
): Promise<void> {
  await logEvent("onboarding_step_completed", {
    step_number: stepNumber,
    step_name: stepName,
  });
  singularTrackOnboardingStepCompleted(stepNumber, stepName);
}

/**
 * Fires when the onboarding flow is fully completed and the main app begins.
 * Critical denominator for paywall conversion analysis.
 */
export async function trackOnboardingCompleted(): Promise<void> {
  await logEvent("onboarding_completed");
  singularTrackOnboardingCompleted();
}

/**
 * Fires after the OS permission dialog resolves.
 * Also fires a companion `permission_denied` event on refusal.
 *
 * @param permissionType - e.g. "camera", "notifications"
 * @param granted - true if user granted, false if denied
 */
export async function trackPermissionResult(
  permissionType: PermissionType,
  granted: boolean
): Promise<void> {
  await logEvent(granted ? "permission_granted" : "permission_denied", {
    permission_type: permissionType,
  });
  singularTrackPermissionResult(permissionType, granted);
}

// ─── Activation Event ─────────────────────────────────────────────────────────

/**
 * Fires when the user logs their first food entry — the Calorly "aha moment".
 * This is the activation metric. Users who hit this convert at significantly higher rates.
 * Correlate this with trial_started to measure activation → conversion rate.
 */
export async function trackAhaMomentReached(): Promise<void> {
  await logEvent("aha_moment_reached");
  singularTrackAhaMomentReached();
}

// ─── Paywall Events ───────────────────────────────────────────────────────────

/**
 * Fires every time the paywall screen becomes visible — not just the first time.
 * This is the denominator for Paywall CVR = trial_started ÷ paywall_viewed.
 *
 * @param triggerSource - what caused the paywall to appear
 * @param userState - current subscription state of the user
 * @param variant - A/B test variant identifier (default: "control")
 * @param paywallId - identifier for the specific paywall shown (default: "main_paywall")
 */
export async function trackPaywallViewed(
  triggerSource: PaywallTriggerSource,
  userState: UserState,
  variant = "control",
  paywallId = "main_paywall"
): Promise<void> {
  await logEvent("paywall_viewed", {
    trigger_source: triggerSource,
    user_state: userState,
    variant,
    paywall_id: paywallId,
  });
  singularTrackPaywallViewed(triggerSource, userState, variant, paywallId);
}

/**
 * Nice-to-have: fires when a specific paywall A/B variant is shown.
 * Use Firebase Remote Config to assign variants and pass variant_id here.
 * Enables proper A/B test analysis separate from the general paywall_viewed event.
 *
 * @param variantId - the A/B variant identifier e.g. "v1_headline", "v2_price_first"
 * @param paywallId - which paywall this variant belongs to
 */
export async function trackPaywallVariantViewed(
  variantId: string,
  paywallId = "main_paywall"
): Promise<void> {
  await logEvent("paywall_variant_viewed", {
    variant_id: variantId,
    paywall_id: paywallId,
  });
}

/**
 * Fires when user closes the paywall without starting a trial or purchase.
 * High dismiss rate + low time = design/copy problem.
 * High dismiss rate + high time = pricing/value problem.
 *
 * @param timeOnPaywallSeconds - how long the user spent on the paywall
 * @param triggerSource - what triggered the paywall originally
 */
export async function trackPaywallDismissed(
  timeOnPaywallSeconds: number,
  triggerSource: PaywallTriggerSource
): Promise<void> {
  await logEvent("paywall_dismissed", {
    time_on_paywall_seconds: Math.round(timeOnPaywallSeconds),
    trigger_source: triggerSource,
  });
  singularTrackPaywallDismissed(timeOnPaywallSeconds, triggerSource);
}

/**
 * Fires when user taps the primary CTA button (before Apple payment sheet appears).
 * This is the "hand-raise" metric — intent without commitment.
 * If CTA tap rate is high but trial_started is low, users are backing out of Apple's sheet.
 *
 * @param planSelected - which plan the user tapped CTA on
 */
export async function trackPaywallCtaTapped(
  planSelected: "annual" | "monthly"
): Promise<void> {
  await logEvent("paywall_cta_tapped", {
    plan_selected: planSelected,
  });
  singularTrackPaywallCtaTapped(planSelected);
}

/**
 * Fires when user taps to select a specific pricing option (before hitting CTA).
 * Shows which plan users gravitate toward — informs default selection strategy.
 *
 * @param planId - "annual" or "monthly"
 */
export async function trackPricingPlanSelected(
  planId: "annual" | "monthly"
): Promise<void> {
  await logEvent("pricing_plan_selected", {
    plan_id: planId,
  });
  singularTrackPricingPlanSelected(planId);
}

// ─── Core Action / Retention Events ──────────────────────────────────────────

/**
 * Fires each time the user logs a food entry — the primary value action in Calorly.
 * Users who perform this 3+ times in the first week retain at significantly higher rates.
 *
 * @param actionCount - total number of times this user has logged food (cumulative)
 */
export async function trackCoreActionPerformed(actionCount: number): Promise<void> {
  await logEvent("core_action_performed", {
    action_count: actionCount,
    action_type: "food_logged",
  });
  singularTrackCoreActionPerformed(actionCount);
}

// ─── Feature Usage Events ─────────────────────────────────────────────────────

/**
 * Fires when a user engages with a specific secondary feature.
 * Track only top features — not every tap. Used to identify "sticky features"
 * that correlate with high retention and conversion.
 *
 * @param featureName - the feature being used
 * @param userState - subscription state at time of use
 */
export async function trackFeatureUsed(
  featureName: FeatureName,
  userState: UserState
): Promise<void> {
  await logEvent("feature_used", {
    feature_name: featureName,
    user_state: userState,
  });
  singularTrackFeatureUsed(featureName, userState);
}

// ─── Error Tracking ───────────────────────────────────────────────────────────

/**
 * Fires when a critical user-facing error occurs.
 * Errors on the paywall or during purchase directly kill revenue.
 * A spike in this event after a release = something broke in the purchase flow.
 *
 * @param errorType - short error identifier e.g. "purchase_failed", "network_error"
 * @param screenName - which screen the error occurred on
 * @param userState - subscription state at time of error
 */
export async function trackCriticalError(
  errorType: string,
  screenName: string,
  userState: UserState
): Promise<void> {
  await logEvent("error_critical", {
    error_type: errorType,
    screen_name: screenName,
    user_state: userState,
  });
  singularTrackCriticalError(errorType, screenName, userState);
}

// ─── User Property Helpers ────────────────────────────────────────────────────

/**
 * Set the user's subscription state as a Firebase user property.
 * This allows segmenting ALL events by subscription tier in Firebase.
 * Call this whenever subscription state changes.
 *
 * @param userState - current subscription state
 */
export async function setUserSubscriptionProperty(userState: UserState): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) return;
    await analytics.setUserProperty("subscription_state", userState);
  } catch (e) {
    if (__DEV__) console.warn("[Analytics] Failed to set user property:", e);
  }
}

/**
 * Set the RevenueCat user ID in Firebase for cross-platform user matching.
 * Call this after RevenueCat is configured and the RC user ID is known.
 *
 * @param rcUserId - RevenueCat anonymous or identified user ID
 */
export async function setFirebaseUserId(rcUserId: string): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) return;
    await analytics.setUserId(rcUserId);
  } catch (e) {
    if (__DEV__) console.warn("[Analytics] Failed to set user ID:", e);
  }
}
