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
} from "react-native";
import { useRouter } from "expo-router";

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

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
  { value: "light", label: "Lightly Active", desc: "1-3 days/week" },
  { value: "moderate", label: "Moderately Active", desc: "3-5 days/week" },
  { value: "active", label: "Very Active", desc: "6-7 days/week" },
  { value: "very_active", label: "Extra Active", desc: "Hard exercise daily" },
] as const;

const GOAL_OPTIONS = [
  { value: "lose", label: "Lose Weight", icon: "⬇️", desc: "500 kcal deficit/day" },
  { value: "maintain", label: "Maintain Weight", icon: "⚖️", desc: "Stay at current weight" },
  { value: "gain", label: "Gain Weight", icon: "⬆️", desc: "300 kcal surplus/day" },
] as const;

// ─── Change 1: Combined water habits options ──────────────────────────────────
const WATER_OPTIONS = [
  { value: "rarely", label: "I rarely drink water", icon: "🏜️", desc: "Less than 2 glasses a day" },
  { value: "some", label: "I drink some water", icon: "💧", desc: "Around 2–4 glasses a day" },
  { value: "good", label: "I drink a decent amount", icon: "🥤", desc: "Around 4–6 glasses a day" },
  { value: "plenty", label: "I stay well hydrated", icon: "💦", desc: "6+ glasses a day" },
] as const;

// ─── Change 3: Tracking-awareness options ────────────────────────────────────
const TRACKING_OPTIONS = [
  {
    value: "never",
    label: "I don't track at all",
    icon: "🤷",
    desc: "I eat by feel and don't count anything",
  },
  {
    value: "sometimes",
    label: "I track occasionally",
    icon: "📝",
    desc: "I log food when I remember, but not consistently",
  },
  {
    value: "often",
    label: "I track most of the time",
    icon: "📊",
    desc: "I log regularly but sometimes miss days",
  },
  {
    value: "always",
    label: "I track everything",
    icon: "✅",
    desc: "I know exactly what I eat and how much",
  },
] as const;

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const startedRef = useRef(false);

  // Fire onboarding_started once when the first real step becomes visible
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
    // Change 1: single water habits field
    waterHabits: "some" as "rarely" | "some" | "good" | "plenty",
    // Change 2: setup question answer (primes the 80/20 reveal)
    weightDriverGuess: "" as "" | "exercise" | "diet" | "both" | "unsure",
    // Change 3: combined tracking awareness
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
    // Map water habits to a cup goal
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

  // ─── Health Disclaimer ───────────────────────────────────────────────────
  if (showDisclaimer) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                backgroundColor: colors.warning + "20",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.warning,
                marginBottom: 24,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.warning} />
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
                  Health Disclaimer
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
                Calorly is designed for general wellness and informational purposes only. It is{" "}
                <Text style={{ fontWeight: "700" }}>not a medical device</Text> and should not be used
                to diagnose, treat, cure, or prevent any disease or health condition.
              </Text>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22, marginTop: 10 }}>
                Always consult a qualified healthcare professional before making significant changes to
                your diet or exercise routine. The calorie and nutrition information provided is for
                general reference only and may not be accurate for all individuals.
              </Text>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22, marginTop: 10 }}>
                If you have an eating disorder or history of disordered eating, please consult a
                healthcare professional before using this app.
              </Text>
            </View>

            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
              Welcome to Calorly 🥗
            </Text>
            <Text style={{ fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 32 }}>
              Track your nutrition, reach your goals, and build healthy habits — all in one place.
            </Text>

            <Pressable
              onPress={() => setShowDisclaimer(false)}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                borderRadius: 14,
                padding: 16,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                I Understand — Get Started
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Total steps: 0–8 (9 steps) ─────────────────────────────────────────
  // 0: Personal Info
  // 1: Activity Level
  // 2: Goal
  // 3: Water Habits (Change 1 — merged)
  // 4: What drives weight change? (Change 2 — new setup question)
  // 5: 80/20 Reveal (nutrition insight)
  // 6: Tracking Awareness (Change 3 — merged)
  // 7: AI Introduction (Change 4 — combined AI features + input methods)
  // 8: Traditional vs AI Tracker (Change 4 — comparison)
  const TOTAL_STEPS = 9;

  const navButtons = (prevStep: number, nextStep: number, onNext: () => void, nextLabel = "Continue →") => (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
      <Pressable
        onPress={() => setStep(prevStep)}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 16,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>← Back</Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          flex: 2,
          backgroundColor: colors.primary,
          borderRadius: 14,
          padding: 16,
          alignItems: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{nextLabel}</Text>
      </Pressable>
    </View>
  );

  const steps = [
    // ── Step 0: Personal Info ──────────────────────────────────────────────
    <KeyboardAvoidingView
      key="step0"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
          About You 👤
        </Text>
        <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 28 }}>
          This helps us calculate your personalized calorie goals.
        </Text>

        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
          Your Name
        </Text>
        <TextInput
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Enter your name"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 20,
          }}
        />

        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
          Biological Sex
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {(["male", "female", "other"] as const).map((g) => (
            <Pressable
              key={g}
              onPress={() => setForm((f) => ({ ...f, gender: g }))}
              style={({ pressed }) => ({
                flex: 1,
                padding: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: form.gender === g ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: form.gender === g ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: form.gender === g ? "#fff" : colors.foreground,
                  textTransform: "capitalize",
                }}
              >
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
          Age
        </Text>
        <TextInput
          value={form.age}
          onChangeText={(v) => setForm((f) => ({ ...f, age: v }))}
          keyboardType="numeric"
          placeholder="25"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 20,
          }}
        />

        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
          Height (cm)
        </Text>
        <TextInput
          value={form.heightCm}
          onChangeText={(v) => setForm((f) => ({ ...f, heightCm: v }))}
          keyboardType="numeric"
          placeholder="170"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 20,
          }}
        />

        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
          Weight (kg)
        </Text>
        <TextInput
          value={form.weightKg}
          onChangeText={(v) => setForm((f) => ({ ...f, weightKg: v }))}
          keyboardType="numeric"
          placeholder="70"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 32,
          }}
        />

        <Pressable
          onPress={() => {
            const age = parseInt(form.age);
            const height = parseFloat(form.heightCm);
            const weight = parseFloat(form.weightKg);
            if (!age || age < 10 || age > 120) {
              Alert.alert("Invalid Age", "Please enter a valid age between 10 and 120.");
              return;
            }
            if (!height || height < 50 || height > 300) {
              Alert.alert("Invalid Height", "Please enter a valid height between 50 and 300 cm.");
              return;
            }
            if (!weight || weight < 10 || weight > 500) {
              Alert.alert("Invalid Weight", "Please enter a valid weight between 10 and 500 kg.");
              return;
            }
            trackOnboardingStepCompleted(1, "personal_info");
            setStep(1);
          }}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Continue →</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>,

    // ── Step 1: Activity Level ─────────────────────────────────────────────
    <ScrollView key="step1" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
        Activity Level 🏃
      </Text>
      <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 28 }}>
        How active are you on a typical week?
      </Text>

      {ACTIVITY_OPTIONS.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => setForm((f) => ({ ...f, activityLevel: opt.value }))}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: form.activityLevel === opt.value ? colors.primary + "15" : colors.surface,
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            borderWidth: 2,
            borderColor: form.activityLevel === opt.value ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{opt.label}</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>{opt.desc}</Text>
          </View>
          {form.activityLevel === opt.value && (
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          )}
        </Pressable>
      ))}

      {navButtons(0, 2, () => {
        trackOnboardingStepCompleted(2, "activity_level");
        setStep(2);
      })}
    </ScrollView>,

    // ── Step 2: Goal ──────────────────────────────────────────────────────
    <ScrollView key="step2" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
        Your Goal 🎯
      </Text>
      <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 28 }}>
        What do you want to achieve?
      </Text>

      {GOAL_OPTIONS.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => setForm((f) => ({ ...f, goal: opt.value }))}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: form.goal === opt.value ? colors.primary + "15" : colors.surface,
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            borderWidth: 2,
            borderColor: form.goal === opt.value ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 28 }}>{opt.icon}</Text>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{opt.label}</Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>{opt.desc}</Text>
            </View>
          </View>
          {form.goal === opt.value && (
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          )}
        </Pressable>
      ))}

      <View
        style={{
          backgroundColor: colors.primary + "15",
          borderRadius: 14,
          padding: 16,
          marginTop: 16,
          borderWidth: 1,
          borderColor: colors.primary + "40",
        }}
      >
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>Your daily calorie goal</Text>
        <Text style={{ fontSize: 32, fontWeight: "800", color: colors.primary }}>
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
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
          Based on your profile using the Mifflin-St Jeor equation
        </Text>
      </View>

      {navButtons(1, 3, () => {
        trackOnboardingStepCompleted(3, "goal");
        setStep(3);
      })}
    </ScrollView>,

    // ── Step 3: Water Habits (Change 1 — merged) ──────────────────────────
    <ScrollView key="step3" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
        Your Water Habits 💧
      </Text>
      <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 8 }}>
        How much water do you typically drink each day?
      </Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 24, fontStyle: "italic" }}>
        We'll set a personalised hydration goal based on your answer.
      </Text>

      {WATER_OPTIONS.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => setForm((f) => ({ ...f, waterHabits: opt.value }))}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: form.waterHabits === opt.value ? colors.primary + "15" : colors.surface,
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            borderWidth: 2,
            borderColor: form.waterHabits === opt.value ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 26 }}>{opt.icon}</Text>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{opt.label}</Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>{opt.desc}</Text>
            </View>
          </View>
          {form.waterHabits === opt.value && (
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          )}
        </Pressable>
      ))}

      {navButtons(2, 4, () => {
        trackOnboardingStepCompleted(4, "water_habits");
        setStep(4);
      })}
    </ScrollView>,

    // ── Step 4: What drives weight change? (Change 2 — new setup question) ─
    // Reasoning: instead of asking "do you know the calorie-weight relationship?"
    // (which is a knowledge quiz), we ask users to pick what they think drives
    // weight change. This creates curiosity and personal investment — when the
    // 80/20 reveal lands on the next screen, it feels like an answer to *their*
    // guess rather than a generic fact.
    <ScrollView key="step4" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
        Quick question 🤔
      </Text>
      <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 28 }}>
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
        <Pressable
          key={opt.value}
          onPress={() => setForm((f) => ({ ...f, weightDriverGuess: opt.value }))}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: form.weightDriverGuess === opt.value ? colors.primary + "15" : colors.surface,
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            borderWidth: 2,
            borderColor: form.weightDriverGuess === opt.value ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 26 }}>{opt.icon}</Text>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{opt.label}</Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>{opt.desc}</Text>
            </View>
          </View>
          {form.weightDriverGuess === opt.value && (
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          )}
        </Pressable>
      ))}

      {navButtons(3, 5, () => {
        if (!form.weightDriverGuess) {
          Alert.alert("Pick an option", "Let us know what you think before continuing.");
          return;
        }
        trackOnboardingStepCompleted(5, "weight_driver_guess");
        setStep(5);
      })}
    </ScrollView>,

    // ── Step 5: 80/20 Nutrition Reveal ────────────────────────────────────
    <ScrollView key="step5" contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: "center" }}>
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 52 }}>🥗</Text>
        </View>
        <Text
          style={{
            fontSize: 56,
            fontWeight: "900",
            color: colors.primary,
            letterSpacing: -2,
            marginBottom: 4,
          }}
        >
          80%
        </Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, textAlign: "center", marginBottom: 16 }}>
          of your results come from nutrition
        </Text>
        <Text style={{ fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 24, marginBottom: 24 }}>
          Exercise matters — but what you eat is the single biggest lever for changing your weight.
          That's why tracking your food, even roughly, produces results that exercise alone rarely does.
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            width: "100%",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>Nutrition</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>80%</Text>
          </View>
          <View
            style={{
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.border,
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <View style={{ width: "80%", height: "100%", backgroundColor: colors.primary, borderRadius: 5 }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>Exercise</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.muted }}>20%</Text>
          </View>
          <View
            style={{
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.border,
              overflow: "hidden",
            }}
          >
            <View style={{ width: "20%", height: "100%", backgroundColor: colors.muted, borderRadius: 5 }} />
          </View>
        </View>
      </View>

      {navButtons(4, 6, () => {
        trackOnboardingStepCompleted(6, "nutrition_reveal");
        setStep(6);
      }, "Got it — continue →")}
    </ScrollView>,

    // ── Step 6: Tracking Awareness (Change 3 — merged) ────────────────────
    <ScrollView key="step6" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
        Your Tracking Habits 📊
      </Text>
      <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 8 }}>
        How closely do you currently pay attention to what you eat?
      </Text>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 24, fontStyle: "italic" }}>
        Be honest — there's no wrong answer. This helps us tailor your experience.
      </Text>

      {TRACKING_OPTIONS.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => setForm((f) => ({ ...f, trackingHabit: opt.value }))}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: form.trackingHabit === opt.value ? colors.primary + "15" : colors.surface,
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            borderWidth: 2,
            borderColor: form.trackingHabit === opt.value ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 26 }}>{opt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{opt.label}</Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>{opt.desc}</Text>
            </View>
          </View>
          {form.trackingHabit === opt.value && (
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          )}
        </Pressable>
      ))}

      {navButtons(5, 7, () => {
        trackOnboardingStepCompleted(7, "tracking_habit");
        setStep(7);
      })}
    </ScrollView>,

    // ── Step 7: AI Introduction (Change 4 — combined AI features + input methods) ─
    <ScrollView key="step7" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
        Meet your AI nutrition coach 🤖
      </Text>
      <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 28, lineHeight: 22 }}>
        Calorly uses computer vision and natural language AI to make tracking effortless — no more
        manual searches or guessing portion sizes.
      </Text>

      {/* AI Feature Cards */}
      <View style={{ gap: 14, marginBottom: 24 }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <Text style={{ fontSize: 32 }}>📸</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>
                Snap your meal
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>Image recognition · instant log</Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 21 }}>
            Point your camera at any plate and Calorly's image recognition model identifies the food
            and estimates calories and macros in seconds.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <Text style={{ fontSize: 32 }}>🎙️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>
                Just say it out loud
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>Voice input · hands-free logging</Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 21 }}>
            Say "two scrambled eggs and a coffee with oat milk" and Calorly logs it instantly — no
            typing, no searching, no friction.
          </Text>
        </View>
      </View>

      {/* How it works under the hood */}
      <View
        style={{
          backgroundColor: colors.primary + "10",
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.primary + "30",
          marginBottom: 8,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 6 }}>
          HOW IT WORKS
        </Text>
        <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
          Machine learning models trained on millions of food images and descriptions power every
          recognition. The more you use Calorly, the more accurate your personal log becomes.
        </Text>
      </View>

      {navButtons(6, 8, () => {
        trackOnboardingStepCompleted(8, "ai_intro");
        setStep(8);
      })}
    </ScrollView>,

    // ── Step 8: Traditional vs AI Tracker (Change 4 — comparison) ─────────
    <ScrollView key="step8" contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
        A smarter way to track 🚀
      </Text>
      <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 24, lineHeight: 22 }}>
        See how Calorly compares to the old way of logging food.
      </Text>

      {/* Comparison Table */}
      <View
        style={{
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 24,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flex: 1, padding: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, textAlign: "center" }}>
              TRADITIONAL TRACKER
            </Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: colors.border,
            }}
          />
          <View style={{ flex: 1, padding: 14, backgroundColor: colors.primary + "10" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, textAlign: "center" }}>
              CALORLY AI
            </Text>
          </View>
        </View>

        {/* Rows */}
        {[
          { traditional: "Search food manually", ai: "Snap a photo or speak" },
          { traditional: "Estimate portions yourself", ai: "AI estimates for you" },
          { traditional: "Tedious, easy to give up", ai: "Seconds per meal" },
          { traditional: "Generic database results", ai: "Learns your habits over time" },
          { traditional: "No coaching or context", ai: "Personalised daily insights" },
        ].map((row, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flex: 1, padding: 14 }}>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
                ❌ {row.traditional}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ flex: 1, padding: 14, backgroundColor: colors.primary + "08" }}>
              <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600", textAlign: "center" }}>
                ✅ {row.ai}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          onPress={() => setStep(7)}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>← Back</Text>
        </Pressable>
        <Pressable
          onPress={handleComplete}
          style={({ pressed }) => ({
            flex: 2,
            backgroundColor: colors.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Start Tracking! 🚀</Text>
        </Pressable>
      </View>
    </ScrollView>,
  ];

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Progress Indicator */}
      <View style={{ flexDirection: "row", gap: 4, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i <= step ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
      {steps[step]}
    </ScreenContainer>
  );
}
