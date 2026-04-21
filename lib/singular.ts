/**
 * Singular SDK Service — Calorly Attribution & Event Tracking
 *
 * Singular is the MMP (Mobile Measurement Partner) for Calorly.
 * It handles paid UA attribution (Meta, TikTok, Google UAC, Apple Search Ads)
 * and mirrors all custom product events for cross-channel analysis.
 *
 * ATT (App Tracking Transparency):
 * - `waitForTrackingAuthorizationWithTimeoutInterval: 300` is set so Singular
 *   pauses its first session until the user responds to the ATT dialog (up to 5 min).
 *   Without this, Singular initialises without an IDFA and paid UA attribution breaks.
 * - The ATT prompt is shown AFTER onboarding (user is engaged) but BEFORE the paywall.
 *   This timing maximises opt-in rate (~40-50% vs ~25% on cold launch).
 *
 * SKAdNetwork:
 * - `skAdNetworkEnabled: true` enables privacy-preserving attribution for iOS 14.5+.
 *   This is the fallback attribution signal when users deny ATT.
 *
 * NOTE: Singular SDK requires a real native build (EAS / development build).
 * On web or when the native module is unavailable, all calls are silently no-ops.
 *
 * API Key: stored in EXPO_PUBLIC_SINGULAR_API_KEY env var.
 * Secret:  stored in EXPO_PUBLIC_SINGULAR_SECRET env var.
 */

import { Platform } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SingularEventName =
  | "app_open_custom"
  | "onboarding_started"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "att_prompt_shown"
  | "att_granted"
  | "att_denied"
  | "permission_granted"
  | "permission_denied"
  | "aha_moment_reached"
  | "paywall_viewed"
  | "paywall_dismissed"
  | "paywall_cta_tapped"
  | "pricing_plan_selected"
  | "core_action_performed"
  | "feature_used"
  | "error_critical";

// ─── Singular SDK lazy loader ─────────────────────────────────────────────────

let _initialized = false;

/**
 * Lazily import and initialise the Singular SDK.
 * Returns the NativeSingular module or null on web / missing native module.
 */
async function getSingular() {
  if (Platform.OS === "web") return null;
  try {
    const mod = await import("singular-react-native/js/NativeSingular");
    return mod.default;
  } catch {
    return null;
  }
}

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Initialise the Singular SDK.
 *
 * Call this AFTER the ATT dialog has been shown (or after the pre-prompt if user
 * taps "Not Now"). Singular will wait up to 300 seconds for ATT resolution before
 * sending the first session — this ensures the IDFA is captured when available.
 *
 * @param rcUserId - RevenueCat user ID to use as Singular customUserId for cross-platform matching
 */
export async function initSingular(rcUserId?: string): Promise<void> {
  if (_initialized) return;
  const NativeSingular = await getSingular();
  if (!NativeSingular) return;

  const apiKey = process.env.EXPO_PUBLIC_SINGULAR_API_KEY;
  const secret = process.env.EXPO_PUBLIC_SINGULAR_SECRET;

  if (!apiKey || !secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Singular] Missing EXPO_PUBLIC_SINGULAR_API_KEY or EXPO_PUBLIC_SINGULAR_SECRET. " +
          "Set these in your .env file or via webdev_request_secrets."
      );
    }
    return;
  }

  try {
    const config = {
      apikey: apiKey,
      secret,
      // ATT: wait up to 300 seconds for the user to respond to the ATT dialog.
      // This is REQUIRED for correct IDFA capture and paid UA attribution.
      waitForTrackingAuthorizationWithTimeoutInterval: 300,
      // SKAdNetwork: privacy-preserving attribution for iOS 14.5+ (ATT denied users)
      skAdNetworkEnabled: true,
      // Custom user ID: use RC user ID for cross-platform user matching
      ...(rcUserId ? { customUserId: rcUserId } : {}),
    };

    NativeSingular.init(config);
    _initialized = true;

    if (process.env.NODE_ENV === "development") {
      console.log("[Singular] SDK initialised", { apiKey: apiKey.slice(0, 8) + "\u2026", rcUserId });
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[Singular] Init failed:", e);
  }
}

/**
 * Set the custom user ID after Singular is already initialised.
 * Call this when the RevenueCat user ID becomes available (e.g. after RC configure).
 *
 * @param userId - RevenueCat anonymous or identified user ID
 */
export async function setSingularUserId(userId: string): Promise<void> {
  const NativeSingular = await getSingular();
  if (!NativeSingular) return;
  try {
    NativeSingular.setCustomUserId(userId);
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[Singular] setCustomUserId failed:", e);
  }
}

// ─── Core event logger ────────────────────────────────────────────────────────

/**
 * Log a custom event to Singular.
 * Silently no-ops if SDK is not available or not initialised.
 */
async function singularEvent(
  name: SingularEventName,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  if (!_initialized) return;
  const NativeSingular = await getSingular();
  if (!NativeSingular) return;
  try {
    if (params && Object.keys(params).length > 0) {
      NativeSingular.eventWithArgs(name, params);
    } else {
      NativeSingular.event(name);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn(`[Singular] Failed to log "${name}":`, e);
  }
}

// ─── Revenue Tracking ─────────────────────────────────────────────────────────

/**
 * Track a subscription revenue event in Singular.
 * Call this immediately after a successful RevenueCat purchase.
 * Singular uses this for LTV modelling and ROAS calculation.
 *
 * @param currency - ISO 4217 currency code e.g. "USD"
 * @param amount - revenue amount in the given currency
 * @param planId - "annual" or "monthly"
 */
export async function trackSingularRevenue(
  currency: string,
  amount: number,
  planId: "annual" | "monthly"
): Promise<void> {
  if (!_initialized) return;
  const NativeSingular = await getSingular();
  if (!NativeSingular) return;
  try {
    NativeSingular.revenueWithArgs(currency, amount, { plan_id: planId });
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.warn("[Singular] revenue() failed:", e);
  }
}

// ─── ATT-specific events ──────────────────────────────────────────────────────

/** Fires when the custom ATT pre-prompt modal is shown to the user. */
export async function trackAttPromptShown(): Promise<void> {
  await singularEvent("att_prompt_shown");
}

/** Fires when the user grants ATT (allows tracking). */
export async function trackAttGranted(): Promise<void> {
  await singularEvent("att_granted");
}

/** Fires when the user denies ATT (asks app not to track). */
export async function trackAttDenied(): Promise<void> {
  await singularEvent("att_denied");
}

// ─── Mirrored Analytics Events ────────────────────────────────────────────────
// These mirror the Firebase analytics events so Singular has the same event
// coverage for attribution analysis and funnel reporting.

export async function singularTrackAppOpen(): Promise<void> {
  await singularEvent("app_open_custom", { platform: Platform.OS });
}

export async function singularTrackOnboardingStarted(): Promise<void> {
  await singularEvent("onboarding_started");
}

export async function singularTrackOnboardingStepCompleted(
  stepNumber: number,
  stepName: string
): Promise<void> {
  await singularEvent("onboarding_step_completed", {
    step_number: stepNumber,
    step_name: stepName,
  });
}

export async function singularTrackOnboardingCompleted(): Promise<void> {
  await singularEvent("onboarding_completed");
}

export async function singularTrackPermissionResult(
  permissionType: string,
  granted: boolean
): Promise<void> {
  await singularEvent(granted ? "permission_granted" : "permission_denied", {
    permission_type: permissionType,
  });
}

export async function singularTrackAhaMomentReached(): Promise<void> {
  await singularEvent("aha_moment_reached");
}

export async function singularTrackPaywallViewed(
  triggerSource: string,
  userState: string,
  variant = "control",
  paywallId = "main_paywall"
): Promise<void> {
  await singularEvent("paywall_viewed", {
    trigger_source: triggerSource,
    user_state: userState,
    variant,
    paywall_id: paywallId,
  });
}

export async function singularTrackPaywallDismissed(
  timeOnPaywallSeconds: number,
  triggerSource: string
): Promise<void> {
  await singularEvent("paywall_dismissed", {
    time_on_paywall_seconds: Math.round(timeOnPaywallSeconds),
    trigger_source: triggerSource,
  });
}

export async function singularTrackPaywallCtaTapped(
  planSelected: "annual" | "monthly"
): Promise<void> {
  await singularEvent("paywall_cta_tapped", { plan_selected: planSelected });
}

export async function singularTrackPricingPlanSelected(
  planId: "annual" | "monthly"
): Promise<void> {
  await singularEvent("pricing_plan_selected", { plan_id: planId });
}

export async function singularTrackCoreActionPerformed(actionCount: number): Promise<void> {
  await singularEvent("core_action_performed", {
    action_count: actionCount,
    action_type: "food_logged",
  });
}

export async function singularTrackFeatureUsed(
  featureName: string,
  userState: string
): Promise<void> {
  await singularEvent("feature_used", {
    feature_name: featureName,
    user_state: userState,
  });
}

export async function singularTrackCriticalError(
  errorType: string,
  screenName: string,
  userState: string
): Promise<void> {
  await singularEvent("error_critical", {
    error_type: errorType,
    screen_name: screenName,
    user_state: userState,
  });
}

// ─── Reset (for testing) ──────────────────────────────────────────────────────

/** Reset initialisation state — for unit tests only. */
export function _resetSingularForTesting(): void {
  _initialized = false;
}
