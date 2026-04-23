/**
 * Paywall Screen — 3-Screen Sequence with A/B Trial Variant
 * Country Estate palette: Forest, Cognac, Brass on Warm Linen
 * Inspired by Cal AI's minimal, typographic-first layout
 *
 * TRIAL_VARIANT: "A" = 3-day trial, "B" = 7-day trial
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
import { useSubscription } from "@/lib/subscription-provider";
import {
  trackPaywallViewed,
  trackPaywallDismissed,
  type PaywallTriggerSource,
  type UserState,
} from "@/lib/analytics";
import { trackAttGranted, trackAttDenied, trackAttPromptShown } from "@/lib/singular";
import { trackPermissionResult } from "@/lib/analytics";

// ─── Country Estate Palette ───────────────────────────────────────────────────
const C = {
  bg:          "#F4F1ED",
  surface:     "#EFECE7",
  card:        "#EAE6E0",
  border:      "#D9D4CC",
  forest:      "#2D3A3A",
  cognac:      "#A67C52",
  cognacLight: "#F0E6D8",
  brass:       "#D4AF37",
  text:        "#2D3A3A",
  textMuted:   "#7A7468",
  white:       "#FFFFFF",
};

// ─── A/B Trial Variant ────────────────────────────────────────────────────────
export type TrialVariant = "A" | "B";
const TRIAL_VARIANT: TrialVariant = "B";
const TRIAL_DAYS: Record<TrialVariant, number> = { A: 3, B: 7 };

const ANNUAL_PRICE = "$39.99";
const ANNUAL_PRICE_PER_WEEK = "$0.77";
const MONTHLY_PRICE = "$9.99";

// ─── ATT ──────────────────────────────────────────────────────────────────────
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ height: 3, backgroundColor: C.border, borderRadius: 2, overflow: "hidden", marginBottom: 32 }}>
      <View style={{
        height: "100%",
        width: `${((current + 1) / total) * 100}%` as any,
        backgroundColor: C.cognac,
        borderRadius: 2,
      }} />
    </View>
  );
}

function PrimaryCTA({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: C.forest,
        borderRadius: 50,
        paddingVertical: 18,
        alignItems: "center",
        opacity: pressed ? 0.85 : 1,
        marginBottom: 12,
      })}
    >
      <Text style={{ fontSize: 17, fontWeight: "700", color: C.bg, letterSpacing: 0.2 }}>{label}</Text>
    </Pressable>
  );
}

// ─── Screen 1: Trial Offer ────────────────────────────────────────────────────
function TrialOfferScreen({ trialDays, onContinue, onSkip }: {
  trialDays: number; onContinue: () => void; onSkip: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <ProgressBar current={0} total={3} />

        <Text style={{ fontSize: 38, fontWeight: "800", color: C.forest, letterSpacing: -1, lineHeight: 44, marginBottom: 8 }}>
          We want you to{"\n"}try Calorly{"\n"}for free.
        </Text>
        <Text style={{ fontSize: 16, color: C.textMuted, lineHeight: 24, marginBottom: 32 }}>
          Start your <Text style={{ fontWeight: "700", color: C.cognac }}>{trialDays}-day free trial</Text> and unlock every Pro feature.
        </Text>

        {/* Feature list */}
        <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: C.border }}>
          {[
            "AI photo & voice food logging",
            "Full macro breakdown",
            "Unlimited food & exercise logs",
            "Progress charts & streak tracking",
            "Personalised hydration goals",
          ].map((f, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: i < 4 ? 14 : 0 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.cognac, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: C.white, fontSize: 11, fontWeight: "900" }}>✓</Text>
              </View>
              <Text style={{ fontSize: 15, color: C.forest, fontWeight: "600", flex: 1 }}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Pricing note */}
        <View style={{ backgroundColor: C.cognacLight, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: C.cognac + "40", marginBottom: 28 }}>
          <Text style={{ fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 20 }}>
            After your {trialDays}-day free trial, you'll be billed{" "}
            <Text style={{ fontWeight: "700", color: C.cognac }}>{ANNUAL_PRICE}/year</Text>
            {" "}(just <Text style={{ fontWeight: "700", color: C.cognac }}>{ANNUAL_PRICE_PER_WEEK}/week</Text>). Cancel any time.
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: C.cognac, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: C.cognac, fontSize: 10, fontWeight: "900" }}>✓</Text>
          </View>
          <Text style={{ fontSize: 14, color: C.textMuted, fontWeight: "600" }}>No Payment Due Now</Text>
        </View>

        <PrimaryCTA label={`Start ${trialDays}-Day Free Trial`} onPress={onContinue} />

        <Pressable onPress={onSkip} style={{ alignItems: "center", padding: 12 }}>
          <Text style={{ fontSize: 14, color: C.textMuted }}>No thanks, continue without Pro</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Screen 2: Timeline ───────────────────────────────────────────────────────
function TimelineScreen({ trialDays, onContinue, onBack }: {
  trialDays: number; onContinue: () => void; onBack: () => void;
}) {
  const reminderDay = trialDays - 1;
  const items = [
    { day: "Today",              title: "Your free trial starts",     desc: "Unlock every Pro feature immediately — no restrictions.", highlight: true },
    { day: `Day ${reminderDay}`, title: "Reminder before billing",    desc: "We'll send you a reminder so you're never caught off guard.", highlight: false },
    { day: `Day ${trialDays}`,   title: "Trial ends — billing starts", desc: `${ANNUAL_PRICE}/year unless you cancel before this date.`, highlight: false },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <ProgressBar current={1} total={3} />

        <Text style={{ fontSize: 34, fontWeight: "800", color: C.forest, letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 }}>
          Here's how{"\n"}it works.
        </Text>
        <Text style={{ fontSize: 16, color: C.textMuted, lineHeight: 24, marginBottom: 32 }}>
          No surprises. Here's exactly what happens during your trial.
        </Text>

        <View style={{ marginBottom: 28 }}>
          {items.map((item, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ alignItems: "center", width: 44 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: item.highlight ? C.cognac : C.surface,
                  borderWidth: 1.5, borderColor: item.highlight ? C.cognac : C.border,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 18, color: item.highlight ? C.white : C.textMuted }}>
                    {i === 0 ? "→" : i === 1 ? "○" : "◇"}
                  </Text>
                </View>
                {i < items.length - 1 && (
                  <View style={{ width: 1.5, flex: 1, minHeight: 32, backgroundColor: C.border, marginVertical: 4, borderRadius: 1 }} />
                )}
              </View>
              <View style={{ flex: 1, paddingBottom: i < items.length - 1 ? 24 : 0 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: item.highlight ? C.cognac : C.textMuted, marginBottom: 2, letterSpacing: 1, textTransform: "uppercase" }}>
                  {item.day}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: C.forest, marginBottom: 4 }}>{item.title}</Text>
                <Text style={{ fontSize: 14, color: C.textMuted, lineHeight: 20 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Cancel note */}
        <View style={{ backgroundColor: C.surface, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28, borderWidth: 1.5, borderColor: C.border }}>
          <Text style={{ fontSize: 20 }}>🛡</Text>
          <Text style={{ flex: 1, fontSize: 13, color: C.textMuted, lineHeight: 20 }}>
            Cancel any time in <Text style={{ fontWeight: "700", color: C.forest }}>Settings → Subscriptions</Text>. No questions asked.
          </Text>
        </View>

        <PrimaryCTA label="Continue" onPress={onContinue} />
        <Pressable onPress={onBack} style={{ alignItems: "center", padding: 12 }}>
          <Text style={{ fontSize: 14, color: C.textMuted }}>Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Screen 3: Plan Selection ─────────────────────────────────────────────────
function PlanSelectionScreen({ trialDays, onStartTrial, onBack }: {
  trialDays: number; onStartTrial: (plan: "annual" | "monthly") => void; onBack: () => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <ProgressBar current={2} total={3} />

        <Text style={{ fontSize: 34, fontWeight: "800", color: C.forest, letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 }}>
          Choose your{"\n"}plan.
        </Text>
        <Text style={{ fontSize: 16, color: C.textMuted, lineHeight: 24, marginBottom: 28 }}>
          Both plans include the same {trialDays}-day free trial.
        </Text>

        {/* Annual Plan */}
        <Pressable
          onPress={() => setSelectedPlan("annual")}
          style={({ pressed }) => ({
            borderRadius: 16, padding: 20, marginBottom: 10,
            borderWidth: 1.5, borderColor: selectedPlan === "annual" ? C.cognac : C.border,
            backgroundColor: selectedPlan === "annual" ? C.cognacLight : C.surface,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {/* Brass "Best Value" badge */}
          <View style={{ position: "absolute", top: -11, right: 16, backgroundColor: C.brass, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: C.forest, letterSpacing: 0.5 }}>BEST VALUE</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: C.forest }}>Annual</Text>
              <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{ANNUAL_PRICE_PER_WEEK}/week · billed {ANNUAL_PRICE}/year</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 26, fontWeight: "800", color: selectedPlan === "annual" ? C.cognac : C.forest }}>{ANNUAL_PRICE}</Text>
              <Text style={{ fontSize: 11, color: C.textMuted }}>per year</Text>
            </View>
          </View>
          {selectedPlan === "annual" && (
            <View style={{ marginTop: 12, backgroundColor: C.cognac + "20", borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 12, color: C.cognac, fontWeight: "700", textAlign: "center" }}>
                {trialDays} days free, then {ANNUAL_PRICE}/year
              </Text>
            </View>
          )}
        </Pressable>

        {/* Monthly Plan */}
        <Pressable
          onPress={() => setSelectedPlan("monthly")}
          style={({ pressed }) => ({
            borderRadius: 16, padding: 20, marginBottom: 28,
            borderWidth: 1.5, borderColor: selectedPlan === "monthly" ? C.cognac : C.border,
            backgroundColor: selectedPlan === "monthly" ? C.cognacLight : C.surface,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: C.forest }}>Monthly</Text>
              <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Billed {MONTHLY_PRICE}/month · cancel any time</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 26, fontWeight: "800", color: selectedPlan === "monthly" ? C.cognac : C.forest }}>{MONTHLY_PRICE}</Text>
              <Text style={{ fontSize: 11, color: C.textMuted }}>per month</Text>
            </View>
          </View>
          {selectedPlan === "monthly" && (
            <View style={{ marginTop: 12, backgroundColor: C.cognac + "20", borderRadius: 8, padding: 8 }}>
              <Text style={{ fontSize: 12, color: C.cognac, fontWeight: "700", textAlign: "center" }}>
                {trialDays} days free, then {MONTHLY_PRICE}/month
              </Text>
            </View>
          )}
        </Pressable>

        <PrimaryCTA label={`Try Free for ${trialDays} Days`} onPress={() => onStartTrial(selectedPlan)} />

        <Text style={{ fontSize: 12, color: C.textMuted, textAlign: "center", lineHeight: 18, marginBottom: 12 }}>
          Cancel any time before Day {trialDays} and you won't be charged. By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>

        <Pressable onPress={onBack} style={{ alignItems: "center", padding: 12 }}>
          <Text style={{ fontSize: 14, color: C.textMuted }}>Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Main Paywall Screen ──────────────────────────────────────────────────────
export default function PaywallScreen() {
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
        if (result === "granted") await trackAttGranted();
        else await trackAttDenied();
      }
    } catch {}
  };

  const handleDismiss = async () => {
    const timeOnPaywall = (Date.now() - openedAtRef.current) / 1000;
    trackPaywallDismissed(timeOnPaywall, triggerSource);
    await showATT();
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const handleStartTrial = async (plan: "annual" | "monthly") => {
    setIsProcessing(true);
    try {
      if (Platform.OS !== "web") {
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
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={C.cognac} />
        <Text style={{ marginTop: 16, fontSize: 15, color: C.textMuted, fontWeight: "600" }}>Setting up your trial…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {paywallStep === 0 && (
        <TrialOfferScreen trialDays={trialDays} onContinue={() => setPaywallStep(1)} onSkip={handleDismiss} />
      )}
      {paywallStep === 1 && (
        <TimelineScreen trialDays={trialDays} onContinue={() => setPaywallStep(2)} onBack={() => setPaywallStep(0)} />
      )}
      {paywallStep === 2 && (
        <PlanSelectionScreen trialDays={trialDays} onStartTrial={handleStartTrial} onBack={() => setPaywallStep(1)} />
      )}
    </View>
  );
}
