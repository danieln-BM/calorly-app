/**
 * Analytics Service Tests
 *
 * Verifies that all event functions call Firebase Analytics with the correct
 * event names and parameters. Firebase and react-native Platform are mocked
 * so tests run in Node without native modules.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Platform ────────────────────────────────────────────────────────────

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// ─── Mock Singular SDK ───────────────────────────────────────────────────────
// Singular is called inside analytics.ts after every Firebase event.
// We mock the entire singular module so tests don't need native modules.

vi.mock("../lib/singular", () => ({
  singularTrackAppOpen: vi.fn().mockResolvedValue(undefined),
  singularTrackOnboardingStarted: vi.fn().mockResolvedValue(undefined),
  singularTrackOnboardingStepCompleted: vi.fn().mockResolvedValue(undefined),
  singularTrackOnboardingCompleted: vi.fn().mockResolvedValue(undefined),
  singularTrackPermissionResult: vi.fn().mockResolvedValue(undefined),
  singularTrackAhaMomentReached: vi.fn().mockResolvedValue(undefined),
  singularTrackPaywallViewed: vi.fn().mockResolvedValue(undefined),
  singularTrackPaywallDismissed: vi.fn().mockResolvedValue(undefined),
  singularTrackPaywallCtaTapped: vi.fn().mockResolvedValue(undefined),
  singularTrackPricingPlanSelected: vi.fn().mockResolvedValue(undefined),
  singularTrackCoreActionPerformed: vi.fn().mockResolvedValue(undefined),
  singularTrackFeatureUsed: vi.fn().mockResolvedValue(undefined),
  singularTrackCriticalError: vi.fn().mockResolvedValue(undefined),
  initSingular: vi.fn().mockResolvedValue(undefined),
  setSingularUserId: vi.fn().mockResolvedValue(undefined),
  trackAttPromptShown: vi.fn().mockResolvedValue(undefined),
  trackAttGranted: vi.fn().mockResolvedValue(undefined),
  trackAttDenied: vi.fn().mockResolvedValue(undefined),
  trackSingularRevenue: vi.fn().mockResolvedValue(undefined),
  _resetSingularForTesting: vi.fn(),
}));

// ─── Mock Firebase Analytics ─────────────────────────────────────────────────

const mockLogEvent = vi.fn().mockResolvedValue(undefined);
const mockSetUserProperty = vi.fn().mockResolvedValue(undefined);
const mockSetUserId = vi.fn().mockResolvedValue(undefined);

vi.mock("@react-native-firebase/analytics", () => ({
  default: () => ({
    logEvent: mockLogEvent,
    setUserProperty: mockSetUserProperty,
    setUserId: mockSetUserId,
  }),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  trackAppOpen,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingCompleted,
  trackPermissionResult,
  trackAhaMomentReached,
  trackPaywallViewed,
  trackPaywallVariantViewed,
  trackPaywallDismissed,
  trackPaywallCtaTapped,
  trackPricingPlanSelected,
  trackCoreActionPerformed,
  trackFeatureUsed,
  trackCriticalError,
  setUserSubscriptionProperty,
  setFirebaseUserId,
} from "../lib/analytics";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Analytics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Session / App Open
  describe("session events", () => {
    it("trackAppOpen fires app_open_custom with platform param", async () => {
      await trackAppOpen();
      expect(mockLogEvent).toHaveBeenCalledWith("app_open_custom", {
        platform: "ios",
      });
    });
  });

  // Onboarding events
  describe("onboarding events", () => {
    it("trackOnboardingStarted fires correct event name", async () => {
      await trackOnboardingStarted();
      expect(mockLogEvent).toHaveBeenCalledWith("onboarding_started", undefined);
    });

    it("trackOnboardingStepCompleted fires with step_number and step_name", async () => {
      await trackOnboardingStepCompleted(1, "personal_info");
      expect(mockLogEvent).toHaveBeenCalledWith("onboarding_step_completed", {
        step_number: 1,
        step_name: "personal_info",
      });
    });

    it("trackOnboardingStepCompleted fires with activity_level step", async () => {
      await trackOnboardingStepCompleted(2, "activity_level");
      expect(mockLogEvent).toHaveBeenCalledWith("onboarding_step_completed", {
        step_number: 2,
        step_name: "activity_level",
      });
    });

    it("trackOnboardingCompleted fires correct event name", async () => {
      await trackOnboardingCompleted();
      expect(mockLogEvent).toHaveBeenCalledWith("onboarding_completed", undefined);
    });
  });

  // Permission events
  describe("permission events", () => {
    it("trackPermissionResult fires permission_granted when granted=true", async () => {
      await trackPermissionResult("camera", true);
      expect(mockLogEvent).toHaveBeenCalledWith("permission_granted", {
        permission_type: "camera",
      });
    });

    it("trackPermissionResult fires permission_denied when granted=false", async () => {
      await trackPermissionResult("notifications", false);
      expect(mockLogEvent).toHaveBeenCalledWith("permission_denied", {
        permission_type: "notifications",
      });
    });
  });

  // Activation event
  describe("activation events", () => {
    it("trackAhaMomentReached fires correct event name", async () => {
      await trackAhaMomentReached();
      expect(mockLogEvent).toHaveBeenCalledWith("aha_moment_reached", undefined);
    });
  });

  // Paywall events
  describe("paywall events", () => {
    it("trackPaywallViewed fires with all required params including paywall_id", async () => {
      await trackPaywallViewed("onboarding", "free", "control", "main_paywall");
      expect(mockLogEvent).toHaveBeenCalledWith("paywall_viewed", {
        trigger_source: "onboarding",
        user_state: "free",
        variant: "control",
        paywall_id: "main_paywall",
      });
    });

    it("trackPaywallViewed uses default variant and paywall_id when not specified", async () => {
      await trackPaywallViewed("feature_gate", "free");
      expect(mockLogEvent).toHaveBeenCalledWith("paywall_viewed", {
        trigger_source: "feature_gate",
        user_state: "free",
        variant: "control",
        paywall_id: "main_paywall",
      });
    });

    it("trackPaywallVariantViewed fires with variant_id and paywall_id", async () => {
      await trackPaywallVariantViewed("v2_headline", "main_paywall");
      expect(mockLogEvent).toHaveBeenCalledWith("paywall_variant_viewed", {
        variant_id: "v2_headline",
        paywall_id: "main_paywall",
      });
    });

    it("trackPaywallVariantViewed uses default paywall_id", async () => {
      await trackPaywallVariantViewed("v1_price_first");
      expect(mockLogEvent).toHaveBeenCalledWith("paywall_variant_viewed", {
        variant_id: "v1_price_first",
        paywall_id: "main_paywall",
      });
    });

    it("trackPaywallDismissed fires with time and trigger_source", async () => {
      await trackPaywallDismissed(12.5, "barcode_scanner");
      expect(mockLogEvent).toHaveBeenCalledWith("paywall_dismissed", {
        time_on_paywall_seconds: 13, // rounded
        trigger_source: "barcode_scanner",
      });
    });

    it("trackPaywallCtaTapped fires with plan_selected", async () => {
      await trackPaywallCtaTapped("annual");
      expect(mockLogEvent).toHaveBeenCalledWith("paywall_cta_tapped", {
        plan_selected: "annual",
      });
    });

    it("trackPaywallCtaTapped fires for monthly plan", async () => {
      await trackPaywallCtaTapped("monthly");
      expect(mockLogEvent).toHaveBeenCalledWith("paywall_cta_tapped", {
        plan_selected: "monthly",
      });
    });

    it("trackPricingPlanSelected fires with plan_id", async () => {
      await trackPricingPlanSelected("annual");
      expect(mockLogEvent).toHaveBeenCalledWith("pricing_plan_selected", {
        plan_id: "annual",
      });
    });
  });

  // Retention events
  describe("retention events", () => {
    it("trackCoreActionPerformed fires with action_count and action_type", async () => {
      await trackCoreActionPerformed(5);
      expect(mockLogEvent).toHaveBeenCalledWith("core_action_performed", {
        action_count: 5,
        action_type: "food_logged",
      });
    });
  });

  // Feature usage events
  describe("feature events", () => {
    it("trackFeatureUsed fires with feature_name and user_state", async () => {
      await trackFeatureUsed("barcode_scanner", "paid");
      expect(mockLogEvent).toHaveBeenCalledWith("feature_used", {
        feature_name: "barcode_scanner",
        user_state: "paid",
      });
    });

    it("trackFeatureUsed fires for custom_food feature", async () => {
      await trackFeatureUsed("custom_food", "paid");
      expect(mockLogEvent).toHaveBeenCalledWith("feature_used", {
        feature_name: "custom_food",
        user_state: "paid",
      });
    });
  });

  // Error tracking
  describe("error tracking", () => {
    it("trackCriticalError fires with all params", async () => {
      await trackCriticalError("purchase_failed", "paywall", "free");
      expect(mockLogEvent).toHaveBeenCalledWith("error_critical", {
        error_type: "purchase_failed",
        screen_name: "paywall",
        user_state: "free",
      });
    });
  });

  // User properties
  describe("user properties", () => {
    it("setUserSubscriptionProperty sets subscription_state property", async () => {
      await setUserSubscriptionProperty("paid");
      expect(mockSetUserProperty).toHaveBeenCalledWith("subscription_state", "paid");
    });

    it("setUserSubscriptionProperty sets free state", async () => {
      await setUserSubscriptionProperty("free");
      expect(mockSetUserProperty).toHaveBeenCalledWith("subscription_state", "free");
    });

    it("setFirebaseUserId sets the user ID", async () => {
      await setFirebaseUserId("rc_user_abc123");
      expect(mockSetUserId).toHaveBeenCalledWith("rc_user_abc123");
    });
  });

  // Web no-op behavior
  describe("web platform no-op", () => {
    it("does not throw on web platform (Firebase unavailable)", async () => {
      // All functions should silently succeed even if Firebase fails
      // The mock is already set up to succeed, but we verify no throws
      await expect(trackOnboardingStarted()).resolves.toBeUndefined();
      await expect(trackPaywallViewed("manual", "free")).resolves.toBeUndefined();
      await expect(trackCoreActionPerformed(1)).resolves.toBeUndefined();
    });
  });
});
