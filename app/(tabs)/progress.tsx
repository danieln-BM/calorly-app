import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Svg, { Rect, Line, Text as SvgText, Circle, Polyline } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-provider";
import { trackFeatureUsed } from "@/lib/analytics";
import {
  loadProfile,
  loadWeightLog,
  addWeightEntry,
  loadAllFoodLog,
  getLast7Days,
  formatDate,
  getTodayString,
  calculateBMI,
  getBMICategory,
  getBMIDetail,
  calculateBMR,
  WeightEntry,
  FoodLogEntry,
} from "@/lib/store";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 160;

function CalorieBarChart({ data }: { data: { date: string; calories: number }[] }) {
  const colors = useColors();
  if (data.length === 0) return null;

  const maxCal = Math.max(...data.map((d) => d.calories), 1);
  const barWidth = (CHART_WIDTH - 20) / data.length - 6;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
      {data.map((item, i) => {
        const barHeight = Math.max(2, (item.calories / maxCal) * CHART_HEIGHT);
        const x = 10 + i * ((CHART_WIDTH - 20) / data.length);
        const y = CHART_HEIGHT - barHeight;
        const isToday = item.date === getTodayString();

        return (
          <React.Fragment key={item.date}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={isToday ? colors.primary : colors.primary + "60"}
            />
            <SvgText
              x={x + barWidth / 2}
              y={CHART_HEIGHT + 16}
              textAnchor="middle"
              fontSize={10}
              fill={colors.muted}
            >
              {new Date(item.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}
            </SvgText>
            {item.calories > 0 && (
              <SvgText
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill={colors.muted}
              >
                {item.calories}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function WeightLineChart({ data }: { data: WeightEntry[] }) {
  const colors = useColors();
  if (data.length < 2) return null;

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW;

  const points = data.map((item, i) => {
    const x = 10 + (i / (data.length - 1)) * (CHART_WIDTH - 20);
    const y = CHART_HEIGHT - ((item.weight - minW) / range) * CHART_HEIGHT;
    return `${x},${y}`;
  });

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
      <Polyline
        points={points.join(" ")}
        fill="none"
        stroke={colors.accent}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((item, i) => {
        const x = 10 + (i / (data.length - 1)) * (CHART_WIDTH - 20);
        const y = CHART_HEIGHT - ((item.weight - minW) / range) * CHART_HEIGHT;
        return (
          <React.Fragment key={item.date}>
            <Circle cx={x} cy={y} r={4} fill={colors.accent} />
            <SvgText
              x={x}
              y={CHART_HEIGHT + 16}
              textAnchor="middle"
              fontSize={9}
              fill={colors.muted}
            >
              {new Date(item.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function ProgressScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPremium, triggerPaywall } = useSubscription();
  const [profile, setProfile] = useState<any>(null);
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);
  const [calorieTrend, setCalorieTrend] = useState<{ date: string; calories: number }[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [streak, setStreak] = useState(0);
  const [allFoodLog, setAllFoodLog] = useState<FoodLogEntry[]>([]);

  const loadData = useCallback(async () => {
    const [p, wl, allFood] = await Promise.all([
      loadProfile(),
      loadWeightLog(),
      loadAllFoodLog(),
    ]);
    setProfile(p);
    setWeightLog(wl.slice(-14));
    setNewWeight(p.weightKg.toString());
    setAllFoodLog(allFood);

    // Build 7-day calorie trend
    const days = getLast7Days();
    const trend = days.map((date) => ({
      date,
      calories: Math.round(
        allFood
          .filter((e) => e.date === date)
          .reduce((sum, e) => sum + e.calories, 0)
      ),
    }));
    setCalorieTrend(trend);

    // Calculate streak (consecutive days with food logged)
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const hasLog = allFood.some((e) => e.date === dateStr);
      if (hasLog) s++;
      else if (i > 0) break;
    }
    setStreak(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Track when premium users view the progress charts screen
      if (isPremium) {
        trackFeatureUsed("progress_charts", "paid");
      }
    }, [loadData, isPremium])
  );

  const handleLogWeight = async () => {
    const w = parseFloat(newWeight);
    if (!w || w < 20 || w > 500) {
      Alert.alert("Invalid Weight", "Please enter a valid weight.");
      return;
    }
    await addWeightEntry(w, getTodayString());
    loadData();
  };

  if (!profile) return null;

  // Free users see basic 30-day calorie summary; advanced charts/trends are premium-only

  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const bmiCategory = getBMICategory(bmi);
  const latestWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : profile.weightKg;
  const startWeight = weightLog.length > 0 ? weightLog[0].weight : profile.weightKg;
  const weightChange = latestWeight - startWeight;

  const avgCalories =
    calorieTrend.filter((d) => d.calories > 0).length > 0
      ? Math.round(
          calorieTrend.filter((d) => d.calories > 0).reduce((sum, d) => sum + d.calories, 0) /
            calorieTrend.filter((d) => d.calories > 0).length
        )
      : 0;

  // ── Weekly Insights calculations ─────────────────────────────────────────────
  const weeklyInsights = useMemo(() => {
    const days = getLast7Days();
    const weekFood = allFoodLog.filter((e) => days.includes(e.date));

    // Average daily calories (only days with logs)
    const dayCalMap: Record<string, number> = {};
    weekFood.forEach((e) => {
      dayCalMap[e.date] = (dayCalMap[e.date] || 0) + e.calories;
    });
    const loggedDays = Object.keys(dayCalMap);
    const avgCal = loggedDays.length > 0
      ? Math.round(loggedDays.reduce((s, d) => s + dayCalMap[d], 0) / loggedDays.length)
      : 0;

    // Best streak (already computed above)
    const bestStreak = streak;

    // Most logged food this week
    const foodCount: Record<string, { name: string; count: number }> = {};
    weekFood.forEach((e) => {
      if (!foodCount[e.foodId]) foodCount[e.foodId] = { name: e.foodName || "Unknown Food", count: 0 };
      foodCount[e.foodId].count++;
    });
    const mostLogged = Object.values(foodCount).sort((a, b) => b.count - a.count)[0] ?? null;

    // Days under calorie goal
    const daysUnderGoal = loggedDays.filter((d) => dayCalMap[d] <= profile.calorieGoal).length;

    // Avg protein this week
    const avgProtein = loggedDays.length > 0
      ? Math.round(weekFood.reduce((s, e) => s + e.protein, 0) / loggedDays.length)
      : 0;

    // Total calories burned (exercise) this week — not tracked here, skip
    return { avgCal, bestStreak, mostLogged, daysUnderGoal, loggedDays: loggedDays.length, avgProtein };
  }, [allFoodLog, streak, profile]);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground, marginBottom: 20 }}>
          Progress 📈
        </Text>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {/* Streak */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 32 }}>🔥</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.accent }}>{streak}</Text>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>day streak</Text>
          </View>

          {/* Avg Calories */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 32 }}>📊</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.primary }}>{avgCalories}</Text>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>avg kcal/day</Text>
          </View>

          {/* BMI — tappable */}
          <Pressable
            onPress={() => router.push("/bmi-detail")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ fontSize: 32 }}>⚖️</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: getBMIDetail(bmi).color }}>{bmi}</Text>
            <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center" }}>{bmiCategory}</Text>
            <Text style={{ fontSize: 9, color: colors.primary, marginTop: 3 }}>Tap for details</Text>
          </Pressable>
        </View>

        {/* BMR + BMI detail cards row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {/* BMR card */}
          <Pressable
            onPress={() => router.push("/bmr-detail")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: 16,
              padding: 16,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Basal Metabolic Rate</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff", marginTop: 4 }}>
              {calculateBMR(profile).toLocaleString()}
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>kcal at rest / day</Text>
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>Tap for full breakdown →</Text>
          </Pressable>

          {/* BMI detail card */}
          <Pressable
            onPress={() => router.push("/bmi-detail")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: getBMIDetail(bmi).color + "18",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1.5,
              borderColor: getBMIDetail(bmi).color + "55",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 11, color: getBMIDetail(bmi).color, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Body Mass Index</Text>
            <Text style={{ fontSize: 28, fontWeight: "900", color: getBMIDetail(bmi).color, marginTop: 4 }}>{bmi}</Text>
            <Text style={{ fontSize: 12, color: getBMIDetail(bmi).color, fontWeight: "600" }}>{getBMIDetail(bmi).category}</Text>
            <Text style={{ fontSize: 10, color: colors.muted, marginTop: 6 }}>Tap for gauge →</Text>
          </Pressable>
        </View>

        {/* ─── Weekly Insights Widget ─────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground }}>Weekly Summary</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Last 7 days</Text>
            </View>
            <View style={{ backgroundColor: colors.primary + "18", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
                {weeklyInsights.loggedDays}/7 days logged
              </Text>
            </View>
          </View>

          {/* Insight grid: 2 columns */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            {/* Avg Daily Calories */}
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 22 }}>🔥</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, marginTop: 4 }}>
                {weeklyInsights.avgCal > 0 ? weeklyInsights.avgCal.toLocaleString() : "—"}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 15 }}>avg kcal/day</Text>
              {weeklyInsights.avgCal > 0 && profile.calorieGoal > 0 && (
                <Text style={{ fontSize: 10, color: weeklyInsights.avgCal <= profile.calorieGoal ? colors.success : colors.error, marginTop: 3, fontWeight: "600" }}>
                  {weeklyInsights.avgCal <= profile.calorieGoal ? "✓ Under goal" : `+${weeklyInsights.avgCal - profile.calorieGoal} over goal`}
                </Text>
              )}
            </View>

            {/* Days Under Goal */}
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 22 }}>🎯</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, marginTop: 4 }}>
                {weeklyInsights.loggedDays > 0 ? weeklyInsights.daysUnderGoal : "—"}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 15 }}>days under goal</Text>
              {weeklyInsights.loggedDays > 0 && (
                <Text style={{ fontSize: 10, color: colors.muted, marginTop: 3 }}>
                  out of {weeklyInsights.loggedDays} logged
                </Text>
              )}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* Best Streak */}
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 22 }}>🏆</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, marginTop: 4 }}>
                {weeklyInsights.bestStreak}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 15 }}>day streak</Text>
              {weeklyInsights.bestStreak >= 7 && (
                <Text style={{ fontSize: 10, color: colors.warning, marginTop: 3, fontWeight: "600" }}>🔥 On fire!</Text>
              )}
            </View>

            {/* Most Logged Food */}
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
              <Text style={{ fontSize: 22 }}>🍽️</Text>
              <Text
                style={{ fontSize: 13, fontWeight: "800", color: colors.foreground, marginTop: 4 }}
                numberOfLines={2}
              >
                {weeklyInsights.mostLogged ? weeklyInsights.mostLogged.name : "—"}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 15 }}>most logged food</Text>
              {weeklyInsights.mostLogged && (
                <Text style={{ fontSize: 10, color: colors.muted, marginTop: 3 }}>
                  {weeklyInsights.mostLogged.count}× this week
                </Text>
              )}
            </View>
          </View>

          {/* Avg protein row */}
          {weeklyInsights.avgProtein > 0 && (
            <View
              style={{
                marginTop: 10,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 22 }}>💪</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                  {weeklyInsights.avgProtein}g avg protein/day
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {weeklyInsights.avgProtein >= 50 ? "Great protein intake!" : "Try to increase protein for better satiety"}
                </Text>
              </View>
            </View>
          )}

          {weeklyInsights.loggedDays === 0 && (
            <Text style={{ textAlign: "center", color: colors.muted, paddingVertical: 12, fontSize: 13 }}>
              Start logging meals to see your weekly summary!
            </Text>
          )}
        </View>

        {/* Calorie Trend Chart — Premium only */}
        {isPremium ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
              7-Day Calorie Trend
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
              Goal: {profile.calorieGoal} kcal/day
            </Text>
            <CalorieBarChart data={calorieTrend} />
            {calorieTrend.every((d) => d.calories === 0) && (
              <Text style={{ textAlign: "center", color: colors.muted, paddingVertical: 20 }}>
                No data yet. Start logging your meals!
              </Text>
            )}
          </View>
        ) : (
          <Pressable
            onPress={() => triggerPaywall("progress_charts", router)}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1.5,
              borderColor: colors.primary + "40",
              borderStyle: "dashed",
              alignItems: "center",
              gap: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 24 }}>📈</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>7-Day Calorie Trend</Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>Upgrade to Pro to unlock calorie trend charts</Text>
            <View style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 7, marginTop: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Unlock with Pro →</Text>
            </View>
          </Pressable>
        )}

        {/* Weight Log */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Weight Tracker
          </Text>

          {/* Log Weight */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <TextInput
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="numeric"
              placeholder="Enter weight (kg)"
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 10,
                padding: 12,
                fontSize: 16,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Pressable
              onPress={handleLogWeight}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 16,
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Log</Text>
            </Pressable>
          </View>

          {/* Current weight always visible */}
          {weightLog.length > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted }}>Starting</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{startWeight} kg</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>Change</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: weightChange < 0 ? colors.success : weightChange > 0 ? colors.error : colors.muted }}>
                  {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>Current</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{latestWeight} kg</Text>
              </View>
            </View>
          )}
          {/* Weight trend chart — Premium only */}
          {isPremium ? (
            weightLog.length >= 2 ? (
              <WeightLineChart data={weightLog} />
            ) : (
              <Text style={{ textAlign: "center", color: colors.muted, paddingVertical: 16 }}>
                Log your weight daily to see your progress chart
              </Text>
            )
          ) : (
            <Pressable
              onPress={() => triggerPaywall("progress_charts", router)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 14 }}>🔒</Text>
              <Text style={{ fontSize: 13, color: colors.muted, fontWeight: "600" }}>Upgrade to see weight trend chart</Text>
            </Pressable>
          )}
        </View>

        {/* Goal Progress */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Goal Summary
          </Text>
          <View style={{ gap: 12 }}>
            {[
              { label: "Daily Calorie Goal", value: `${profile.calorieGoal} kcal`, icon: "🎯" },
              { label: "Protein Goal", value: `${profile.proteinGoal}g`, icon: "💪" },
              { label: "Carbs Goal", value: `${profile.carbsGoal}g`, icon: "🌾" },
              { label: "Fat Goal", value: `${profile.fatGoal}g`, icon: "🥑" },
              { label: "Water Goal", value: `${profile.waterGoal} cups`, icon: "💧" },
            ].map((item) => (
              <View
                key={item.label}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  <Text style={{ fontSize: 14, color: colors.foreground }}>{item.label}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
