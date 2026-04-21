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
      waterGoal: 8,
      unitSystem: "metric",
      onboardingComplete: true,
      hasSeenDisclaimer: true,
    };
    await saveProfile(profile);
    await trackOnboardingCompleted();
    // Go directly to paywall — ATT will be shown AFTER the paywall
    router.replace("/paywall?source=onboarding_complete");
  };

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

  const steps = [
    // Step 0: Personal Info
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

        {/* Name */}
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

        {/* Gender */}
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

        {/* Age */}
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

        {/* Height */}
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

        {/* Weight */}
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

    // Step 1: Activity Level
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

      <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
        <Pressable
          onPress={() => setStep(0)}
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
          onPress={() => {
            trackOnboardingStepCompleted(2, "activity_level");
            setStep(2);
          }}
          style={({ pressed }) => ({
            flex: 2,
            backgroundColor: colors.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Continue →</Text>
        </Pressable>
      </View>
    </ScrollView>,

    // Step 2: Goal
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

      {/* Calorie Preview */}
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

      <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
        <Pressable
          onPress={() => setStep(1)}
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
      <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
        {[0, 1, 2].map((i) => (
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
