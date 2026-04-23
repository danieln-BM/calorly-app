import React, { useState, useRef, useEffect } from "react";
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

// ─── Country Estate Palette ───────────────────────────────────────────────────
const C = {
  bg:          "#F4F1ED",   // Warm Linen
  surface:     "#EFECE7",   // slightly deeper linen for cards
  card:        "#EAE6E0",   // card background
  border:      "#D9D4CC",   // subtle warm border
  forest:      "#004225",   // True British Racing Green — headlines, CTA fill
  cognac:      "#A67C52",   // Polished Cognac — selected state, accent
  cognacLight: "#F0E6D8",   // cognac tint for selected card bg
  brass:       "#D4AF37",   // Muted Brass — premium moments only
  text:        "#2D3A3A",   // deep forest for body text
  textMuted:   "#7A7468",   // warm grey
  white:       "#FFFFFF",
};

// ─── Option data ──────────────────────────────────────────────────────────────
const ACTIVITY_OPTIONS = [
  { value: "sedentary",   label: "Sedentary",          desc: "Little or no exercise" },
  { value: "light",       label: "Lightly Active",     desc: "1–3 days per week" },
  { value: "moderate",    label: "Moderately Active",  desc: "3–5 days per week" },
  { value: "active",      label: "Very Active",        desc: "6–7 days per week" },
  { value: "very_active", label: "Extra Active",       desc: "Hard exercise daily" },
] as const;

const GOAL_OPTIONS = [
  { value: "lose",     label: "Lose Weight",     desc: "500 kcal deficit per day" },
  { value: "maintain", label: "Maintain Weight", desc: "Stay at current weight" },
  { value: "gain",     label: "Gain Weight",     desc: "300 kcal surplus per day" },
] as const;

const WATER_OPTIONS = [
  { value: "rarely", label: "Rarely drink water", desc: "Less than 2 glasses a day" },
  { value: "some",   label: "A few glasses",       desc: "Around 2–4 glasses a day" },
  { value: "good",   label: "A decent amount",     desc: "Around 4–6 glasses a day" },
  { value: "plenty", label: "Well hydrated",       desc: "6 or more glasses a day" },
] as const;

const TRACKING_OPTIONS = [
  { value: "never",     label: "No tracking at all",     desc: "Eat by feel, count nothing" },
  { value: "sometimes", label: "Track occasionally",     desc: "Log food when I remember" },
  { value: "often",     label: "Track most of the time", desc: "Log regularly, miss some days" },
  { value: "always",    label: "Track everything",       desc: "Know exactly what I eat" },
] as const;

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, paddingBottom: 32 }}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 34, fontWeight: "800", color: C.forest, letterSpacing: -0.8, lineHeight: 40, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function SubText({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 16, color: C.textMuted, lineHeight: 24, marginBottom: 28 }}>
      {children}
    </Text>
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
      })}
    >
      <Text style={{ fontSize: 17, fontWeight: "700", color: C.bg, letterSpacing: 0.2 }}>{label}</Text>
    </Pressable>
  );
}

function SecondaryBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 50,
        paddingVertical: 18,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: C.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontSize: 17, fontWeight: "600", color: C.textMuted }}>{label}</Text>
    </Pressable>
  );
}

function NavRow({ onBack, onNext, nextLabel = "Continue" }: { onBack: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <View style={{ gap: 10, marginTop: 24 }}>
      <PrimaryCTA label={nextLabel} onPress={onNext} />
      <SecondaryBtn label="Back" onPress={onBack} />
    </View>
  );
}

function SelectCard({ selected, onPress, label, desc }: {
  selected: boolean; onPress: () => void; label: string; desc: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: selected ? C.cognacLight : C.surface,
        borderRadius: 16,
        padding: 18,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: selected ? C.cognac : C.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: selected ? C.cognac : C.forest, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: C.textMuted }}>{desc}</Text>
      </View>
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: selected ? C.cognac : "transparent",
        borderWidth: selected ? 0 : 1.5,
        borderColor: C.border,
        alignItems: "center", justifyContent: "center",
      }}>
        {selected && <Text style={{ color: C.white, fontSize: 12, fontWeight: "900" }}>✓</Text>}
      </View>
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
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Hero image */}
          <View style={{ marginHorizontal: -24, marginTop: -0, marginBottom: 32, height: 260, overflow: "hidden" }}>
            <Image
              source={require("@/assets/images/food/fitness-woman.webp")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {/* Linen gradient overlay at bottom */}
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, backgroundColor: C.bg, opacity: 0.6 }} />
          </View>

          {/* Wordmark */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontSize: 42, fontWeight: "800", color: C.forest, letterSpacing: -1.5 }}>Calorly</Text>
            <Text style={{ fontSize: 14, color: C.cognac, marginTop: 6, letterSpacing: 2, textTransform: "uppercase", fontWeight: "600" }}>
              Your Nutrition Companion
            </Text>
            {/* Thin brass accent line */}
            <View style={{ width: 40, height: 2, backgroundColor: C.brass, borderRadius: 1, marginTop: 16 }} />
          </View>

          <Headline>A note before{"\n"}we begin.</Headline>
          <SubText>
            Calorly is designed for general wellness and informational purposes only. It is not a medical device and should not replace professional healthcare advice.
          </SubText>

          <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: C.border, marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: C.textMuted, lineHeight: 22 }}>
              Consult a qualified healthcare professional before making significant changes to your diet or exercise routine, especially if you have an existing health condition.
            </Text>
          </View>

          <PrimaryCTA label="I Understand — Continue" onPress={() => setShowDisclaimer(false)} />
        </ScrollView>
      </View>
    );
  }

  const TOTAL_STEPS = 9;

  const inputStyle = {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: C.forest,
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 18,
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: "700" as const,
    color: C.textMuted,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  };

  const steps = [
    // ── Step 0: Personal Info ────────────────────────────────────────────────
    <KeyboardAvoidingView key="step0" behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen>
        <Headline>Tell us about{"\n"}yourself.</Headline>
        <SubText>This sets your calorie and macro targets.</SubText>

        <Text style={labelStyle}>Your Name</Text>
        <TextInput
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Enter your name"
          placeholderTextColor={C.textMuted}
          style={inputStyle}
        />

        <Text style={labelStyle}>Biological Sex</Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
          {(["male", "female", "other"] as const).map((g) => (
            <Pressable
              key={g}
              onPress={() => setForm((f) => ({ ...f, gender: g }))}
              style={({ pressed }) => ({
                flex: 1, padding: 14, borderRadius: 12, alignItems: "center",
                backgroundColor: form.gender === g ? C.cognacLight : C.surface,
                borderWidth: 1.5, borderColor: form.gender === g ? C.cognac : C.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: form.gender === g ? C.cognac : C.textMuted, textTransform: "capitalize" }}>{g}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={labelStyle}>Age</Text>
        <TextInput value={form.age} onChangeText={(v) => setForm((f) => ({ ...f, age: v }))} keyboardType="numeric" placeholder="25" placeholderTextColor={C.textMuted} style={inputStyle} />

        <Text style={labelStyle}>Height (cm)</Text>
        <TextInput value={form.heightCm} onChangeText={(v) => setForm((f) => ({ ...f, heightCm: v }))} keyboardType="numeric" placeholder="170" placeholderTextColor={C.textMuted} style={inputStyle} />

        <Text style={labelStyle}>Weight (kg)</Text>
        <TextInput value={form.weightKg} onChangeText={(v) => setForm((f) => ({ ...f, weightKg: v }))} keyboardType="numeric" placeholder="70" placeholderTextColor={C.textMuted} style={{ ...inputStyle, marginBottom: 32 }} />

        <PrimaryCTA label="Continue" onPress={() => {
          const age = parseInt(form.age);
          const height = parseFloat(form.heightCm);
          const weight = parseFloat(form.weightKg);
          if (!age || age < 10 || age > 120) { Alert.alert("Invalid Age", "Enter an age between 10 and 120."); return; }
          if (!height || height < 50 || height > 300) { Alert.alert("Invalid Height", "Enter a height between 50 and 300 cm."); return; }
          if (!weight || weight < 10 || weight > 500) { Alert.alert("Invalid Weight", "Enter a weight between 10 and 500 kg."); return; }
          trackOnboardingStepCompleted(1, "personal_info");
          setStep(1);
        }} />
      </Screen>
    </KeyboardAvoidingView>,

    // ── Step 1: Activity Level ───────────────────────────────────────────────
    <Screen key="step1">
      <Headline>How active are{"\n"}you?</Headline>
      <SubText>Pick the option that fits a typical week.</SubText>
      {ACTIVITY_OPTIONS.map((opt) => (
        <SelectCard key={opt.value} selected={form.activityLevel === opt.value} onPress={() => setForm((f) => ({ ...f, activityLevel: opt.value }))} label={opt.label} desc={opt.desc} />
      ))}
      <NavRow onBack={() => setStep(0)} onNext={() => { trackOnboardingStepCompleted(2, "activity_level"); setStep(2); }} />
    </Screen>,

    // ── Step 2: Goal ─────────────────────────────────────────────────────────
    <Screen key="step2">
      <Headline>What's your{"\n"}goal?</Headline>
      <SubText>This sets your daily calorie target.</SubText>
      {GOAL_OPTIONS.map((opt) => (
        <SelectCard key={opt.value} selected={form.goal === opt.value} onPress={() => setForm((f) => ({ ...f, goal: opt.value }))} label={opt.label} desc={opt.desc} />
      ))}

      {/* Calorie preview */}
      <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 20, marginTop: 8, borderWidth: 1.5, borderColor: C.border }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Your Daily Target</Text>
        <Text style={{ fontSize: 44, fontWeight: "800", color: C.forest, letterSpacing: -1 }}>
          {calculateCalorieGoal({ age: parseInt(form.age), gender: form.gender, heightCm: parseFloat(form.heightCm), weightKg: parseFloat(form.weightKg), activityLevel: form.activityLevel, goal: form.goal })}
          <Text style={{ fontSize: 18, fontWeight: "500", color: C.textMuted }}> kcal/day</Text>
        </Text>
      </View>

      <NavRow onBack={() => setStep(1)} onNext={() => { trackOnboardingStepCompleted(3, "goal"); setStep(3); }} />
    </Screen>,

    // ── Step 3: Water Habits ─────────────────────────────────────────────────
    <Screen key="step3">
      <Headline>Your water{"\n"}habits.</Headline>
      <SubText>Sets your personalised hydration goal.</SubText>
      {WATER_OPTIONS.map((opt) => (
        <SelectCard key={opt.value} selected={form.waterHabits === opt.value} onPress={() => setForm((f) => ({ ...f, waterHabits: opt.value }))} label={opt.label} desc={opt.desc} />
      ))}
      <NavRow onBack={() => setStep(2)} onNext={() => { trackOnboardingStepCompleted(4, "water_habits"); setStep(4); }} />
    </Screen>,

    // ── Step 4: What drives weight change? ───────────────────────────────────
    <Screen key="step4">
      <Headline>Quick{"\n"}question.</Headline>
      <SubText>In your experience, what has the biggest impact on your weight?</SubText>
      {([
        { value: "exercise", label: "Exercise",           desc: "Working out and staying active" },
        { value: "diet",     label: "What I eat",         desc: "The food and calories I consume" },
        { value: "both",     label: "Both equally",       desc: "Diet and exercise matter the same" },
        { value: "unsure",   label: "Honestly not sure",  desc: "Still figuring it out" },
      ] as const).map((opt) => (
        <SelectCard key={opt.value} selected={form.weightDriverGuess === opt.value} onPress={() => setForm((f) => ({ ...f, weightDriverGuess: opt.value }))} label={opt.label} desc={opt.desc} />
      ))}
      <NavRow onBack={() => setStep(3)} onNext={() => {
        if (!form.weightDriverGuess) { Alert.alert("Pick an option", "Select one before continuing."); return; }
        trackOnboardingStepCompleted(5, "weight_driver_guess");
        setStep(5);
      }} />
    </Screen>,

    // ── Step 5: 80/20 Reveal ─────────────────────────────────────────────────
    <Screen key="step5">
      {/* Editorial food image */}
      <View style={{ marginHorizontal: -24, marginTop: -0, marginBottom: 24, height: 200, overflow: "hidden", borderRadius: 0 }}>
        <Image
          source={require("@/assets/images/food/ingredients-flatlay.webp")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
      {/* Big stat */}
      <View style={{ alignItems: "center", paddingTop: 0, marginBottom: 24 }}>
        <Text style={{ fontSize: 96, fontWeight: "800", color: C.forest, letterSpacing: -4, lineHeight: 96 }}>80%</Text>
        <View style={{ width: 40, height: 2, backgroundColor: C.brass, borderRadius: 1, marginTop: 8 }} />
      </View>

      <Headline>of your results{"\n"}come from nutrition.</Headline>
      <SubText>
        Exercise matters. But what you eat is the single biggest lever for changing your weight. Tracking food, even roughly, produces results that exercise alone rarely does.
      </SubText>

      {/* Bar chart */}
      <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 28, borderWidth: 1.5, borderColor: C.border }}>
        {[
          { label: "Nutrition", pct: 80, color: C.cognac },
          { label: "Exercise",  pct: 20, color: C.forest },
        ].map((item) => (
          <View key={item.label} style={{ marginBottom: item.label === "Nutrition" ? 16 : 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.forest }}>{item.label}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: item.color }}>{item.pct}%</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: C.border, overflow: "hidden" }}>
              <View style={{ width: `${item.pct}%` as any, height: "100%", backgroundColor: item.color, borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </View>

      <PrimaryCTA label="Got it. Continue." onPress={() => { trackOnboardingStepCompleted(6, "nutrition_reveal"); setStep(6); }} />
    </Screen>,

    // ── Step 6: Tracking Awareness ───────────────────────────────────────────
    <Screen key="step6">
      <Headline>Your tracking{"\n"}habits.</Headline>
      <SubText>Be accurate. This tailors how Calorly works for you.</SubText>
      {TRACKING_OPTIONS.map((opt) => (
        <SelectCard key={opt.value} selected={form.trackingHabit === opt.value} onPress={() => setForm((f) => ({ ...f, trackingHabit: opt.value }))} label={opt.label} desc={opt.desc} />
      ))}
      <NavRow onBack={() => setStep(5)} onNext={() => { trackOnboardingStepCompleted(7, "tracking_habit"); setStep(7); }} />
    </Screen>,

    // ── Step 7: AI Introduction ──────────────────────────────────────────────
    <Screen key="step7">
      {/* Demo food photo — the "snap your meal" visual */}
      <View style={{ marginHorizontal: -24, marginTop: -0, marginBottom: 24, height: 220, overflow: "hidden" }}>
        <Image
          source={require("@/assets/images/food/salad-bowl.webp")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <View style={{ position: "absolute", bottom: 12, right: 12, backgroundColor: C.forest + "CC", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: C.bg, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>📸 Snap to log</Text>
        </View>
      </View>
      <Headline>Your AI{"\n"}nutrition coach.</Headline>
      <SubText>Calorly uses computer vision and natural language AI to make logging fast.</SubText>

      {[
        { title: "Snap your meal",   sub: "Image recognition. Instant log.",   body: "Point your camera at any plate. Calorly identifies the food and estimates calories and macros in seconds." },
        { title: "Say it out loud",  sub: "Voice input. Hands-free logging.",   body: 'Say "two scrambled eggs and a coffee with oat milk" and Calorly logs it. No typing, no searching.' },
      ].map((card) => (
        <View key={card.title} style={{ backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1.5, borderColor: C.border }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: C.forest, marginBottom: 4 }}>{card.title}</Text>
          <Text style={{ fontSize: 12, color: C.cognac, fontWeight: "600", letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" }}>{card.sub}</Text>
          <Text style={{ fontSize: 14, color: C.textMuted, lineHeight: 22 }}>{card.body}</Text>
        </View>
      ))}

      <NavRow onBack={() => setStep(6)} onNext={() => { trackOnboardingStepCompleted(8, "ai_intro"); setStep(8); }} />
    </Screen>,

    // ── Step 8: Traditional vs Calorly ──────────────────────────────────────
    <Screen key="step8">
      <Headline>A smarter way{"\n"}to track.</Headline>
      <SubText>How Calorly compares to the old way of logging food.</SubText>

      {/* Comparison table */}
      <View style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: C.border, marginBottom: 28 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", backgroundColor: C.surface, borderBottomWidth: 1.5, borderBottomColor: C.border }}>
          <View style={{ flex: 1, padding: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: C.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Traditional</Text>
          </View>
          <View style={{ width: 1.5, backgroundColor: C.border }} />
          <View style={{ flex: 1, padding: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: C.cognac, letterSpacing: 1, textTransform: "uppercase" }}>Calorly AI</Text>
          </View>
        </View>
        {[
          { t: "Search food manually",       a: "Snap a photo or speak" },
          { t: "Estimate portions yourself", a: "AI estimates for you" },
          { t: "Tedious, easy to quit",      a: "Seconds per meal" },
          { t: "Generic database results",   a: "Learns your habits" },
        ].map((row, i) => (
          <View key={i} style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border, backgroundColor: i % 2 === 0 ? C.bg : C.surface }}>
            <View style={{ flex: 1, padding: 14, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: C.textMuted, textAlign: "center" }}>{row.t}</Text>
            </View>
            <View style={{ width: 1.5, backgroundColor: C.border }} />
            <View style={{ flex: 1, padding: 14, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: C.cognac, fontWeight: "700", textAlign: "center" }}>{row.a}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <PrimaryCTA label="Start Tracking" onPress={handleComplete} />
        <SecondaryBtn label="Back" onPress={() => setStep(7)} />
      </View>
    </Screen>,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Thin progress bar — Cal AI style */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 52, paddingHorizontal: 24, paddingBottom: 8 }}>
        <View style={{ height: 3, backgroundColor: C.border, borderRadius: 2, overflow: "hidden" }}>
          <View style={{
            height: "100%",
            width: `${((step + 1) / TOTAL_STEPS) * 100}%` as any,
            backgroundColor: C.cognac,
            borderRadius: 2,
          }} />
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: 72 }}>
        {steps[step]}
      </View>
    </View>
  );
}
