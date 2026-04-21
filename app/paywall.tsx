/**
 * Paywall Screen — 3-Screen Sequence with A/B Trial Variant
 *
 * Implements the Cal AI-inspired three-screen paywall:
 *   Screen 1 — Trial offer with pricing and Start/Continue CTA
 *   Screen 2 — Timeline / reminder screen (Day 1 → reminder → billing date)
 *   Screen 3 — Final "try for free" close with monthly vs yearly plan selection
 *
 * Trial length is controlled by the TRIAL_VARIANT flag (not hardcoded):
 *   "A" → 3-day free trial
 *   "B" → 7-day free trial
 *
 * On native iOS, the actual purchase is handed off to RevenueCat after the
 * user taps the CTA on Screen 3. On web, the flow completes without a purchase.
 *
 * Flow: Onboarding → Paywall (3 screens) → ATT (native Apple dialog) → App
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
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

// ─── A/B Trial Variant ────────────────────────────────────────────────────────
// Set to "A" for 3-day trial or "B" for 7-day trial.
// In production, wire this to your RevenueCat offering identifier or a remote
// config flag so you can switch variants without a code change.
export type TrialVariant = "A" | "B";
const TRIAL_VARIANT: TrialVariant = "B"; // ← change to "A" for 3-day trial

const TRIAL_DAYS: Record<TrialVariant, number> = {
  A: 3,
  B: 7,
};

// ─── Pricing ─────────────────────────────────────────────────────────────────
const ANNUAL_PRICE = "$39.99";
const ANNUAL_PRICE_PER_WEEK = "$0.77";
const MONTHLY_PRICE = "$9.99";

// ─── ATT helper ──────────────────────────────────────────────────────────────
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressDots({ current, total, colors }: { current: number; total: number; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── Screen 1: Trial Offer ────────────────────────────────────────────────────
function TrialOfferScreen({
  trialDays,
  onContinue,
  onSkip,
  colors,
}: {
  trialDays: number;
  onContinue: () => void;
  onSkip: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <ProgressDots current={0} total={3} colors={colors} />

      {/* Hero */}
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 48 }}>🥗</Text>
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: colors.foreground,
            textAlign: "center",
            marginBottom: 10,
            lineHeight: 34,
          }}
        >
          Start your {trialDays}-day{"\n"}free trial
        </Text>
        <Text style={{ fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 22 }}>
          Get full access to every Calorly Pro feature — AI food logging, unlimited tracking, macro
          insights, and more.
        </Text>
      </View>

      {/* Feature list */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 28,
          gap: 14,
        }}
      >
        {[
          { icon: "📸", label: "AI photo & voice food logging" },
          { icon: "📊", label: "Full macro breakdown (protein, carbs, fat)" },
          { icon: "🔥", label: "Unlimited food & exercise logs" },
          { icon: "📈", label: "Progress charts & streak tracking" },
          { icon: "💧", label: "Personalised hydration goals" },
        ].map((f) => (
          <View key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 22 }}>{f.icon}</Text>
            <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600" }}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Pricing note */}
      <View
        style={{
          backgroundColor: colors.primary + "12",
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.primary + "30",
          marginBottom: 24,
        }}
      >
        <Text style={{ fontSize: 13, color: colors.foreground, textAlign: "center", lineHeight: 20 }}>
          After your {trialDays}-day free trial, you'll be billed{" "}
          <Text style={{ fontWeight: "700" }}>{ANNUAL_PRICE}/year</Text> (just{" "}
          <Text style={{ fontWeight: "700" }}>{ANNUAL_PRICE_PER_WEEK}/week</Text>). Cancel any time
          before the trial ends and you won't be charged.
        </Text>
      </View>

      <Pressable
        onPress={onContinue}
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          borderRadius: 16,
          padding: 18,
          alignItems: "center",
          marginBottom: 14,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>
          Start {trialDays}-Day Free Trial →
        </Text>
      </Pressable>

      <Pressable onPress={onSkip} style={{ alignItems: "center", padding: 10 }}>
        <Text style={{ fontSize: 14, color: colors.muted }}>No thanks, continue without Pro</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Screen 2: Timeline / Reminder ───────────────────────────────────────────
function TimelineScreen({
  trialDays,
  onContinue,
  onBack,
  colors,
}: {
  trialDays: number;
  onContinue: () => void;
  onBack: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const reminderDay = trialDays - 1;

  const timelineItems = [
    {
      day: "Today",
      icon: "🎉",
      title: "Your free trial starts",
      desc: "Unlock every Pro feature immediately — no restrictions.",
      highlight: true,
    },
    {
      day: `Day ${reminderDay}`,
      icon: "🔔",
      title: "Reminder before billing",
      desc: `We'll send you a reminder so you're never caught off guard.`,
      highlight: false,
    },
    {
      day: `Day ${trialDays}`,
      icon: "💳",
      title: "Trial ends — billing starts",
      desc: `${ANNUAL_PRICE}/year unless you cancel before this date.`,
      highlight: false,
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <ProgressDots current={1} total={3} colors={colors} />

      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: colors.foreground,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Here's how it works
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: colors.muted,
          textAlign: "center",
          marginBottom: 32,
          lineHeight: 22,
        }}
      >
        No surprises. Here's exactly what happens during your trial.
      </Text>

      {/* Timeline */}
      <View style={{ marginBottom: 32 }}>
        {timelineItems.map((item, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 16, marginBottom: i < timelineItems.length - 1 ? 0 : 0 }}>
            {/* Left: dot + line */}
            <View style={{ alignItems: "center", width: 40 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: item.highlight ? colors.primary : colors.surface,
                  borderWidth: 2,
                  borderColor: item.highlight ? colors.primary : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              {i < timelineItems.length - 1 && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 40,
                    backgroundColor: colors.border,
                    marginVertical: 4,
                  }}
                />
              )}
            </View>

            {/* Right: content */}
            <View
              style={{
                flex: 1,
                paddingBottom: i < timelineItems.length - 1 ? 28 : 0,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary, marginBottom: 2 }}>
                {item.day.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Cancel reminder */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <Text style={{ fontSize: 24 }}>🛡️</Text>
        <Text style={{ flex: 1, fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
          You can cancel at any time in Settings → Subscriptions. No questions asked.
        </Text>
      </View>

      <Pressable
        onPress={onContinue}
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          borderRadius: 16,
          padding: 18,
          alignItems: "center",
          marginBottom: 14,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>Continue →</Text>
      </Pressable>

      <Pressable onPress={onBack} style={{ alignItems: "center", padding: 10 }}>
        <Text style={{ fontSize: 14, color: colors.muted }}>← Back</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Screen 3: Plan Selection + Final CTA ────────────────────────────────────
function PlanSelectionScreen({
  trialDays,
  onStartTrial,
  onBack,
  colors,
}: {
  trialDays: number;
  onStartTrial: (plan: "annual" | "monthly") => void;
  onBack: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");

  return (
    <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <ProgressDots current={2} total={3} colors={colors} />

      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: colors.foreground,
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        Choose your plan
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: colors.muted,
          textAlign: "center",
          marginBottom: 28,
          lineHeight: 22,
        }}
      >
        Both plans include the same {trialDays}-day free trial. Pick whichever suits you.
      </Text>

      {/* Annual Plan */}
      <Pressable
        onPress={() => setSelectedPlan("annual")}
        style={({ pressed }) => ({
          borderRadius: 16,
          padding: 18,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: selectedPlan === "annual" ? colors.primary : colors.border,
          backgroundColor: selectedPlan === "annual" ? colors.primary + "10" : colors.surface,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        {/* Best value badge */}
        <View
          style={{
            position: "absolute",
            top: -10,
            right: 16,
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "800", color: "#fff" }}>BEST VALUE</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>Annual</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
              {ANNUAL_PRICE_PER_WEEK}/week · billed {ANNUAL_PRICE}/year
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: colors.primary }}>{ANNUAL_PRICE}</Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>per year</Text>
          </View>
        </View>

        {selectedPlan === "annual" && (
          <View
            style={{
              marginTop: 12,
              backgroundColor: colors.primary + "15",
              borderRadius: 8,
              padding: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700", textAlign: "center" }}>
              ✓ Selected — {trialDays} days free, then {ANNUAL_PRICE}/year
            </Text>
          </View>
        )}
      </Pressable>

      {/* Monthly Plan */}
      <Pressable
        onPress={() => setSelectedPlan("monthly")}
        style={({ pressed }) => ({
          borderRadius: 16,
          padding: 18,
          marginBottom: 28,
          borderWidth: 2,
          borderColor: selectedPlan === "monthly" ? colors.primary : colors.border,
          backgroundColor: selectedPlan === "monthly" ? colors.primary + "10" : colors.surface,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>Monthly</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
              Billed {MONTHLY_PRICE}/month · cancel any time
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: colors.foreground }}>{MONTHLY_PRICE}</Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>per month</Text>
          </View>
        </View>

        {selectedPlan === "monthly" && (
          <View
            style={{
              marginTop: 12,
              backgroundColor: colors.primary + "15",
              borderRadius: 8,
              padding: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700", textAlign: "center" }}>
              ✓ Selected — {trialDays} days free, then {MONTHLY_PRICE}/month
            </Text>
          </View>
        )}
      </Pressable>

      {/* Final CTA */}
      <Pressable
        onPress={() => onStartTrial(selectedPlan)}
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          borderRadius: 16,
          padding: 18,
          alignItems: "center",
          marginBottom: 12,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>
          Try Free for {trialDays} Days →
        </Text>
      </Pressable>

      <Text
        style={{
          fontSize: 12,
          color: colors.muted,
          textAlign: "center",
          lineHeight: 18,
          marginBottom: 14,
        }}
      >
        Cancel any time before Day {trialDays} and you won't be charged. By continuing you agree to
        our Terms of Service and Privacy Policy.
      </Text>

      <Pressable onPress={onBack} style={{ alignItems: "center", padding: 10 }}>
        <Text style={{ fontSize: 14, color: colors.muted }}>← Back</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Main Paywall Screen ──────────────────────────────────────────────────────
export default function PaywallScreen() {
  const colors = useColors();
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { isPremium } = useSubscription();
  const openedAtRef = useRef<number>(Date.now());
  const hasLaunchedRef = useRef(false);
  const [paywallStep, setPaywallStep] = useState<0 | 1 | 2>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const trialDays = TRIAL_DAYS[TRIAL_VARIANT];
  const userState: UserState = isPremium ? "paid" : "free";
  const triggerSource: PaywallTriggerSource = (source as PaywallTriggerSource) ?? "manual";

  useEffect(() => {
    if (hasLaunchedRef.current) return;
    hasLaunchedRef.current = true;
    openedAtRef.current = Date.now();
    trackPaywallViewed(triggerSource, userState);
  }, []);

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

  const handleDismiss = async () => {
    const timeOnPaywall = (Date.now() - openedAtRef.current) / 1000;
    trackPaywallDismissed(timeOnPaywall, triggerSource);
    await showATT();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleStartTrial = async (plan: "annual" | "monthly") => {
    setIsProcessing(true);
    try {
      if (Platform.OS !== "web") {
        // On native: hand off to RevenueCat with the appropriate offering
        // The offering ID should correspond to the selected plan + trial variant
        // e.g. "pro_annual_trial_7d" or "pro_monthly_trial_7d"
        const RevenueCatUI = (await import("react-native-purchases-ui")).default;
        await RevenueCatUI.presentPaywall();
      }
    } catch (e) {
      console.warn("[RevenueCat] presentPaywall failed:", e);
    }
    setIsProcessing(false);
    await handleDismiss();
  };

  if (isProcessing) {
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
        <Text style={{ marginTop: 16, fontSize: 15, color: colors.muted }}>Setting up your trial…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {paywallStep === 0 && (
        <TrialOfferScreen
          trialDays={trialDays}
          onContinue={() => setPaywallStep(1)}
          onSkip={handleDismiss}
          colors={colors}
        />
      )}
      {paywallStep === 1 && (
        <TimelineScreen
          trialDays={trialDays}
          onContinue={() => setPaywallStep(2)}
          onBack={() => setPaywallStep(0)}
          colors={colors}
        />
      )}
      {paywallStep === 2 && (
        <PlanSelectionScreen
          trialDays={trialDays}
          onStartTrial={handleStartTrial}
          onBack={() => setPaywallStep(1)}
          colors={colors}
        />
      )}
    </View>
  );
}
