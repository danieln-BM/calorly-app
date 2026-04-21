import React, { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  loadProfile,
  calculateBMR,
  calculateTDEE,
  UserProfile,
  DEFAULT_PROFILE,
  ACTIVITY_LABELS,
} from "@/lib/store";

// Horizontal bar chart showing TDEE at each activity level
function ActivityBarChart({
  bmr,
  currentLevel,
  colors,
}: {
  bmr: number;
  currentLevel: UserProfile["activityLevel"];
  colors: any;
}) {
  const levels = Object.entries(ACTIVITY_LABELS) as [UserProfile["activityLevel"], (typeof ACTIVITY_LABELS)[keyof typeof ACTIVITY_LABELS]][];
  const maxTDEE = Math.round(bmr * 1.9);
  const BAR_HEIGHT = 28;
  const GAP = 10;
  const LABEL_W = 0;
  const CHART_W = 220;
  const TOTAL_H = levels.length * (BAR_HEIGHT + GAP);

  return (
    <Svg width={CHART_W + LABEL_W} height={TOTAL_H} style={{ marginTop: 8 }}>
      {levels.map(([key, info], i) => {
        const tdee = Math.round(bmr * info.multiplier);
        const barW = (tdee / maxTDEE) * CHART_W;
        const y = i * (BAR_HEIGHT + GAP);
        const isActive = key === currentLevel;
        return (
          <Svg key={key} x={LABEL_W} y={y}>
            {/* Background track */}
            <Rect x={0} y={0} width={CHART_W} height={BAR_HEIGHT} rx={8} fill={colors.border} />
            {/* Filled bar */}
            <Rect
              x={0}
              y={0}
              width={barW}
              height={BAR_HEIGHT}
              rx={8}
              fill={isActive ? colors.primary : colors.muted}
              opacity={isActive ? 1 : 0.45}
            />
            {/* TDEE label inside bar */}
            <SvgText
              x={barW - 6}
              y={BAR_HEIGHT / 2 + 5}
              textAnchor="end"
              fontSize={11}
              fontWeight={isActive ? "800" : "600"}
              fill={isActive ? "#fff" : colors.foreground}
            >
              {tdee} kcal
            </SvgText>
          </Svg>
        );
      })}
    </Svg>
  );
}

const FORMULA_STEPS = [
  { label: "Weight component",   formula: "10 × weight (kg)",         example: (p: UserProfile) => `10 × ${p.weightKg} = ${10 * p.weightKg}` },
  { label: "Height component",   formula: "6.25 × height (cm)",       example: (p: UserProfile) => `6.25 × ${p.heightCm} = ${6.25 * p.heightCm}` },
  { label: "Age component",      formula: "5 × age (years)",          example: (p: UserProfile) => `5 × ${p.age} = ${5 * p.age}` },
  { label: "Sex constant",       formula: "+5 (male) / −161 (female)", example: (p: UserProfile) => p.gender === "male" ? "+5" : "−161" },
];

export default function BMRDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useFocusEffect(
    useCallback(() => {
      loadProfile().then(setProfile);
    }, [])
  );

  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const activityInfo = ACTIVITY_LABELS[profile.activityLevel];
  const deficit = profile.calorieGoal < tdee ? tdee - profile.calorieGoal : 0;
  const surplus = profile.calorieGoal > tdee ? profile.calorieGoal - tdee : 0;

  // Hourly breakdown
  const perHour = Math.round(bmr / 24);
  const perMinute = (bmr / 1440).toFixed(1);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 8,
              borderRadius: 10,
              backgroundColor: colors.surface,
            })}
          >
            <Text style={{ fontSize: 20 }}>←</Text>
          </Pressable>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>BMR Calculator</Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>Basal Metabolic Rate</Text>
          </View>
        </View>

        {/* Hero BMR card */}
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 20,
            padding: 24,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>
            Your Basal Metabolic Rate
          </Text>
          <Text style={{ fontSize: 56, fontWeight: "900", color: "#fff", lineHeight: 68 }}>
            {bmr.toLocaleString()}
          </Text>
          <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>
            kcal / day
          </Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 8, textAlign: "center" }}>
            Calories your body burns at complete rest to keep you alive
          </Text>

          {/* Sub-stats */}
          <View style={{ flexDirection: "row", gap: 16, marginTop: 16 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>{perHour}</Text>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>kcal/hour</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.3)" }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>{perMinute}</Text>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>kcal/min</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.3)" }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>{(bmr * 7).toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>kcal/week</Text>
            </View>
          </View>
        </View>

        {/* BMR vs TDEE vs Goal */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            From BMR to Your Daily Goal
          </Text>

          {/* Step flow */}
          {[
            { label: "BMR (at rest)", value: bmr, icon: "🛌", desc: "Calories to sustain basic body functions", color: colors.muted },
            { label: `TDEE (${activityInfo.label})`, value: tdee, icon: "🏃", desc: `BMR × ${activityInfo.multiplier} activity factor`, color: colors.primary },
            { label: "Your calorie goal", value: profile.calorieGoal, icon: "🎯", desc: deficit > 0 ? `${deficit} kcal deficit for weight loss` : surplus > 0 ? `${surplus} kcal surplus for weight gain` : "Maintenance calories", color: "#22C55E" },
          ].map((item, i, arr) => (
            <View key={item.label}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>{item.label}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>{item.desc}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: item.color }}>
                  {item.value.toLocaleString()}
                </Text>
              </View>
              {i < arr.length - 1 && (
                <View style={{ alignItems: "center", marginVertical: -4 }}>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>↓</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Activity level comparison chart */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
            TDEE by Activity Level
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
            Your current level highlighted in green
          </Text>

          {Object.entries(ACTIVITY_LABELS).map(([key, info]) => {
            const levelTdee = Math.round(bmr * info.multiplier);
            const maxTdee = Math.round(bmr * 1.9);
            const pct = levelTdee / maxTdee;
            const isActive = key === profile.activityLevel;
            return (
              <View key={key} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: isActive ? colors.primary : colors.foreground, fontWeight: isActive ? "700" : "400" }}>
                    {info.label} {isActive ? "◀ you" : ""}
                  </Text>
                  <Text style={{ fontSize: 12, color: isActive ? colors.primary : colors.muted, fontWeight: isActive ? "700" : "400" }}>
                    {levelTdee.toLocaleString()} kcal
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
                  <View
                    style={{
                      height: 8,
                      width: `${pct * 100}%`,
                      backgroundColor: isActive ? colors.primary : colors.muted,
                      borderRadius: 4,
                      opacity: isActive ? 1 : 0.4,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>{info.description}</Text>
              </View>
            );
          })}
        </View>

        {/* Mifflin-St Jeor Formula Breakdown */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
            How It's Calculated
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
            Mifflin-St Jeor Equation (1990) — most accurate for general population
          </Text>

          {/* Formula display */}
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 10,
              padding: 12,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Formula ({profile.gender === "male" ? "male" : "female"}):</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary, fontFamily: "monospace" }}>
              {profile.gender === "male"
                ? "(10 × kg) + (6.25 × cm) − (5 × age) + 5"
                : "(10 × kg) + (6.25 × cm) − (5 × age) − 161"}
            </Text>
          </View>

          {/* Step-by-step breakdown */}
          {[
            { step: "10 × weight",  value: 10 * profile.weightKg,           unit: `10 × ${profile.weightKg} kg` },
            { step: "6.25 × height",value: 6.25 * profile.heightCm,         unit: `6.25 × ${profile.heightCm} cm` },
            { step: "5 × age",      value: -(5 * profile.age),              unit: `− 5 × ${profile.age} yrs` },
            { step: "Sex constant", value: profile.gender === "male" ? 5 : -161, unit: profile.gender === "male" ? "+ 5 (male)" : "− 161 (female)" },
          ].map((row, i) => (
            <View
              key={row.step}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 8,
                borderBottomWidth: i < 3 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View>
                <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600" }}>{row.step}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{row.unit}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: row.value >= 0 ? colors.success : colors.error }}>
                {row.value >= 0 ? "+" : ""}{row.value}
              </Text>
            </View>
          ))}

          {/* Total */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              paddingTop: 10,
              borderTopWidth: 2,
              borderTopColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: colors.foreground }}>BMR Total</Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: colors.primary }}>{bmr.toLocaleString()} kcal</Text>
          </View>
        </View>

        {/* Fun facts */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            ⚡ Fun Facts About Your BMR
          </Text>
          {[
            { icon: "🧠", text: `Your brain alone burns ~${Math.round(bmr * 0.20)} kcal/day (20% of your BMR)` },
            { icon: "❤️", text: `Your heart pumps ~${Math.round(bmr * 0.09)} kcal/day just keeping you alive` },
            { icon: "🫁", text: `Breathing and circulation account for ~${Math.round(bmr * 0.10)} kcal/day` },
            { icon: "💪", text: `Every 1 kg of muscle burns ~13 kcal/day at rest — strength training pays off!` },
            { icon: "📈", text: `Your BMR decreases ~2% per decade after age 20 — staying active helps offset this` },
          ].map((fact) => (
            <View key={fact.icon} style={{ flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
              <Text style={{ fontSize: 18 }}>{fact.icon}</Text>
              <Text style={{ flex: 1, fontSize: 13, color: colors.foreground, lineHeight: 19 }}>{fact.text}</Text>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 17, textAlign: "center" }}>
            ⚠️ BMR and TDEE are estimates based on population averages. Individual metabolism varies. Consult a registered dietitian or healthcare provider for personalised nutrition advice.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
