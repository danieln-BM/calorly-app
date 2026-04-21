/**
 * Paywall Screen — 3-Screen Sequence with A/B Trial Variant + Brand Design
 *
 * Design language: warm orange/peach gradients, avocado mascot, bold playful
 * typography, rounded pill buttons — matching the Calorly brand identity.
 *
 * Trial length is controlled by TRIAL_VARIANT:
 *   "A" → 3-day free trial
 *   "B" → 7-day free trial
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
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/use-colors";
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
const MASCOT_HERO = require("@/assets/images/mascot/mascot-hero.png");
const MASCOT_CELEBRATE = require("@/assets/images/mascot/mascot-celebrate.png");

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND = {
  orange: "#FF8C42",
  orangeLight: "#FFAD6B",
  gradientBg: ["#FFF5E6", "#FFE4C4"] as [string, string],
  gradientHero: ["#FF8C42", "#FFD580"] as [string, string],
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
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? BRAND.orange : "rgba(255,140,66,0.25)",
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
}: {
  trialDays: number;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <LinearGradient colors={BRAND.gradientBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <ProgressDots current={0} total={3} />

        {/* Mascot hero */}
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <Image source={MASCOT_HERO} style={{ width: 160, height: 160 }} resizeMode="contain" />
        </View>

        {/* Headline */}
        <Text style={{ fontSize: 32, fontWeight: "900", color: "#2D2D2D", textAlign: "center", letterSpacing: -1, marginBottom: 8, lineHeight: 38 }}>
          Unlock Your{"\n"}Full Potential! 🥑
        </Text>
        <Text style={{ fontSize: 15, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 28 }}>
          Start your <Text style={{ fontWeight: "800", color: BRAND.orange }}>{trialDays}-day free trial</Text> and get full access to every Calorly Pro feature.
        </Text>

        {/* Feature list */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.07,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          {[
            { icon: "📸", label: "AI photo & voice food logging" },
            { icon: "📊", label: "Full macro breakdown (protein, carbs, fat)" },
            { icon: "🔥", label: "Unlimited food & exercise logs" },
            { icon: "📈", label: "Progress charts & streak tracking" },
            { icon: "💧", label: "Personalised hydration goals" },
          ].map((f) => (
            <View key={f.label} style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: BRAND.orange + "20", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 18 }}>{f.icon}</Text>
              </View>
              <Text style={{ fontSize: 15, color: "#2D2D2D", fontWeight: "600", flex: 1 }}>{f.label}</Text>
              <Text style={{ fontSize: 14, color: BRAND.orange, fontWeight: "800" }}>✓</Text>
            </View>
          ))}
        </View>

        {/* Pricing note */}
        <View
          style={{
            backgroundColor: BRAND.orange + "15",
            borderRadius: 16,
            padding: 14,
            borderWidth: 2,
            borderColor: BRAND.orange + "30",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 13, color: "#555", textAlign: "center", lineHeight: 20 }}>
            After your {trialDays}-day free trial, you'll be billed{" "}
            <Text style={{ fontWeight: "800", color: BRAND.orange }}>{ANNUAL_PRICE}/year</Text> (just{" "}
            <Text style={{ fontWeight: "800", color: BRAND.orange }}>{ANNUAL_PRICE_PER_WEEK}/week</Text>). Cancel any time.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            backgroundColor: BRAND.orange,
            borderRadius: 50,
            padding: 18,
            alignItems: "center",
            marginBottom: 14,
            opacity: pressed ? 0.85 : 1,
            shadowColor: BRAND.orange,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 5,
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: 0.3 }}>
            Start {trialDays}-Day Free Trial →
          </Text>
        </Pressable>

        <Pressable onPress={onSkip} style={{ alignItems: "center", padding: 10 }}>
          <Text style={{ fontSize: 14, color: "#AAA" }}>No thanks, continue without Pro</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Screen 2: Timeline ───────────────────────────────────────────────────────
function TimelineScreen({
  trialDays,
  onContinue,
  onBack,
}: {
  trialDays: number;
  onContinue: () => void;
  onBack: () => void;
}) {
  const reminderDay = trialDays - 1;
  const items = [
    { day: "Today", icon: "🎉", title: "Your free trial starts", desc: "Unlock every Pro feature immediately — no restrictions.", highlight: true },
    { day: `Day ${reminderDay}`, icon: "🔔", title: "Reminder before billing", desc: `We'll send you a reminder so you're never caught off guard.`, highlight: false },
    { day: `Day ${trialDays}`, icon: "💳", title: "Trial ends — billing starts", desc: `${ANNUAL_PRICE}/year unless you cancel before this date.`, highlight: false },
  ];

  return (
    <LinearGradient colors={BRAND.gradientBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <ProgressDots current={1} total={3} />

        <Text style={{ fontSize: 28, fontWeight: "900", color: "#2D2D2D", textAlign: "center", marginBottom: 8, letterSpacing: -0.5 }}>
          Here's how it works 📅
        </Text>
        <Text style={{ fontSize: 15, color: "#666", textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
          No surprises. Here's exactly what happens during your trial.
        </Text>

        {/* Timeline */}
        <View style={{ marginBottom: 28 }}>
          {items.map((item, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ alignItems: "center", width: 48 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: item.highlight ? BRAND.orange : "#fff",
                    borderWidth: 2.5,
                    borderColor: item.highlight ? BRAND.orange : "#E8E8E8",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: item.highlight ? BRAND.orange : "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: item.highlight ? 0.3 : 0.05,
                    shadowRadius: 6,
                    elevation: item.highlight ? 3 : 1,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                {i < items.length - 1 && (
                  <View style={{ width: 2.5, flex: 1, minHeight: 36, backgroundColor: "#E8E8E8", marginVertical: 4, borderRadius: 2 }} />
                )}
              </View>
              <View style={{ flex: 1, paddingBottom: i < items.length - 1 ? 28 : 0 }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: BRAND.orange, marginBottom: 2, letterSpacing: 0.5 }}>
                  {item.day.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#2D2D2D", marginBottom: 4 }}>{item.title}</Text>
                <Text style={{ fontSize: 14, color: "#888", lineHeight: 20 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Cancel note */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 28 }}>🛡️</Text>
          <Text style={{ flex: 1, fontSize: 13, color: "#555", lineHeight: 20 }}>
            Cancel any time in <Text style={{ fontWeight: "700" }}>Settings → Subscriptions</Text>. No questions asked.
          </Text>
        </View>

        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            backgroundColor: BRAND.orange,
            borderRadius: 50,
            padding: 18,
            alignItems: "center",
            marginBottom: 14,
            opacity: pressed ? 0.85 : 1,
            shadowColor: BRAND.orange,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 5,
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }}>Continue →</Text>
        </Pressable>

        <Pressable onPress={onBack} style={{ alignItems: "center", padding: 10 }}>
          <Text style={{ fontSize: 14, color: "#AAA" }}>← Back</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Screen 3: Plan Selection ─────────────────────────────────────────────────
function PlanSelectionScreen({
  trialDays,
  onStartTrial,
  onBack,
}: {
  trialDays: number;
  onStartTrial: (plan: "annual" | "monthly") => void;
  onBack: () => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");

  return (
    <LinearGradient colors={BRAND.gradientBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <ProgressDots current={2} total={3} />

        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <Image source={MASCOT_CELEBRATE} style={{ width: 140, height: 140 }} resizeMode="contain" />
        </View>

        <Text style={{ fontSize: 28, fontWeight: "900", color: "#2D2D2D", textAlign: "center", marginBottom: 8, letterSpacing: -0.5 }}>
          Choose your plan 🎉
        </Text>
        <Text style={{ fontSize: 15, color: "#666", textAlign: "center", marginBottom: 28, lineHeight: 22 }}>
          Both plans include the same {trialDays}-day free trial.
        </Text>

        {/* Annual Plan */}
        <Pressable
          onPress={() => setSelectedPlan("annual")}
          style={({ pressed }) => ({
            borderRadius: 20,
            padding: 20,
            marginBottom: 12,
            borderWidth: 2.5,
            borderColor: selectedPlan === "annual" ? BRAND.orange : "#E8E8E8",
            backgroundColor: selectedPlan === "annual" ? BRAND.orange + "12" : "#fff",
            opacity: pressed ? 0.85 : 1,
            shadowColor: selectedPlan === "annual" ? BRAND.orange : "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: selectedPlan === "annual" ? 0.2 : 0.05,
            shadowRadius: 10,
            elevation: selectedPlan === "annual" ? 4 : 1,
          })}
        >
          {/* Best value badge */}
          <View
            style={{
              position: "absolute",
              top: -12,
              right: 16,
              backgroundColor: BRAND.orange,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "900", color: "#fff", letterSpacing: 0.5 }}>BEST VALUE</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#2D2D2D" }}>Annual</Text>
              <Text style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                {ANNUAL_PRICE_PER_WEEK}/week · billed {ANNUAL_PRICE}/year
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 26, fontWeight: "900", color: BRAND.orange }}>{ANNUAL_PRICE}</Text>
              <Text style={{ fontSize: 11, color: "#AAA" }}>per year</Text>
            </View>
          </View>

          {selectedPlan === "annual" && (
            <View style={{ marginTop: 12, backgroundColor: BRAND.orange + "20", borderRadius: 10, padding: 8 }}>
              <Text style={{ fontSize: 12, color: BRAND.orange, fontWeight: "800", textAlign: "center" }}>
                ✓ Selected — {trialDays} days free, then {ANNUAL_PRICE}/year
              </Text>
            </View>
          )}
        </Pressable>

        {/* Monthly Plan */}
        <Pressable
          onPress={() => setSelectedPlan("monthly")}
          style={({ pressed }) => ({
            borderRadius: 20,
            padding: 20,
            marginBottom: 28,
            borderWidth: 2.5,
            borderColor: selectedPlan === "monthly" ? BRAND.orange : "#E8E8E8",
            backgroundColor: selectedPlan === "monthly" ? BRAND.orange + "12" : "#fff",
            opacity: pressed ? 0.85 : 1,
            shadowColor: selectedPlan === "monthly" ? BRAND.orange : "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: selectedPlan === "monthly" ? 0.2 : 0.05,
            shadowRadius: 10,
            elevation: selectedPlan === "monthly" ? 4 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#2D2D2D" }}>Monthly</Text>
              <Text style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                Billed {MONTHLY_PRICE}/month · cancel any time
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 26, fontWeight: "900", color: "#2D2D2D" }}>{MONTHLY_PRICE}</Text>
              <Text style={{ fontSize: 11, color: "#AAA" }}>per month</Text>
            </View>
          </View>

          {selectedPlan === "monthly" && (
            <View style={{ marginTop: 12, backgroundColor: BRAND.orange + "20", borderRadius: 10, padding: 8 }}>
              <Text style={{ fontSize: 12, color: BRAND.orange, fontWeight: "800", textAlign: "center" }}>
                ✓ Selected — {trialDays} days free, then {MONTHLY_PRICE}/month
              </Text>
            </View>
          )}
        </Pressable>

        {/* Final CTA */}
        <Pressable
          onPress={() => onStartTrial(selectedPlan)}
          style={({ pressed }) => ({
            backgroundColor: BRAND.orange,
            borderRadius: 50,
            padding: 18,
            alignItems: "center",
            marginBottom: 12,
            opacity: pressed ? 0.85 : 1,
            shadowColor: BRAND.orange,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 5,
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: 0.3 }}>
            Try Free for {trialDays} Days →
          </Text>
        </Pressable>

        <Text style={{ fontSize: 12, color: "#BBB", textAlign: "center", lineHeight: 18, marginBottom: 14 }}>
          Cancel any time before Day {trialDays} and you won't be charged. By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>

        <Pressable onPress={onBack} style={{ alignItems: "center", padding: 10 }}>
          <Text style={{ fontSize: 14, color: "#AAA" }}>← Back</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
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
      <LinearGradient colors={BRAND.gradientBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Image source={MASCOT_CELEBRATE} style={{ width: 120, height: 120, marginBottom: 24 }} resizeMode="contain" />
        <ActivityIndicator size="large" color={BRAND.orange} />
        <Text style={{ marginTop: 16, fontSize: 15, color: "#666", fontWeight: "600" }}>Setting up your trial…</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {paywallStep === 0 && (
        <TrialOfferScreen
          trialDays={trialDays}
          onContinue={() => setPaywallStep(1)}
          onSkip={handleDismiss}
        />
      )}
      {paywallStep === 1 && (
        <TimelineScreen
          trialDays={trialDays}
          onContinue={() => setPaywallStep(2)}
          onBack={() => setPaywallStep(0)}
        />
      )}
      {paywallStep === 2 && (
        <PlanSelectionScreen
          trialDays={trialDays}
          onStartTrial={handleStartTrial}
          onBack={() => setPaywallStep(1)}
        />
      )}
    </View>
  );
}
