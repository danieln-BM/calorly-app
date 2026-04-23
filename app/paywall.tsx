/**
 * Paywall Screen — 3-Screen Sequence with A/B Trial Variant
 * Dark mode: neon green + orange on pure black — Apple-premium aesthetic
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
  Image,
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

// ─── Mascot ───────────────────────────────────────────────────────────────────
const MASCOT_HERO      = require("@/assets/images/mascot/mascot-hero.png");
const MASCOT_CELEBRATE = require("@/assets/images/mascot/mascot-celebrate.png");
const MASCOT_VICTORY   = require("@/assets/images/mascot/mascot-victory.png");

// ─── Dark palette ─────────────────────────────────────────────────────────────
const D = {
  bg:           "#000000",
  surface:      "#0D0D0D",
  card:         "#111111",
  cardBorder:   "#1C1C1E",
  neonGreen:    "#39FF14",
  neonGreenDim: "#1A7A0A",
  orange:       "#FF8C00",
  orangeDim:    "#7A3D00",
  text:         "#F5F5F5",
  textMuted:    "#6B7280",
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

// ─── Progress Dots ────────────────────────────────────────────────────────────
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 28 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? D.neonGreen : D.cardBorder,
            shadowColor: i === current ? D.neonGreen : "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: i === current ? 0.8 : 0,
            shadowRadius: 6,
          }}
        />
      ))}
    </View>
  );
}

// ─── Screen 1: Trial Offer ────────────────────────────────────────────────────
function TrialOfferScreen({ trialDays, onContinue, onSkip }: {
  trialDays: number; onContinue: () => void; onSkip: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <ProgressDots current={0} total={3} />

        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_HERO} style={{ width: 160, height: 160 }} resizeMode="contain" />
        </View>

        <Text style={{ fontSize: 32, fontWeight: "900", color: D.text, textAlign: "center", letterSpacing: -1, marginBottom: 8, lineHeight: 38 }}>
          Unlock Your{"\n"}
          <Text style={{ color: D.neonGreen, textShadowColor: D.neonGreen, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 }}>
            Full Potential
          </Text>
        </Text>
        <Text style={{ fontSize: 15, color: D.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 28 }}>
          Start your{" "}
          <Text style={{ fontWeight: "800", color: D.orange }}>{trialDays}-day free trial</Text>
          {" "}and get full access to every Calorly Pro feature.
        </Text>

        {/* Feature list */}
        <View style={{ backgroundColor: D.card, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: D.cardBorder }}>
          {[
            { icon: require("@/assets/images/icons/icon-camera.png"),    label: "AI photo & voice food logging" },
            { icon: require("@/assets/images/icons/icon-chart.png"),     label: "Full macro breakdown" },
            { icon: require("@/assets/images/icons/icon-lightning.png"), label: "Unlimited food & exercise logs" },
            { icon: require("@/assets/images/icons/icon-running.png"),   label: "Progress charts & streak tracking" },
            { icon: require("@/assets/images/icons/icon-water-drop.png"),label: "Personalised hydration goals" },
          ].map((f, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: i < 4 ? 14 : 0 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: D.neonGreenDim, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: D.neonGreen + "50" }}>
                <Image source={f.icon} style={{ width: 22, height: 22, tintColor: D.neonGreen }} resizeMode="contain" />
              </View>
              <Text style={{ fontSize: 15, color: D.text, fontWeight: "600", flex: 1 }}>{f.label}</Text>
              <Text style={{ fontSize: 14, color: D.neonGreen, fontWeight: "900" }}>✓</Text>
            </View>
          ))}
        </View>

        {/* Pricing note */}
        <View style={{ backgroundColor: D.orangeDim + "80", borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: D.orange + "40", marginBottom: 24 }}>
          <Text style={{ fontSize: 13, color: D.textMuted, textAlign: "center", lineHeight: 20 }}>
            After your {trialDays}-day free trial, you'll be billed{" "}
            <Text style={{ fontWeight: "800", color: D.orange }}>{ANNUAL_PRICE}/year</Text>
            {" "}(just{" "}
            <Text style={{ fontWeight: "800", color: D.orange }}>{ANNUAL_PRICE_PER_WEEK}/week</Text>
            ). Cancel any time.
          </Text>
        </View>

        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            backgroundColor: D.neonGreen, borderRadius: 50, padding: 18, alignItems: "center", marginBottom: 14,
            opacity: pressed ? 0.85 : 1, shadowColor: D.neonGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#000", letterSpacing: 0.3 }}>
            Start {trialDays}-Day Free Trial →
          </Text>
        </Pressable>

        <Pressable onPress={onSkip} style={{ alignItems: "center", padding: 10 }}>
          <Text style={{ fontSize: 14, color: D.textMuted }}>No thanks, continue without Pro</Text>
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
    { day: "Today",           icon: "🎉", title: "Your free trial starts",     desc: "Unlock every Pro feature immediately — no restrictions.", highlight: true },
    { day: `Day ${reminderDay}`, icon: "🔔", title: "Reminder before billing",  desc: `We'll send you a reminder so you're never caught off guard.`, highlight: false },
    { day: `Day ${trialDays}`,   icon: "💳", title: "Trial ends — billing starts", desc: `${ANNUAL_PRICE}/year unless you cancel before this date.`, highlight: false },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <ProgressDots current={1} total={3} />

        <Text style={{ fontSize: 28, fontWeight: "900", color: D.text, textAlign: "center", marginBottom: 8, letterSpacing: -0.5 }}>
          Here's how it works
        </Text>
        <Text style={{ fontSize: 15, color: D.textMuted, textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
          No surprises. Here's exactly what happens during your trial.
        </Text>

        <View style={{ marginBottom: 28 }}>
          {items.map((item, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ alignItems: "center", width: 48 }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: item.highlight ? D.neonGreenDim : D.card,
                  borderWidth: 2, borderColor: item.highlight ? D.neonGreen : D.cardBorder,
                  alignItems: "center", justifyContent: "center",
                  shadowColor: item.highlight ? D.neonGreen : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: item.highlight ? 0.6 : 0,
                  shadowRadius: 8,
                }}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                {i < items.length - 1 && (
                  <View style={{ width: 2, flex: 1, minHeight: 36, backgroundColor: D.cardBorder, marginVertical: 4, borderRadius: 2 }} />
                )}
              </View>
              <View style={{ flex: 1, paddingBottom: i < items.length - 1 ? 28 : 0 }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: item.highlight ? D.neonGreen : D.orange, marginBottom: 2, letterSpacing: 0.5 }}>
                  {item.day.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: D.text, marginBottom: 4 }}>{item.title}</Text>
                <Text style={{ fontSize: 14, color: D.textMuted, lineHeight: 20 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: D.card, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28, borderWidth: 1.5, borderColor: D.cardBorder }}>
          <Text style={{ fontSize: 28 }}>🛡️</Text>
          <Text style={{ flex: 1, fontSize: 13, color: D.textMuted, lineHeight: 20 }}>
            Cancel any time in <Text style={{ fontWeight: "700", color: D.text }}>Settings → Subscriptions</Text>. No questions asked.
          </Text>
        </View>

        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            backgroundColor: D.neonGreen, borderRadius: 50, padding: 18, alignItems: "center", marginBottom: 14,
            opacity: pressed ? 0.85 : 1, shadowColor: D.neonGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: "800", color: "#000" }}>Continue →</Text>
        </Pressable>

        <Pressable onPress={onBack} style={{ alignItems: "center", padding: 10 }}>
          <Text style={{ fontSize: 14, color: D.textMuted }}>← Back</Text>
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
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <ProgressDots current={2} total={3} />

        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <Image source={MASCOT_VICTORY} style={{ width: 140, height: 140 }} resizeMode="contain" />
        </View>

        <Text style={{ fontSize: 28, fontWeight: "900", color: D.text, textAlign: "center", marginBottom: 8, letterSpacing: -0.5 }}>
          Choose your plan
        </Text>
        <Text style={{ fontSize: 15, color: D.textMuted, textAlign: "center", marginBottom: 28, lineHeight: 22 }}>
          Both plans include the same {trialDays}-day free trial.
        </Text>

        {/* Annual Plan */}
        <Pressable
          onPress={() => setSelectedPlan("annual")}
          style={({ pressed }) => ({
            borderRadius: 20, padding: 20, marginBottom: 12,
            borderWidth: 2, borderColor: selectedPlan === "annual" ? D.neonGreen : D.cardBorder,
            backgroundColor: selectedPlan === "annual" ? D.neonGreenDim : D.card,
            opacity: pressed ? 0.85 : 1,
            shadowColor: selectedPlan === "annual" ? D.neonGreen : "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: selectedPlan === "annual" ? 0.4 : 0,
            shadowRadius: 12, elevation: selectedPlan === "annual" ? 4 : 0,
          })}
        >
          <View style={{ position: "absolute", top: -12, right: 16, backgroundColor: D.orange, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "900", color: "#000", letterSpacing: 0.5 }}>BEST VALUE</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: D.text }}>Annual</Text>
              <Text style={{ fontSize: 13, color: D.textMuted, marginTop: 2 }}>{ANNUAL_PRICE_PER_WEEK}/week · billed {ANNUAL_PRICE}/year</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 26, fontWeight: "900", color: D.neonGreen, textShadowColor: D.neonGreen, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>{ANNUAL_PRICE}</Text>
              <Text style={{ fontSize: 11, color: D.textMuted }}>per year</Text>
            </View>
          </View>
          {selectedPlan === "annual" && (
            <View style={{ marginTop: 12, backgroundColor: D.neonGreenDim, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: D.neonGreen + "40" }}>
              <Text style={{ fontSize: 12, color: D.neonGreen, fontWeight: "800", textAlign: "center" }}>
                ✓ Selected — {trialDays} days free, then {ANNUAL_PRICE}/year
              </Text>
            </View>
          )}
        </Pressable>

        {/* Monthly Plan */}
        <Pressable
          onPress={() => setSelectedPlan("monthly")}
          style={({ pressed }) => ({
            borderRadius: 20, padding: 20, marginBottom: 28,
            borderWidth: 2, borderColor: selectedPlan === "monthly" ? D.neonGreen : D.cardBorder,
            backgroundColor: selectedPlan === "monthly" ? D.neonGreenDim : D.card,
            opacity: pressed ? 0.85 : 1,
            shadowColor: selectedPlan === "monthly" ? D.neonGreen : "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: selectedPlan === "monthly" ? 0.4 : 0,
            shadowRadius: 12, elevation: selectedPlan === "monthly" ? 4 : 0,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: D.text }}>Monthly</Text>
              <Text style={{ fontSize: 13, color: D.textMuted, marginTop: 2 }}>Billed {MONTHLY_PRICE}/month · cancel any time</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 26, fontWeight: "900", color: D.text }}>{MONTHLY_PRICE}</Text>
              <Text style={{ fontSize: 11, color: D.textMuted }}>per month</Text>
            </View>
          </View>
          {selectedPlan === "monthly" && (
            <View style={{ marginTop: 12, backgroundColor: D.neonGreenDim, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: D.neonGreen + "40" }}>
              <Text style={{ fontSize: 12, color: D.neonGreen, fontWeight: "800", textAlign: "center" }}>
                ✓ Selected — {trialDays} days free, then {MONTHLY_PRICE}/month
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => onStartTrial(selectedPlan)}
          style={({ pressed }) => ({
            backgroundColor: D.neonGreen, borderRadius: 50, padding: 18, alignItems: "center", marginBottom: 12,
            opacity: pressed ? 0.85 : 1, shadowColor: D.neonGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#000", letterSpacing: 0.3 }}>
            Try Free for {trialDays} Days →
          </Text>
        </Pressable>

        <Text style={{ fontSize: 12, color: D.textMuted, textAlign: "center", lineHeight: 18, marginBottom: 14 }}>
          Cancel any time before Day {trialDays} and you won't be charged. By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>

        <Pressable onPress={onBack} style={{ alignItems: "center", padding: 10 }}>
          <Text style={{ fontSize: 14, color: D.textMuted }}>← Back</Text>
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
      <View style={{ flex: 1, backgroundColor: D.bg, alignItems: "center", justifyContent: "center" }}>
        <Image source={MASCOT_CELEBRATE} style={{ width: 120, height: 120, marginBottom: 24 }} resizeMode="contain" />
        <ActivityIndicator size="large" color={D.neonGreen} />
        <Text style={{ marginTop: 16, fontSize: 15, color: D.textMuted, fontWeight: "600" }}>Setting up your trial…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
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
