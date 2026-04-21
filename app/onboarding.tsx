import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  saveProfile,
  calculateCalorieGoal,
  calculateMacroGoals,
  UserProfile,
  DEFAULT_PROFILE,
} from "@/lib/store";
import {
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingCompleted,
} from "@/lib/analytics";

// ─── Mascot assets ────────────────────────────────────────────────────────────
const MASCOT_HERO = require("@/assets/images/mascot/mascot-hero.png");
const MASCOT_WAVE = require("@/assets/images/mascot/mascot-wave.png");
const MASCOT_CELEBRATE = require("@/assets/images/mascot/mascot-celebrate.png");

// ─── Brand colours (warm, playful — matches the design reference) ─────────────
const BRAND = {
  orange: "#FF8C42",
  orangeLight: "#FFAD6B",
  peach: "#FFDAB9",
  green: "#5CB85C",
  pink: "#E91E8C",
  gradientStart: "#FFD580",
  gradientEnd: "#FF8C42",
  gradientBg: ["#FFF5E6", "#FFE4C4"] as [string, string],
};

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", desc: "Little or no exercise", icon: "🛋️" },
  { value: "light", label: "Lightly Active", desc: "1-3 days/week", icon: "🚶" },
  { value: "moderate", label: "Moderately Active", desc: "3-5 days/week", icon: "🏃" },
  { value: "active", label: "Very Active", desc: "6-7 days/week", icon: "🏋️" },
  { value: "very_active", label: "Extra Active", desc: "Hard exercise daily", icon: "⚡" },
] as const;

const GOAL_OPTIONS = [
  { value: "lose", label: "Lose Weight", icon: "⬇️", desc: "500 kcal deficit/day" },
  { value: "maintain", label: "Maintain Weight", icon: "⚖️", desc: "Stay at current weight" },
  { value: "gain", label: "Gain Weight", icon: "⬆️", desc: "300 kcal surplus/day" },
] as const;

const WATER_OPTIONS = [
  { value: "rarely", label: "I rarely drink water", icon: "🏜️", desc: "Less than 2 glasses a day" },
  { value: "some", label: "I drink some water", icon: "💧", desc: "Around 2–4 glasses a day" },
  { value: "good", label: "I drink a decent amount", icon: "🥤", desc: "Around 4–6 glasses a day" },
  { value: "plenty", label: "I stay well hydrated", icon: "💦", desc: "6+ glasses a day" },
] as const;

const TRACKING_OPTIONS = [
  { value: "never", label: "I don't track at all", icon: "🤷", desc: "I eat by feel and don't count anything" },
  { value: "sometimes", label: "I track occasionally", icon: "📝", desc: "I log food when I remember" },
  { value: "often", label: "I track most of the time", icon: "📊", desc: "I log regularly but sometimes miss days" },
  { value: "always", label: "I track everything", icon: "✅", desc: "I know exactly what I eat and how much" },
] as const;

// ─── Shared UI helpers ────────────────────────────────────────────────────────

/** Warm peach gradient background wrapper */
function GradientBg({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <LinearGradient
      colors={BRAND.gradientBg}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
}

/** Bold playful section heading */
function PlayfulHeading({ children, color = "#2D2D2D" }: { children: React.ReactNode; color?: string }) {
  return (
    <Text
      style={{
        fontSize: 28,
        fontWeight: "900",
        color,
        letterSpacing: -0.5,
        marginBottom: 8,
        lineHeight: 34,
      }}
    >
      {children}
    </Text>
  );
}

/** Orange pill CTA button */
function OrangeCTA({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: secondary ? "transparent" : BRAND.orange,
        borderRadius: 50,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: "center",
        borderWidth: secondary ? 2 : 0,
        borderColor: secondary ? BRAND.orange : "transparent",
        opacity: pressed ? 0.85 : 1,
        shadowColor: secondary ? "transparent" : BRAND.orange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
      })}
    >
      <Text
        style={{
          fontSize: 17,
          fontWeight: "800",
          color: secondary ? BRAND.orange : "#fff",
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Selection card with orange highlight */
function SelectCard({
  selected,
  onPress,
  icon,
  label,
  desc,
}: {
  selected: boolean;
  onPress: () => void;
  icon: string;
  label: string;
  desc: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: selected ? BRAND.orange + "18" : "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 2.5,
        borderColor: selected ? BRAND.orange : "#E8E8E8",
        opacity: pressed ? 0.85 : 1,
        shadowColor: selected ? BRAND.orange : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selected ? 0.15 : 0.04,
        shadowRadius: 6,
        elevation: selected ? 3 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: selected ? BRAND.orange + "25" : "#F5F5F5",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#2D2D2D" }}>{label}</Text>
          <Text style={{ fontSize: 13, color: "#888", marginTop: 1 }}>{desc}</Text>
        </View>
      </View>
      {selected && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: BRAND.orange,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!showDisclaimer && !startedRef.current) {
      startedRef.current = true;
      trackOnboardingStarted();
    }
  }, [showDisclaimer]);

  const [form, setForm] = useState({
    name: "",
    age: "25",
    gender: "male" as "male" | "female" | "other",
    heightCm: "170",
    weightKg: "70",
    activityLevel: "moderate" as UserProfile["activityLevel"],
    goal: "maintain" as UserProfile["goal"],
    waterHabits: "some" as "rarely" | "some" | "good" | "plenty",
    weightDriverGuess: "" as "" | "exercise" | "diet" | "both" | "unsure",
    trackingHabit: "never" as "never" | "sometimes" | "often" | "always",
  });

  const handleComplete = async () => {
    const calorieGoal = calculateCalorieGoal({
      age: parseInt(form.age),
      gender: form.gender,
      heightCm: parseFloat(form.heightCm),
      weightKg: parseFloat(form.weightKg),
      activityLevel: form.activityLevel,
      goal: form.goal,
    });
    const macros = calculateMacroGoals(calorieGoal, form.goal);
    const waterGoalMap = { rarely: 6, some: 8, good: 8, plenty: 10 };
    const profile: UserProfile = {
      ...DEFAULT_PROFILE,
      name: form.name,
      age: parseInt(form.age),
      gender: form.gender,
      heightCm: parseFloat(form.heightCm),
      weightKg: parseFloat(form.weightKg),
      activityLevel: form.activityLevel,
      goal: form.goal,
      calorieGoal,
      proteinGoal: macros.protein,
      carbsGoal: macros.carbs,
      fatGoal: macros.fat,
      waterGoal: waterGoalMap[form.waterHabits],
      unitSystem: "metric",
      onboardingComplete: true,
      hasSeenDisclaimer: true,
    };
    await saveProfile(profile);
    await trackOnboardingCompleted();
    router.replace("/paywall?source=onboarding_complete");
  };

  // ─── Health Disclaimer ─────────────────────────────────────────────────────
  if (showDisclaimer) {
    return (
      <GradientBg>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          {/* Mascot hero */}
          <View style={{ alignItems: "center", marginTop: 24, marginBottom: 8 }}>
            <Image
              source={MASCOT_WAVE}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
          </View>

          {/* App name */}
          <Text
            style={{
              fontSize: 36,
              fontWeight: "900",
              color: BRAND.orange,
              textAlign: "center",
              letterSpacing: -1,
              marginBottom: 4,
            }}
          >
            Calorly
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#666",
              textAlign: "center",
              marginBottom: 28,
              fontWeight: "600",
            }}
          >
            Track Calories, Gain Energy, Live Happier
          </Text>

          {/* Disclaimer card */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 20,
              borderWidth: 2,
              borderColor: "#FFD580",
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Text style={{ fontSize: 22 }}>⚠️</Text>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#2D2D2D" }}>
                Health Disclaimer
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 22 }}>
              Calorly is for general wellness and informational purposes only. It is{" "}
              <Text style={{ fontWeight: "700" }}>not a medical device</Text> and should not be used
              to diagnose, treat, or prevent any health condition.
            </Text>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 22, marginTop: 10 }}>
              Always consult a healthcare professional before making significant changes to your diet
              or exercise routine. If you have a history of disordered eating, please seek
              professional advice before using this app.
            </Text>
          </View>

          <OrangeCTA
            label="I Understand — Let's Go! 🥑"
            onPress={() => setShowDisclaimer(false)}
          />
        </ScrollView>
      </GradientBg>
    );
  }

  const TOTAL_STEPS = 9;

  const navRow = (prevStep: number, onNext: () => void, nextLabel = "Continue →") => (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
      <Pressable
        onPress={() => setStep(prevStep)}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: "#fff",
          borderRadius: 50,
          padding: 16,
          alignItems: "center",
          borderWidth: 2,
          borderColor: "#E8E8E8",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#666" }}>← Back</Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          flex: 2,
          backgroundColor: BRAND.orange,
          borderRadius: 50,
          padding: 16,
          alignItems: "center",
          opacity: pressed ? 0.85 : 1,
          shadowColor: BRAND.orange,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 4,
        })}
      >
        <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>{nextLabel}</Text>
      </Pressable>
    </View>
  );

  const steps = [
    // ── Step 0: Personal Info ────────────────────────────────────────────────
    <KeyboardAvoidingView
      key="step0"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <GradientBg>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Image source={MASCOT_WAVE} style={{ width: 120, height: 120 }} resizeMode="contain" />
          </View>
          <PlayfulHeading>Tell us about yourself 👤</PlayfulHeading>
          <Text style={{ fontSize: 15, color: "#666", marginBottom: 28 }}>
            This helps us calculate your personalised calorie goals.
          </Text>

          {/* Name */}
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D2D", marginBottom: 8 }}>Your Name</Text>
          <TextInput
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Enter your name"
            placeholderTextColor="#BBBBBB"
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 14,
              fontSize: 16,
              color: "#2D2D2D",
              borderWidth: 2,
              borderColor: "#E8E8E8",
              marginBottom: 20,
            }}
          />

          {/* Gender */}
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D2D", marginBottom: 8 }}>Biological Sex</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            {(["male", "female", "other"] as const).map((g) => (
              <Pressable
                key={g}
                onPress={() => setForm((f) => ({ ...f, gender: g }))}
                style={({ pressed }) => ({
                  flex: 1,
                  padding: 12,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: form.gender === g ? BRAND.orange : "#fff",
                  borderWidth: 2,
                  borderColor: form.gender === g ? BRAND.orange : "#E8E8E8",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: form.gender === g ? "#fff" : "#2D2D2D", textTransform: "capitalize" }}>
                  {g}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Age */}
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D2D", marginBottom: 8 }}>Age</Text>
          <TextInput
            value={form.age}
            onChangeText={(v) => setForm((f) => ({ ...f, age: v }))}
            keyboardType="numeric"
            placeholder="25"
            placeholderTextColor="#BBBBBB"
            style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, fontSize: 16, color: "#2D2D2D", borderWidth: 2, borderColor: "#E8E8E8", marginBottom: 20 }}
          />

          {/* Height */}
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D2D", marginBottom: 8 }}>Height (cm)</Text>
          <TextInput
            value={form.heightCm}
            onChangeText={(v) => setForm((f) => ({ ...f, heightCm: v }))}
            keyboardType="numeric"
            placeholder="170"
            placeholderTextColor="#BBBBBB"
            style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, fontSize: 16, color: "#2D2D2D", borderWidth: 2, borderColor: "#E8E8E8", marginBottom: 20 }}
          />

          {/* Weight */}
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#2D2D2D", marginBottom: 8 }}>Weight (kg)</Text>
          <TextInput
            value={form.weightKg}
            onChangeText={(v) => setForm((f) => ({ ...f, weightKg: v }))}
            keyboardType="numeric"
            placeholder="70"
            placeholderTextColor="#BBBBBB"
            style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, fontSize: 16, color: "#2D2D2D", borderWidth: 2, borderColor: "#E8E8E8", marginBottom: 32 }}
          />

          <OrangeCTA
            label="Continue →"
            onPress={() => {
              const age = parseInt(form.age);
              const height = parseFloat(form.heightCm);
              const weight = parseFloat(form.weightKg);
              if (!age || age < 10 || age > 120) { Alert.alert("Invalid Age", "Please enter a valid age between 10 and 120."); return; }
              if (!height || height < 50 || height > 300) { Alert.alert("Invalid Height", "Please enter a valid height between 50 and 300 cm."); return; }
              if (!weight || weight < 10 || weight > 500) { Alert.alert("Invalid Weight", "Please enter a valid weight between 10 and 500 kg."); return; }
              trackOnboardingStepCompleted(1, "personal_info");
              setStep(1);
            }}
          />
        </ScrollView>
      </GradientBg>
    </KeyboardAvoidingView>,

    // ── Step 1: Activity Level ───────────────────────────────────────────────
    <GradientBg key="step1">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_HERO} style={{ width: 110, height: 110 }} resizeMode="contain" />
        </View>
        <PlayfulHeading>How active are you? 🏃</PlayfulHeading>
        <Text style={{ fontSize: 15, color: "#666", marginBottom: 24 }}>How active are you on a typical week?</Text>
        {ACTIVITY_OPTIONS.map((opt) => (
          <SelectCard
            key={opt.value}
            selected={form.activityLevel === opt.value}
            onPress={() => setForm((f) => ({ ...f, activityLevel: opt.value }))}
            icon={opt.icon}
            label={opt.label}
            desc={opt.desc}
          />
        ))}
        {navRow(0, () => { trackOnboardingStepCompleted(2, "activity_level"); setStep(2); })}
      </ScrollView>
    </GradientBg>,

    // ── Step 2: Goal ─────────────────────────────────────────────────────────
    <GradientBg key="step2">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_HERO} style={{ width: 110, height: 110 }} resizeMode="contain" />
        </View>
        <PlayfulHeading>What's your goal? 🎯</PlayfulHeading>
        <Text style={{ fontSize: 15, color: "#666", marginBottom: 24 }}>What do you want to achieve?</Text>
        {GOAL_OPTIONS.map((opt) => (
          <SelectCard
            key={opt.value}
            selected={form.goal === opt.value}
            onPress={() => setForm((f) => ({ ...f, goal: opt.value }))}
            icon={opt.icon}
            label={opt.label}
            desc={opt.desc}
          />
        ))}

        {/* Calorie preview card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            marginTop: 16,
            borderWidth: 2,
            borderColor: BRAND.orange + "50",
            shadowColor: BRAND.orange,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 13, color: "#888", marginBottom: 4, fontWeight: "600" }}>YOUR DAILY CALORIE GOAL</Text>
          <Text style={{ fontSize: 38, fontWeight: "900", color: BRAND.orange, letterSpacing: -1 }}>
            {calculateCalorieGoal({
              age: parseInt(form.age),
              gender: form.gender,
              heightCm: parseFloat(form.heightCm),
              weightKg: parseFloat(form.weightKg),
              activityLevel: form.activityLevel,
              goal: form.goal,
            })}{" "}
            <Text style={{ fontSize: 18, fontWeight: "600" }}>kcal/day</Text>
          </Text>
          <Text style={{ fontSize: 12, color: "#AAA", marginTop: 4 }}>Calculated using the Mifflin-St Jeor equation</Text>
        </View>

        {navRow(1, () => { trackOnboardingStepCompleted(3, "goal"); setStep(3); })}
      </ScrollView>
    </GradientBg>,

    // ── Step 3: Water Habits ─────────────────────────────────────────────────
    <GradientBg key="step3">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 64 }}>💧</Text>
        </View>
        <PlayfulHeading>Your Water Habits 💧</PlayfulHeading>
        <Text style={{ fontSize: 15, color: "#666", marginBottom: 6 }}>How much water do you typically drink each day?</Text>
        <Text style={{ fontSize: 13, color: "#AAA", marginBottom: 24, fontStyle: "italic" }}>We'll set a personalised hydration goal based on your answer.</Text>
        {WATER_OPTIONS.map((opt) => (
          <SelectCard
            key={opt.value}
            selected={form.waterHabits === opt.value}
            onPress={() => setForm((f) => ({ ...f, waterHabits: opt.value }))}
            icon={opt.icon}
            label={opt.label}
            desc={opt.desc}
          />
        ))}
        {navRow(2, () => { trackOnboardingStepCompleted(4, "water_habits"); setStep(4); })}
      </ScrollView>
    </GradientBg>,

    // ── Step 4: What drives weight change? ───────────────────────────────────
    <GradientBg key="step4">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_WAVE} style={{ width: 110, height: 110 }} resizeMode="contain" />
        </View>
        <PlayfulHeading>Quick question 🤔</PlayfulHeading>
        <Text style={{ fontSize: 15, color: "#666", marginBottom: 24 }}>
          In your experience, what has the biggest impact on your weight?
        </Text>
        {(
          [
            { value: "exercise", label: "Exercise", icon: "🏋️", desc: "Working out and staying active" },
            { value: "diet", label: "What I eat", icon: "🥗", desc: "The food and calories I consume" },
            { value: "both", label: "Both equally", icon: "⚖️", desc: "Diet and exercise matter the same" },
            { value: "unsure", label: "Honestly not sure", icon: "🤷", desc: "I'm still figuring it out" },
          ] as const
        ).map((opt) => (
          <SelectCard
            key={opt.value}
            selected={form.weightDriverGuess === opt.value}
            onPress={() => setForm((f) => ({ ...f, weightDriverGuess: opt.value }))}
            icon={opt.icon}
            label={opt.label}
            desc={opt.desc}
          />
        ))}
        {navRow(3, () => {
          if (!form.weightDriverGuess) { Alert.alert("Pick an option", "Let us know what you think before continuing."); return; }
          trackOnboardingStepCompleted(5, "weight_driver_guess");
          setStep(5);
        })}
      </ScrollView>
    </GradientBg>,

    // ── Step 5: 80/20 Reveal ─────────────────────────────────────────────────
    <LinearGradient
      key="step5"
      colors={["#FF8C42", "#FFD580"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Image source={MASCOT_HERO} style={{ width: 160, height: 160 }} resizeMode="contain" />
        </View>
        <Text style={{ fontSize: 72, fontWeight: "900", color: "#fff", textAlign: "center", letterSpacing: -3, marginBottom: 4 }}>
          80%
        </Text>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 16 }}>
          of your results come from nutrition
        </Text>
        <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 24, marginBottom: 28 }}>
          Exercise matters — but what you eat is the single biggest lever for changing your weight.
          Tracking your food, even roughly, produces results that exercise alone rarely does.
        </Text>

        {/* Bar chart */}
        <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 20, marginBottom: 28 }}>
          {[{ label: "Nutrition", pct: 80 }, { label: "Exercise", pct: 20 }].map((item) => (
            <View key={item.label} style={{ marginBottom: item.label === "Nutrition" ? 16 : 0 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{item.label}</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{item.pct}%</Text>
              </View>
              <View style={{ height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
                <View style={{ width: `${item.pct}%` as any, height: "100%", backgroundColor: "#fff", borderRadius: 6 }} />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => { trackOnboardingStepCompleted(6, "nutrition_reveal"); setStep(6); }}
          style={({ pressed }) => ({
            backgroundColor: "#fff",
            borderRadius: 50,
            padding: 18,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: "800", color: BRAND.orange }}>Got it — continue →</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>,

    // ── Step 6: Tracking Awareness ───────────────────────────────────────────
    <GradientBg key="step6">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 64 }}>📊</Text>
        </View>
        <PlayfulHeading>Your Tracking Habits 📊</PlayfulHeading>
        <Text style={{ fontSize: 15, color: "#666", marginBottom: 6 }}>How closely do you currently pay attention to what you eat?</Text>
        <Text style={{ fontSize: 13, color: "#AAA", marginBottom: 24, fontStyle: "italic" }}>Be honest — there's no wrong answer. This helps us tailor your experience.</Text>
        {TRACKING_OPTIONS.map((opt) => (
          <SelectCard
            key={opt.value}
            selected={form.trackingHabit === opt.value}
            onPress={() => setForm((f) => ({ ...f, trackingHabit: opt.value }))}
            icon={opt.icon}
            label={opt.label}
            desc={opt.desc}
          />
        ))}
        {navRow(5, () => { trackOnboardingStepCompleted(7, "tracking_habit"); setStep(7); })}
      </ScrollView>
    </GradientBg>,

    // ── Step 7: AI Introduction ──────────────────────────────────────────────
    <GradientBg key="step7">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_HERO} style={{ width: 130, height: 130 }} resizeMode="contain" />
        </View>
        <PlayfulHeading>Meet your AI nutrition coach 🤖</PlayfulHeading>
        <Text style={{ fontSize: 15, color: "#666", marginBottom: 24, lineHeight: 22 }}>
          Calorly uses computer vision and natural language AI to make tracking effortless.
        </Text>

        {[
          { icon: "📸", title: "Snap your meal", sub: "Image recognition · instant log", body: "Point your camera at any plate and Calorly identifies the food and estimates calories and macros in seconds." },
          { icon: "🎙️", title: "Just say it out loud", sub: "Voice input · hands-free logging", body: 'Say "two scrambled eggs and a coffee with oat milk" and Calorly logs it instantly — no typing, no searching.' },
        ].map((card) => (
          <View
            key={card.title}
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 18,
              marginBottom: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.07,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: BRAND.orange + "20", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 24 }}>{card.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#2D2D2D" }}>{card.title}</Text>
                <Text style={{ fontSize: 12, color: BRAND.orange, fontWeight: "600" }}>{card.sub}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 21 }}>{card.body}</Text>
          </View>
        ))}

        <View style={{ backgroundColor: BRAND.orange + "15", borderRadius: 16, padding: 16, borderWidth: 2, borderColor: BRAND.orange + "30", marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: BRAND.orange, marginBottom: 6 }}>HOW IT WORKS</Text>
          <Text style={{ fontSize: 13, color: "#555", lineHeight: 20 }}>
            Machine learning models trained on millions of food images and descriptions power every recognition. The more you use Calorly, the more accurate your personal log becomes.
          </Text>
        </View>

        {navRow(6, () => { trackOnboardingStepCompleted(8, "ai_intro"); setStep(8); })}
      </ScrollView>
    </GradientBg>,

    // ── Step 8: Traditional vs AI Tracker ───────────────────────────────────
    <GradientBg key="step8">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_CELEBRATE} style={{ width: 130, height: 130 }} resizeMode="contain" />
        </View>
        <PlayfulHeading>A smarter way to track 🚀</PlayfulHeading>
        <Text style={{ fontSize: 15, color: "#666", marginBottom: 24, lineHeight: 22 }}>See how Calorly compares to the old way of logging food.</Text>

        {/* Comparison table */}
        <View style={{ borderRadius: 20, overflow: "hidden", borderWidth: 2, borderColor: "#E8E8E8", marginBottom: 24, backgroundColor: "#fff" }}>
          <View style={{ flexDirection: "row", backgroundColor: "#F9F9F9", borderBottomWidth: 2, borderBottomColor: "#E8E8E8" }}>
            <View style={{ flex: 1, padding: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#AAA", textAlign: "center" }}>TRADITIONAL</Text>
            </View>
            <View style={{ width: 2, backgroundColor: "#E8E8E8" }} />
            <View style={{ flex: 1, padding: 14, backgroundColor: BRAND.orange + "12" }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: BRAND.orange, textAlign: "center" }}>CALORLY AI</Text>
            </View>
          </View>
          {[
            { t: "Search food manually", a: "Snap a photo or speak" },
            { t: "Estimate portions yourself", a: "AI estimates for you" },
            { t: "Tedious, easy to give up", a: "Seconds per meal" },
            { t: "Generic database results", a: "Learns your habits" },
            { t: "No coaching or context", a: "Personalised insights" },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: "row", borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "#F0F0F0" }}>
              <View style={{ flex: 1, padding: 14 }}>
                <Text style={{ fontSize: 13, color: "#AAA", textAlign: "center" }}>❌ {row.t}</Text>
              </View>
              <View style={{ width: 2, backgroundColor: "#E8E8E8" }} />
              <View style={{ flex: 1, padding: 14, backgroundColor: BRAND.orange + "06" }}>
                <Text style={{ fontSize: 13, color: "#2D2D2D", fontWeight: "700", textAlign: "center" }}>✅ {row.a}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => setStep(7)}
            style={({ pressed }) => ({ flex: 1, backgroundColor: "#fff", borderRadius: 50, padding: 16, alignItems: "center", borderWidth: 2, borderColor: "#E8E8E8", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#666" }}>← Back</Text>
          </Pressable>
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => ({
              flex: 2,
              backgroundColor: BRAND.orange,
              borderRadius: 50,
              padding: 16,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
              shadowColor: BRAND.orange,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 4,
            })}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Start Tracking! 🥑</Text>
          </Pressable>
        </View>
      </ScrollView>
    </GradientBg>,
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Progress bar */}
      <View
        style={{
          flexDirection: "row",
          gap: 4,
          paddingHorizontal: 24,
          paddingTop: 52,
          paddingBottom: 8,
          backgroundColor: "transparent",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: i <= step ? BRAND.orange : "rgba(255,255,255,0.5)",
            }}
          />
        ))}
      </View>
      <View style={{ flex: 1, paddingTop: 72 }}>
        {steps[step]}
      </View>
    </View>
  );
}
