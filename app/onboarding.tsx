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
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

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

// ─── Mascot poses ─────────────────────────────────────────────────────────────
const MASCOT_WELCOME   = require("@/assets/images/mascot/mascot-welcome.png");
const MASCOT_THINKING  = require("@/assets/images/mascot/mascot-thinking.png");
const MASCOT_LIGHTBULB = require("@/assets/images/mascot/mascot-lightbulb.png");
const MASCOT_TECH      = require("@/assets/images/mascot/mascot-tech.png");
const MASCOT_VICTORY   = require("@/assets/images/mascot/mascot-victory.png");

// ─── Custom icons ─────────────────────────────────────────────────────────────
const ICON_PERSON    = require("@/assets/images/icons/icon-person.png");
const ICON_RUNNING   = require("@/assets/images/icons/icon-running.png");
const ICON_TARGET    = require("@/assets/images/icons/icon-target.png");
const ICON_WATER     = require("@/assets/images/icons/icon-water-drop.png");
const ICON_DESERT    = require("@/assets/images/icons/icon-desert.png");
const ICON_CUP       = require("@/assets/images/icons/icon-cup.png");
const ICON_DROPS     = require("@/assets/images/icons/icon-water-drops.png");
const ICON_THINKING  = require("@/assets/images/icons/icon-thinking.png");
const ICON_DUMBBELL  = require("@/assets/images/icons/icon-dumbbell.png");
const ICON_SALAD     = require("@/assets/images/icons/icon-salad.png");
const ICON_BALANCE   = require("@/assets/images/icons/icon-balance.png");
const ICON_SHRUG     = require("@/assets/images/icons/icon-shrug.png");
const ICON_CHART     = require("@/assets/images/icons/icon-chart.png");
const ICON_NOTEPAD   = require("@/assets/images/icons/icon-notepad.png");
const ICON_CHECK     = require("@/assets/images/icons/icon-check.png");
const ICON_ROBOT     = require("@/assets/images/icons/icon-robot.png");
const ICON_CAMERA    = require("@/assets/images/icons/icon-camera.png");
const ICON_MIC       = require("@/assets/images/icons/icon-microphone.png");
const ICON_ROCKET    = require("@/assets/images/icons/icon-rocket.png");
const ICON_LIGHTNING = require("@/assets/images/icons/icon-lightning.png");

// ─── Dark theme palette ───────────────────────────────────────────────────────
const D = {
  bg:           "#000000",   // pure black
  surface:      "#0D0D0D",   // near-black surface
  card:         "#111111",   // dark card
  cardBorder:   "#1C1C1E",   // subtle border
  neonGreen:    "#39FF14",   // neon green primary
  neonGreenDim: "#1A7A0A",   // dim green for backgrounds
  orange:       "#FF8C00",   // vivid orange accent
  orangeDim:    "#7A3D00",   // dim orange for backgrounds
  text:         "#F5F5F5",   // near-white
  textMuted:    "#6B7280",   // muted grey
  white:        "#FFFFFF",
};

// ─── Option data ──────────────────────────────────────────────────────────────
const ACTIVITY_OPTIONS = [
  { value: "sedentary",   label: "Sedentary",         desc: "Little or no exercise",  icon: ICON_WATER },
  { value: "light",       label: "Lightly Active",    desc: "1–3 days per week",      icon: ICON_RUNNING },
  { value: "moderate",    label: "Moderately Active", desc: "3–5 days per week",      icon: ICON_RUNNING },
  { value: "active",      label: "Very Active",       desc: "6–7 days per week",      icon: ICON_DUMBBELL },
  { value: "very_active", label: "Extra Active",      desc: "Hard exercise daily",    icon: ICON_LIGHTNING },
] as const;

const GOAL_OPTIONS = [
  { value: "lose",     label: "Lose Weight",     icon: ICON_TARGET,   desc: "500 kcal deficit per day" },
  { value: "maintain", label: "Maintain Weight", icon: ICON_BALANCE,  desc: "Stay at current weight" },
  { value: "gain",     label: "Gain Weight",     icon: ICON_DUMBBELL, desc: "300 kcal surplus per day" },
] as const;

const WATER_OPTIONS = [
  { value: "rarely", label: "Rarely drink water",  icon: ICON_DESERT, desc: "Less than 2 glasses a day" },
  { value: "some",   label: "A few glasses",        icon: ICON_WATER,  desc: "Around 2–4 glasses a day" },
  { value: "good",   label: "A decent amount",      icon: ICON_CUP,    desc: "Around 4–6 glasses a day" },
  { value: "plenty", label: "Well hydrated",        icon: ICON_DROPS,  desc: "6 or more glasses a day" },
] as const;

const TRACKING_OPTIONS = [
  { value: "never",     label: "No tracking at all",     icon: ICON_SHRUG,   desc: "Eat by feel, count nothing" },
  { value: "sometimes", label: "Track occasionally",     icon: ICON_NOTEPAD, desc: "Log food when I remember" },
  { value: "often",     label: "Track most of the time", icon: ICON_CHART,   desc: "Log regularly, miss some days" },
  { value: "always",    label: "Track everything",       icon: ICON_CHECK,   desc: "Know exactly what I eat" },
] as const;

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function DarkBg({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {children}
    </View>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 26, fontWeight: "900", color: D.text, letterSpacing: -0.5, marginBottom: 8, lineHeight: 32 }}>
      {children}
    </Text>
  );
}

function GreenCTA({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: D.neonGreen,
        borderRadius: 50,
        paddingVertical: 17,
        paddingHorizontal: 32,
        alignItems: "center",
        opacity: pressed ? 0.85 : 1,
        shadowColor: D.neonGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 8,
      })}
    >
      <Text style={{ fontSize: 17, fontWeight: "900", color: "#000", letterSpacing: 0.3 }}>{label}</Text>
    </Pressable>
  );
}

function BackBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: "transparent",
        borderRadius: 50,
        padding: 16,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: D.cardBorder,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontSize: 15, fontWeight: "700", color: D.textMuted }}>Back</Text>
    </Pressable>
  );
}

function SelectCard({ selected, onPress, iconImg, label, desc }: {
  selected: boolean; onPress: () => void; iconImg: any; label: string; desc: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: selected ? D.neonGreenDim : D.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: selected ? D.neonGreen : D.cardBorder,
        opacity: pressed ? 0.85 : 1,
        shadowColor: selected ? D.neonGreen : "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: selected ? 0.3 : 0,
        shadowRadius: 8,
        elevation: selected ? 4 : 0,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: selected ? D.neonGreenDim : D.surface,
          alignItems: "center", justifyContent: "center",
          borderWidth: 1, borderColor: selected ? D.neonGreen : D.cardBorder,
        }}>
          <Image source={iconImg} style={{ width: 26, height: 26, tintColor: selected ? D.neonGreen : D.textMuted }} resizeMode="contain" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: selected ? D.neonGreen : D.text }}>{label}</Text>
          <Text style={{ fontSize: 13, color: D.textMuted, marginTop: 1 }}>{desc}</Text>
        </View>
      </View>
      {selected && (
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: D.neonGreen, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#000", fontSize: 12, fontWeight: "900" }}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OnboardingScreen() {
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
      <DarkBg>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <View style={{ alignItems: "center", marginTop: 32, marginBottom: 8 }}>
            <Image source={MASCOT_WELCOME} style={{ width: 180, height: 180 }} resizeMode="contain" />
          </View>

          <Text style={{ fontSize: 40, fontWeight: "900", color: D.neonGreen, textAlign: "center", letterSpacing: -1, marginBottom: 4, textShadowColor: D.neonGreen, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 }}>
            Calorly
          </Text>
          <Text style={{ fontSize: 15, color: D.orange, textAlign: "center", marginBottom: 32, fontWeight: "700", letterSpacing: 0.5 }}>
            Track Calories · Gain Energy · Live Happier
          </Text>

          <View style={{ backgroundColor: D.card, borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: D.cardBorder, marginBottom: 28 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
              <Text style={{ fontSize: 17, fontWeight: "800", color: D.text }}>Health Disclaimer</Text>
            </View>
            <Text style={{ fontSize: 14, color: D.textMuted, lineHeight: 22 }}>
              Calorly is for general wellness and informational purposes only. It is{" "}
              <Text style={{ fontWeight: "700", color: D.text }}>not a medical device</Text> and should not be used to diagnose, treat, or prevent any health condition.
            </Text>
            <Text style={{ fontSize: 14, color: D.textMuted, lineHeight: 22, marginTop: 10 }}>
              Consult a healthcare professional before making significant changes to your diet or exercise routine.
            </Text>
          </View>

          <GreenCTA label="I Understand" onPress={() => setShowDisclaimer(false)} />
        </ScrollView>
      </DarkBg>
    );
  }

  const TOTAL_STEPS = 9;

  const navRow = (prevStep: number, onNext: () => void, nextLabel = "Continue") => (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
      <BackBtn onPress={() => setStep(prevStep)} />
      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          flex: 2,
          backgroundColor: D.neonGreen,
          borderRadius: 50,
          padding: 16,
          alignItems: "center",
          opacity: pressed ? 0.85 : 1,
          shadowColor: D.neonGreen,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 6,
        })}
      >
        <Text style={{ fontSize: 15, fontWeight: "900", color: "#000" }}>{nextLabel}</Text>
      </Pressable>
    </View>
  );

  const inputStyle = {
    backgroundColor: D.card,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: D.text,
    borderWidth: 1.5,
    borderColor: D.cardBorder,
    marginBottom: 20,
  };

  const labelStyle = { fontSize: 13, fontWeight: "700" as const, color: D.textMuted, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" as const };

  const steps = [
    // ── Step 0: Personal Info ────────────────────────────────────────────────
    <KeyboardAvoidingView key="step0" behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <DarkBg>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <Image source={MASCOT_WELCOME} style={{ width: 110, height: 110 }} resizeMode="contain" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Image source={ICON_PERSON} style={{ width: 24, height: 24, tintColor: D.neonGreen }} resizeMode="contain" />
            <SectionHeading>About you</SectionHeading>
          </View>
          <Text style={{ fontSize: 14, color: D.textMuted, marginBottom: 28 }}>This sets your calorie and macro targets.</Text>

          <Text style={labelStyle}>Your Name</Text>
          <TextInput value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Enter your name" placeholderTextColor="#444" style={inputStyle} />

          <Text style={labelStyle}>Biological Sex</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            {(["male", "female", "other"] as const).map((g) => (
              <Pressable key={g} onPress={() => setForm((f) => ({ ...f, gender: g }))}
                style={({ pressed }) => ({
                  flex: 1, padding: 12, borderRadius: 14, alignItems: "center",
                  backgroundColor: form.gender === g ? D.neonGreenDim : D.card,
                  borderWidth: 1.5, borderColor: form.gender === g ? D.neonGreen : D.cardBorder,
                  opacity: pressed ? 0.8 : 1,
                })}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: form.gender === g ? D.neonGreen : D.textMuted, textTransform: "capitalize" }}>{g}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={labelStyle}>Age</Text>
          <TextInput value={form.age} onChangeText={(v) => setForm((f) => ({ ...f, age: v }))} keyboardType="numeric" placeholder="25" placeholderTextColor="#444" style={inputStyle} />

          <Text style={labelStyle}>Height (cm)</Text>
          <TextInput value={form.heightCm} onChangeText={(v) => setForm((f) => ({ ...f, heightCm: v }))} keyboardType="numeric" placeholder="170" placeholderTextColor="#444" style={inputStyle} />

          <Text style={labelStyle}>Weight (kg)</Text>
          <TextInput value={form.weightKg} onChangeText={(v) => setForm((f) => ({ ...f, weightKg: v }))} keyboardType="numeric" placeholder="70" placeholderTextColor="#444" style={{ ...inputStyle, marginBottom: 32 }} />

          <GreenCTA label="Continue" onPress={() => {
            const age = parseInt(form.age); const height = parseFloat(form.heightCm); const weight = parseFloat(form.weightKg);
            if (!age || age < 10 || age > 120) { Alert.alert("Invalid Age", "Enter an age between 10 and 120."); return; }
            if (!height || height < 50 || height > 300) { Alert.alert("Invalid Height", "Enter a height between 50 and 300 cm."); return; }
            if (!weight || weight < 10 || weight > 500) { Alert.alert("Invalid Weight", "Enter a weight between 10 and 500 kg."); return; }
            trackOnboardingStepCompleted(1, "personal_info"); setStep(1);
          }} />
        </ScrollView>
      </DarkBg>
    </KeyboardAvoidingView>,

    // ── Step 1: Activity Level ───────────────────────────────────────────────
    <DarkBg key="step1">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_THINKING} style={{ width: 110, height: 110 }} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Image source={ICON_RUNNING} style={{ width: 24, height: 24, tintColor: D.neonGreen }} resizeMode="contain" />
          <SectionHeading>How active are you?</SectionHeading>
        </View>
        <Text style={{ fontSize: 14, color: D.textMuted, marginBottom: 24 }}>Pick the option that fits a typical week.</Text>
        {ACTIVITY_OPTIONS.map((opt) => (
          <SelectCard key={opt.value} selected={form.activityLevel === opt.value} onPress={() => setForm((f) => ({ ...f, activityLevel: opt.value }))} iconImg={opt.icon} label={opt.label} desc={opt.desc} />
        ))}
        {navRow(0, () => { trackOnboardingStepCompleted(2, "activity_level"); setStep(2); })}
      </ScrollView>
    </DarkBg>,

    // ── Step 2: Goal ─────────────────────────────────────────────────────────
    <DarkBg key="step2">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_THINKING} style={{ width: 110, height: 110 }} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Image source={ICON_TARGET} style={{ width: 24, height: 24, tintColor: D.neonGreen }} resizeMode="contain" />
          <SectionHeading>What's your goal?</SectionHeading>
        </View>
        <Text style={{ fontSize: 14, color: D.textMuted, marginBottom: 24 }}>This sets your daily calorie target.</Text>
        {GOAL_OPTIONS.map((opt) => (
          <SelectCard key={opt.value} selected={form.goal === opt.value} onPress={() => setForm((f) => ({ ...f, goal: opt.value }))} iconImg={opt.icon} label={opt.label} desc={opt.desc} />
        ))}
        <View style={{ backgroundColor: D.card, borderRadius: 20, padding: 20, marginTop: 16, borderWidth: 1.5, borderColor: D.neonGreen + "40" }}>
          <Text style={{ fontSize: 12, color: D.textMuted, marginBottom: 4, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>Your Daily Target</Text>
          <Text style={{ fontSize: 40, fontWeight: "900", color: D.neonGreen, letterSpacing: -1, textShadowColor: D.neonGreen, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>
            {calculateCalorieGoal({ age: parseInt(form.age), gender: form.gender, heightCm: parseFloat(form.heightCm), weightKg: parseFloat(form.weightKg), activityLevel: form.activityLevel, goal: form.goal })}{" "}
            <Text style={{ fontSize: 18, fontWeight: "600", color: D.textMuted }}>kcal/day</Text>
          </Text>
        </View>
        {navRow(1, () => { trackOnboardingStepCompleted(3, "goal"); setStep(3); })}
      </ScrollView>
    </DarkBg>,

    // ── Step 3: Water Habits ─────────────────────────────────────────────────
    <DarkBg key="step3">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_THINKING} style={{ width: 110, height: 110 }} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Image source={ICON_WATER} style={{ width: 24, height: 24, tintColor: D.neonGreen }} resizeMode="contain" />
          <SectionHeading>Your water habits</SectionHeading>
        </View>
        <Text style={{ fontSize: 14, color: D.textMuted, marginBottom: 24 }}>Sets your personalised hydration goal.</Text>
        {WATER_OPTIONS.map((opt) => (
          <SelectCard key={opt.value} selected={form.waterHabits === opt.value} onPress={() => setForm((f) => ({ ...f, waterHabits: opt.value }))} iconImg={opt.icon} label={opt.label} desc={opt.desc} />
        ))}
        {navRow(2, () => { trackOnboardingStepCompleted(4, "water_habits"); setStep(4); })}
      </ScrollView>
    </DarkBg>,

    // ── Step 4: What drives weight change? ───────────────────────────────────
    <DarkBg key="step4">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_THINKING} style={{ width: 110, height: 110 }} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Image source={ICON_THINKING} style={{ width: 24, height: 24, tintColor: D.neonGreen }} resizeMode="contain" />
          <SectionHeading>Quick question</SectionHeading>
        </View>
        <Text style={{ fontSize: 14, color: D.textMuted, marginBottom: 24 }}>In your experience, what has the biggest impact on your weight?</Text>
        {([
          { value: "exercise", label: "Exercise",          iconImg: ICON_DUMBBELL, desc: "Working out and staying active" },
          { value: "diet",     label: "What I eat",        iconImg: ICON_SALAD,    desc: "The food and calories I consume" },
          { value: "both",     label: "Both equally",      iconImg: ICON_BALANCE,  desc: "Diet and exercise matter the same" },
          { value: "unsure",   label: "Honestly not sure", iconImg: ICON_SHRUG,    desc: "Still figuring it out" },
        ] as const).map((opt) => (
          <SelectCard key={opt.value} selected={form.weightDriverGuess === opt.value} onPress={() => setForm((f) => ({ ...f, weightDriverGuess: opt.value }))} iconImg={opt.iconImg} label={opt.label} desc={opt.desc} />
        ))}
        {navRow(3, () => {
          if (!form.weightDriverGuess) { Alert.alert("Pick an option", "Select one before continuing."); return; }
          trackOnboardingStepCompleted(5, "weight_driver_guess"); setStep(5);
        })}
      </ScrollView>
    </DarkBg>,

    // ── Step 5: 80/20 Reveal ─────────────────────────────────────────────────
    <View key="step5" style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Image source={MASCOT_LIGHTBULB} style={{ width: 150, height: 150 }} resizeMode="contain" />
        </View>
        <Text style={{ fontSize: 80, fontWeight: "900", color: D.neonGreen, textAlign: "center", letterSpacing: -3, marginBottom: 4, textShadowColor: D.neonGreen, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 }}>
          80%
        </Text>
        <Text style={{ fontSize: 22, fontWeight: "800", color: D.text, textAlign: "center", marginBottom: 16 }}>
          of your results come from nutrition
        </Text>
        <Text style={{ fontSize: 15, color: D.textMuted, textAlign: "center", lineHeight: 24, marginBottom: 28 }}>
          Exercise matters. But what you eat is the single biggest lever for changing your weight. Tracking food, even roughly, produces results that exercise alone rarely does.
        </Text>

        <View style={{ backgroundColor: D.card, borderRadius: 20, padding: 20, marginBottom: 28, borderWidth: 1.5, borderColor: D.cardBorder }}>
          {[{ label: "Nutrition", pct: 80, color: D.neonGreen }, { label: "Exercise", pct: 20, color: D.orange }].map((item) => (
            <View key={item.label} style={{ marginBottom: item.label === "Nutrition" ? 16 : 0 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: D.text }}>{item.label}</Text>
                <Text style={{ fontSize: 14, fontWeight: "700", color: item.color }}>{item.pct}%</Text>
              </View>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: D.surface, overflow: "hidden" }}>
                <View style={{ width: `${item.pct}%` as any, height: "100%", backgroundColor: item.color, borderRadius: 5, shadowColor: item.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6 }} />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => { trackOnboardingStepCompleted(6, "nutrition_reveal"); setStep(6); }}
          style={({ pressed }) => ({
            backgroundColor: D.neonGreen, borderRadius: 50, padding: 18, alignItems: "center",
            opacity: pressed ? 0.85 : 1, shadowColor: D.neonGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: "900", color: "#000" }}>Got it. Continue.</Text>
        </Pressable>
      </ScrollView>
    </View>,

    // ── Step 6: Tracking Awareness ───────────────────────────────────────────
    <DarkBg key="step6">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_THINKING} style={{ width: 110, height: 110 }} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Image source={ICON_CHART} style={{ width: 24, height: 24, tintColor: D.neonGreen }} resizeMode="contain" />
          <SectionHeading>Your tracking habits</SectionHeading>
        </View>
        <Text style={{ fontSize: 14, color: D.textMuted, marginBottom: 24 }}>Be accurate. This tailors how Calorly works for you.</Text>
        {TRACKING_OPTIONS.map((opt) => (
          <SelectCard key={opt.value} selected={form.trackingHabit === opt.value} onPress={() => setForm((f) => ({ ...f, trackingHabit: opt.value }))} iconImg={opt.icon} label={opt.label} desc={opt.desc} />
        ))}
        {navRow(5, () => { trackOnboardingStepCompleted(7, "tracking_habit"); setStep(7); })}
      </ScrollView>
    </DarkBg>,

    // ── Step 7: AI Introduction ──────────────────────────────────────────────
    <DarkBg key="step7">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_TECH} style={{ width: 120, height: 120 }} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Image source={ICON_ROBOT} style={{ width: 24, height: 24, tintColor: D.neonGreen }} resizeMode="contain" />
          <SectionHeading>Your AI nutrition coach</SectionHeading>
        </View>
        <Text style={{ fontSize: 14, color: D.textMuted, marginBottom: 24, lineHeight: 22 }}>
          Calorly uses computer vision and natural language AI to make logging fast.
        </Text>

        {[
          { iconImg: ICON_CAMERA, title: "Snap your meal", sub: "Image recognition. Instant log.", body: "Point your camera at any plate. Calorly identifies the food and estimates calories and macros in seconds." },
          { iconImg: ICON_MIC,    title: "Say it out loud", sub: "Voice input. Hands-free logging.", body: 'Say "two scrambled eggs and a coffee with oat milk" and Calorly logs it. No typing, no searching.' },
        ].map((card) => (
          <View key={card.title} style={{ backgroundColor: D.card, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1.5, borderColor: D.cardBorder }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: D.neonGreenDim, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: D.neonGreen + "60" }}>
                <Image source={card.iconImg} style={{ width: 28, height: 28, tintColor: D.neonGreen }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: D.text }}>{card.title}</Text>
                <Text style={{ fontSize: 12, color: D.orange, fontWeight: "600" }}>{card.sub}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, color: D.textMuted, lineHeight: 21 }}>{card.body}</Text>
          </View>
        ))}

        {navRow(6, () => { trackOnboardingStepCompleted(8, "ai_intro"); setStep(8); })}
      </ScrollView>
    </DarkBg>,

    // ── Step 8: Traditional vs AI ────────────────────────────────────────────
    <DarkBg key="step8">
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image source={MASCOT_VICTORY} style={{ width: 120, height: 120 }} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Image source={ICON_ROCKET} style={{ width: 24, height: 24, tintColor: D.neonGreen }} resizeMode="contain" />
          <SectionHeading>A smarter way to track</SectionHeading>
        </View>
        <Text style={{ fontSize: 14, color: D.textMuted, marginBottom: 24, lineHeight: 22 }}>How Calorly compares to the old way of logging food.</Text>

        <View style={{ borderRadius: 20, overflow: "hidden", borderWidth: 1.5, borderColor: D.cardBorder, marginBottom: 24, backgroundColor: D.card }}>
          <View style={{ flexDirection: "row", backgroundColor: D.surface, borderBottomWidth: 1, borderBottomColor: D.cardBorder }}>
            <View style={{ flex: 1, padding: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: D.textMuted, textAlign: "center", letterSpacing: 0.5 }}>TRADITIONAL</Text>
            </View>
            <View style={{ width: 1, backgroundColor: D.cardBorder }} />
            <View style={{ flex: 1, padding: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: D.neonGreen, textAlign: "center", letterSpacing: 0.5 }}>CALORLY AI</Text>
            </View>
          </View>
          {[
            { t: "Search food manually",        a: "Snap a photo or speak" },
            { t: "Estimate portions yourself",  a: "AI estimates for you" },
            { t: "Tedious, easy to quit",        a: "Seconds per meal" },
            { t: "Generic database results",    a: "Learns your habits" },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: "row", borderTopWidth: i === 0 ? 0 : 1, borderTopColor: D.cardBorder }}>
              <View style={{ flex: 1, padding: 14 }}>
                <Text style={{ fontSize: 13, color: D.textMuted, textAlign: "center" }}>✗  {row.t}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: D.cardBorder }} />
              <View style={{ flex: 1, padding: 14 }}>
                <Text style={{ fontSize: 13, color: D.neonGreen, fontWeight: "700", textAlign: "center" }}>✓  {row.a}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <BackBtn onPress={() => setStep(7)} />
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => ({
              flex: 2, backgroundColor: D.neonGreen, borderRadius: 50, padding: 16, alignItems: "center",
              opacity: pressed ? 0.85 : 1, shadowColor: D.neonGreen, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
            })}
          >
            <Text style={{ fontSize: 15, fontWeight: "900", color: "#000" }}>Start Tracking</Text>
          </Pressable>
        </View>
      </ScrollView>
    </DarkBg>,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Progress bar */}
      <View style={{ flexDirection: "row", gap: 4, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 8, position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            backgroundColor: i <= step ? D.neonGreen : D.cardBorder,
            shadowColor: i <= step ? D.neonGreen : "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: i <= step ? 0.8 : 0,
            shadowRadius: 4,
          }} />
        ))}
      </View>
      <View style={{ flex: 1, paddingTop: 72 }}>
        {steps[step]}
      </View>
    </View>
  );
}
