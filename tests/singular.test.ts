/**
 * Singular SDK Service Tests
 *
 * Verifies that all Singular event functions call the NativeSingular module
 * with correct event names and parameters.
 * NativeSingular and react-native Platform are mocked for Node test environment.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock react-native Platform ───────────────────────────────────────────────

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// ─── Mock singular-react-native NativeSingular ───────────────────────────────

const mockEvent = vi.fn();
const mockEventWithArgs = vi.fn();
const mockRevenueWithArgs = vi.fn();
const mockSetCustomUserId = vi.fn();
const mockInit = vi.fn();

vi.mock("singular-react-native/js/NativeSingular", () => ({
  default: {
    init: mockInit,
    event: mockEvent,
    eventWithArgs: mockEventWithArgs,
    revenueWithArgs: mockRevenueWithArgs,
    setCustomUserId: mockSetCustomUserId,
    addListener: vi.fn(),
    removeListeners: vi.fn(),
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import {
  initSingular,
  setSingularUserId,
  trackSingularRevenue,
  trackAttPromptShown,
  trackAttGranted,
  trackAttDenied,
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
  _resetSingularForTesting,
} from "../lib/singular";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Set env vars so initSingular doesn't bail out
process.env.EXPO_PUBLIC_SINGULAR_API_KEY = "test_api_key_12345";
process.env.EXPO_PUBLIC_SINGULAR_SECRET = "test_secret_67890";

async function initForTest() {
  _resetSingularForTesting();
  await initSingular("rc_test_user_123");
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Singular SDK Service", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await initForTest();
  });

  // Initialisation
  describe("initSingular", () => {
    it("calls NativeSingular.init with correct config", async () => {
      expect(mockInit).toHaveBeenCalledWith(
        expect.objectContaining({
          apikey: "test_api_key_12345",
          secret: "test_secret_67890",
          waitForTrackingAuthorizationWithTimeoutInterval: 300,
          skAdNetworkEnabled: true,
          customUserId: "rc_test_user_123",
        })
      );
    });

    it("does not call init twice (idempotent)", async () => {
      // Already initialised in beforeEach — calling again should no-op
      await initSingular("another_user");
      expect(mockInit).toHaveBeenCalledTimes(1);
    });
  });

  // User ID
  describe("setSingularUserId", () => {
    it("calls setCustomUserId with the provided user ID", async () => {
      await setSingularUserId("new_user_456");
      expect(mockSetCustomUserId).toHaveBeenCalledWith("new_user_456");
    });
  });

  // Revenue
  describe("trackSingularRevenue", () => {
    it("calls revenueWithArgs with currency, amount, and plan_id", async () => {
      await trackSingularRevenue("USD", 39.99, "annual");
      expect(mockRevenueWithArgs).toHaveBeenCalledWith("USD", 39.99, { plan_id: "annual" });
    });

    it("calls revenueWithArgs for monthly plan", async () => {
      await trackSingularRevenue("USD", 9.99, "monthly");
      expect(mockRevenueWithArgs).toHaveBeenCalledWith("USD", 9.99, { plan_id: "monthly" });
    });
  });

  // ATT events
  describe("ATT events", () => {
    it("trackAttPromptShown fires att_prompt_shown with no args", async () => {
      await trackAttPromptShown();
      expect(mockEvent).toHaveBeenCalledWith("att_prompt_shown");
    });

    it("trackAttGranted fires att_granted with no args", async () => {
      await trackAttGranted();
      expect(mockEvent).toHaveBeenCalledWith("att_granted");
    });

    it("trackAttDenied fires att_denied with no args", async () => {
      await trackAttDenied();
      expect(mockEvent).toHaveBeenCalledWith("att_denied");
    });
  });

  // App open
  describe("app open", () => {
    it("singularTrackAppOpen fires app_open_custom with platform param", async () => {
      await singularTrackAppOpen();
      expect(mockEventWithArgs).toHaveBeenCalledWith("app_open_custom", { platform: "ios" });
    });
  });

  // Onboarding events
  describe("onboarding events", () => {
    it("singularTrackOnboardingStarted fires onboarding_started", async () => {
      await singularTrackOnboardingStarted();
      expect(mockEvent).toHaveBeenCalledWith("onboarding_started");
    });

    it("singularTrackOnboardingStepCompleted fires with step_number and step_name", async () => {
      await singularTrackOnboardingStepCompleted(1, "personal_info");
      expect(mockEventWithArgs).toHaveBeenCalledWith("onboarding_step_completed", {
        step_number: 1,
        step_name: "personal_info",
      });
    });

    it("singularTrackOnboardingCompleted fires onboarding_completed", async () => {
      await singularTrackOnboardingCompleted();
      expect(mockEvent).toHaveBeenCalledWith("onboarding_completed");
    });
  });

  // Permission events
  describe("permission events", () => {
    it("singularTrackPermissionResult fires permission_granted when granted=true", async () => {
      await singularTrackPermissionResult("camera", true);
      expect(mockEventWithArgs).toHaveBeenCalledWith("permission_granted", {
        permission_type: "camera",
      });
    });

    it("singularTrackPermissionResult fires permission_denied when granted=false", async () => {
      await singularTrackPermissionResult("notifications", false);
      expect(mockEventWithArgs).toHaveBeenCalledWith("permission_denied", {
        permission_type: "notifications",
      });
    });
  });

  // Activation
  describe("activation events", () => {
    it("singularTrackAhaMomentReached fires aha_moment_reached", async () => {
      await singularTrackAhaMomentReached();
      expect(mockEvent).toHaveBeenCalledWith("aha_moment_reached");
    });
  });

  // Paywall events
  describe("paywall events", () => {
    it("singularTrackPaywallViewed fires with all params", async () => {
      await singularTrackPaywallViewed("onboarding", "free", "control", "main_paywall");
      expect(mockEventWithArgs).toHaveBeenCalledWith("paywall_viewed", {
        trigger_source: "onboarding",
        user_state: "free",
        variant: "control",
        paywall_id: "main_paywall",
      });
    });

    it("singularTrackPaywallViewed uses default variant and paywall_id", async () => {
      await singularTrackPaywallViewed("feature_gate", "free");
      expect(mockEventWithArgs).toHaveBeenCalledWith("paywall_viewed", {
        trigger_source: "feature_gate",
        user_state: "free",
        variant: "control",
        paywall_id: "main_paywall",
      });
    });

    it("singularTrackPaywallDismissed fires with rounded time and trigger_source", async () => {
      await singularTrackPaywallDismissed(12.7, "barcode_scanner");
      expect(mockEventWithArgs).toHaveBeenCalledWith("paywall_dismissed", {
        time_on_paywall_seconds: 13,
        trigger_source: "barcode_scanner",
      });
    });

    it("singularTrackPaywallCtaTapped fires with plan_selected", async () => {
      await singularTrackPaywallCtaTapped("annual");
      expect(mockEventWithArgs).toHaveBeenCalledWith("paywall_cta_tapped", {
        plan_selected: "annual",
      });
    });

    it("singularTrackPricingPlanSelected fires with plan_id", async () => {
      await singularTrackPricingPlanSelected("monthly");
      expect(mockEventWithArgs).toHaveBeenCalledWith("pricing_plan_selected", {
        plan_id: "monthly",
      });
    });
  });

  // Core action
  describe("core action events", () => {
    it("singularTrackCoreActionPerformed fires with action_count and action_type", async () => {
      await singularTrackCoreActionPerformed(5);
      expect(mockEventWithArgs).toHaveBeenCalledWith("core_action_performed", {
        action_count: 5,
        action_type: "food_logged",
      });
    });
  });

  // Feature usage
  describe("feature events", () => {
    it("singularTrackFeatureUsed fires with feature_name and user_state", async () => {
      await singularTrackFeatureUsed("barcode_scanner", "paid");
      expect(mockEventWithArgs).toHaveBeenCalledWith("feature_used", {
        feature_name: "barcode_scanner",
        user_state: "paid",
      });
    });
  });

  // Error tracking
  describe("error tracking", () => {
    it("singularTrackCriticalError fires with all params", async () => {
      await singularTrackCriticalError("purchase_failed", "paywall", "free");
      expect(mockEventWithArgs).toHaveBeenCalledWith("error_critical", {
        error_type: "purchase_failed",
        screen_name: "paywall",
        user_state: "free",
      });
    });
  });

  // No-op when not initialised
  describe("no-op when not initialised", () => {
    it("events are silently skipped when SDK is not initialised", async () => {
      _resetSingularForTesting();
      vi.clearAllMocks();
      await singularTrackOnboardingStarted();
      expect(mockEvent).not.toHaveBeenCalled();
    });
  });
});
