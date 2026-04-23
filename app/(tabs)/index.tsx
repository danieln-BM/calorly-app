import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Svg, { Circle } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-provider";
import { FREE_TIER_DAILY_LOG_LIMIT } from "@/lib/subscription";
import { trackAhaMomentReached, trackCoreActionPerformed } from "@/lib/analytics";
import { loadAllFoodLog } from "@/lib/store";
import {
  loadProfile,
  loadFoodLog,
  loadExerciseLog,
  loadWaterEntry,
  updateWaterEntry,
  loadWeightLog,
  addWeightEntry,
  getTodayString,
  formatDate,
  UserProfile,
  FoodLogEntry,
  WeightEntry,
  MEAL_TYPES,
  MealType,
  DEFAULT_PROFILE,
} from "@/lib/store";

function CalorieRing({
  consumed,
  goal,
  burned,
  size = 180,
}: {
  consumed: number;
  goal: number;
  burned: number;
  size?: number;
}) {
  const colors = useColors();
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const net = Math.max(0, consumed - burned);
  const progress = Math.min(net / goal, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const remaining = Math.max(0, goal - net);
  const isOver = net > goal;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={12}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? colors.error : colors.primary}
          strokeWidth={12}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 36, fontWeight: "800", color: isOver ? colors.error : colors.foreground }}>
          {remaining}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>
          {isOver ? "over goal" : "kcal left"}
        </Text>
        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
          {consumed} eaten · {burned} burned
        </Text>
      </View>
    </View>
  );
}

function MacroBar({
  label,
  value,
  goal,
  color,
  unit = "g",
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
}) {
  const colors = useColors();
  const progress = Math.min(value / Math.max(goal, 1), 1);

  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>{label}</Text>
      <View
        style={{
          width: "100%",
          height: 6,
          backgroundColor: colors.border,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>
        {Math.round(value)}
        <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "400" }}>/{Math.round(goal)}{unit}</Text>
      </Text>
    </View>
  );
}

function MealSection({
  mealType,
  entries,
  calorieGoal,
  onAddFood,
  isPremium,
}: {
  mealType: MealType;
  entries: FoodLogEntry[];
  calorieGoal: number;
  onAddFood: (meal: MealType) => void;
  isPremium: boolean;
}) {
  const colors = useColors();
  const totalCals = entries.reduce((sum, e) => sum + e.calories, 0);
  const mealIcons: Record<MealType, string> = {
    Breakfast: "☀️",
    Lunch: "🌤️",
    Dinner: "🌙",
    Snacks: "🍎",
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Meal Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 18 }}>{mealIcons[mealType]}</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{mealType}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "600" }}>{totalCals} kcal</Text>
          <Pressable
            onPress={() => onAddFood(mealType)}
            style={({ pressed }) => [
              {
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <IconSymbol name="plus" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Food Entries */}
      {entries.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          {entries.map((entry) => (
            <View
              key={entry.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
                  {entry.foodName}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {entry.servingGrams}g{isPremium ? ` · P: ${Math.round(entry.protein)}g · C: ${Math.round(entry.carbs)}g · F: ${Math.round(entry.fat)}g` : " · Upgrade for macros"}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
                {entry.calories} kcal
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPremium, appOpenDays, triggerPaywall } = useSubscription();
  const [streak, setStreak] = useState(0);
  const [hasTriggeredAutoPaywall, setHasTriggeredAutoPaywall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(getTodayString());
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);
  const [exerciseBurned, setExerciseBurned] = useState(0);
  const [waterCups, setWaterCups] = useState(0);
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  const ahaFiredRef = React.useRef(false);

  const loadData = useCallback(async () => {
    const [p, fl, el, w, wl] = await Promise.all([
      loadProfile(),
      loadFoodLog(currentDate),
      loadExerciseLog(currentDate),
      loadWaterEntry(currentDate),
      loadWeightLog(),
    ]);
    setProfile(p);
    setFoodLog(fl);
    setExerciseBurned(el.reduce((sum, e) => sum + e.caloriesBurned, 0));
    setWaterCups(w);
    setWeightLog(wl);

    // Track aha moment: first time user has any food logged
    if (fl.length > 0 && !ahaFiredRef.current) {
      ahaFiredRef.current = true;
      trackAhaMomentReached();
    }
    // Track core action: total food entries logged today
    if (fl.length > 0) {
      trackCoreActionPerformed(fl.length);
    }
    // Pre-fill weight input with today's entry or last known weight
    const todayWeight = wl.find((e) => e.date === currentDate);
    const lastWeight = wl.length > 0 ? wl[wl.length - 1] : null;
    setWeightInput(todayWeight ? todayWeight.weight.toString() : lastWeight ? lastWeight.weight.toString() : "");
    setLoading(false);

    // Redirect to onboarding if not complete
    if (!p.onboardingComplete) {
      router.replace("/onboarding");
      return;
    }

    // Calculate streak for milestone trigger
    const allFood = await loadAllFoodLog();
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (allFood.some((e) => e.date === dateStr)) s++;
      else if (i > 0) break;
    }
    setStreak(s);
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  // Smart paywall triggers (run once per session when data is loaded)
  useEffect(() => {
    if (isPremium || loading || hasTriggeredAutoPaywall) return;
    // Day-3 trigger: user has opened the app on 3+ distinct days
    if (appOpenDays >= 3) {
      setHasTriggeredAutoPaywall(true);
      triggerPaywall("day3_open", router);
      return;
    }
    // 7-day streak milestone
    if (streak > 0 && streak % 7 === 0) {
      setHasTriggeredAutoPaywall(true);
      triggerPaywall("streak_milestone", router);
    }
  }, [isPremium, loading, appOpenDays, streak, hasTriggeredAutoPaywall, triggerPaywall, router]);

  const changeDate = (delta: number) => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const newDate = d.toISOString().split("T")[0];
    const today = getTodayString();
    if (newDate <= today) {
      setCurrentDate(newDate);
    }
  };

  const handleLogWeight = async () => {
    const w = parseFloat(weightInput);
    if (!w || w < 20 || w > 500) return;
    setSavingWeight(true);
    const entry = await addWeightEntry(w, currentDate);
    setWeightLog((prev) => {
      const filtered = prev.filter((e) => e.date !== currentDate);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
    setSavingWeight(false);
  };

  const handleWaterChange = async (delta: number) => {
    const newCups = Math.max(0, Math.min(20, waterCups + delta));
    setWaterCups(newCups);
    await updateWaterEntry(currentDate, newCups);
  };

  const handleAddFood = (mealType: MealType) => {
    if (!isPremium && foodLog.length >= FREE_TIER_DAILY_LOG_LIMIT) {
      triggerPaywall("food_log_limit", router);
      return;
    }
    router.push({ pathname: "/food-search", params: { mealType, date: currentDate } });
  };

  const totalConsumed = foodLog.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = foodLog.reduce((sum, e) => sum + e.protein, 0);
  const totalCarbs = foodLog.reduce((sum, e) => sum + e.carbs, 0);
  const totalFat = foodLog.reduce((sum, e) => sum + e.fat, 0);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={() => changeDate(-1)}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
            {formatDate(currentDate)}
          </Text>
          <Pressable
            onPress={() => changeDate(1)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : currentDate === getTodayString() ? 0.3 : 1,
            })}
            disabled={currentDate === getTodayString()}
          >
            <IconSymbol name="chevron.right" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Calorie Ring Card */}
        <View
          style={{
            marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 20,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          }}
        >
          <CalorieRing
            consumed={totalConsumed}
            goal={profile.calorieGoal}
            burned={exerciseBurned}
          />

          {/* Macro Bars */}
          {isPremium ? (
            <View
              style={{
                flexDirection: "row",
                gap: 16,
                width: "100%",
                marginTop: 20,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <MacroBar
                label="Protein"
                value={totalProtein}
                goal={profile.proteinGoal}
                color={colors.protein}
              />
              <MacroBar
                label="Carbs"
                value={totalCarbs}
                goal={profile.carbsGoal}
                color={colors.carbs}
              />
              <MacroBar
                label="Fat"
                value={totalFat}
                goal={profile.fatGoal}
                color={colors.fat}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => triggerPaywall("progress_charts", router)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 20,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                width: "100%",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 14 }}>🔒</Text>
              <Text style={{ fontSize: 13, color: colors.muted, fontWeight: "600" }}>
                Upgrade to see macro breakdown
              </Text>
            </Pressable>
          )}
        </View>

        {/* Free Tier Banner */}
        {!isPremium && (
          <Pressable
            onPress={() => router.push("/paywall")}
            style={({ pressed }) => ({
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 14,
              backgroundColor: colors.primary + "12",
              borderWidth: 1,
              borderColor: colors.primary + "40",
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 20 }}>🚀</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
                {Math.max(0, FREE_TIER_DAILY_LOG_LIMIT - foodLog.length)} free log{Math.max(0, FREE_TIER_DAILY_LOG_LIMIT - foodLog.length) !== 1 ? "s" : ""} remaining today
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>Upgrade to Pro for unlimited logging</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>Upgrade →</Text>
          </Pressable>
        )}

        {/* Water Tracker */}
        <View
          style={{
            marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 20 }}>💧</Text>
              <View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Water</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {waterCups} / {profile.waterGoal} cups
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pressable
                onPress={() => handleWaterChange(-1)}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <IconSymbol name="minus" size={16} color={colors.foreground} />
              </Pressable>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, minWidth: 28, textAlign: "center" }}>
                {waterCups}
              </Text>
              <Pressable
                onPress={() => handleWaterChange(1)}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <IconSymbol name="plus" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>
          {/* Water progress dots */}
          <View style={{ flexDirection: "row", gap: 4, marginTop: 12, flexWrap: "wrap" }}>
            {Array.from({ length: profile.waterGoal }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: i < waterCups ? "#3B82F6" : colors.border,
                }}
              />
            ))}
          </View>
        </View>

        {/* Weight Widget */}
        <View
          style={{
            marginHorizontal: 16,
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 20 }}>⚖️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Weight</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {weightLog.find((e) => e.date === currentDate)
                  ? `Today: ${weightLog.find((e) => e.date === currentDate)!.weight} ${profile.unitSystem === "imperial" ? "lbs" : "kg"}`
                  : weightLog.length > 0
                  ? `Last: ${weightLog[weightLog.length - 1].weight} ${profile.unitSystem === "imperial" ? "lbs" : "kg"}`
                  : "Not logged yet"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TextInput
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              placeholder={profile.unitSystem === "imperial" ? "lbs" : "kg"}
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={handleLogWeight}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderRadius: 10,
                padding: 10,
                fontSize: 16,
                fontWeight: "700",
                color: colors.foreground,
                textAlign: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "600" }}>
              {profile.unitSystem === "imperial" ? "lbs" : "kg"}
            </Text>
            <Pressable
              onPress={handleLogWeight}
              disabled={savingWeight}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 18,
                paddingVertical: 10,
                opacity: pressed || savingWeight ? 0.7 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                {savingWeight ? "..." : "Log"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Editorial food photo — visual divider before meals */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: "hidden", height: 160 }}>
          <Image
            source={require("@/assets/images/food/fruit-bowl.webp")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, backgroundColor: "#2D3A3A", opacity: 0.45 }} />
          <View style={{ position: "absolute", bottom: 12, left: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#F4F1ED", letterSpacing: -0.3 }}>Today's Meals</Text>
          </View>
        </View>

        {/* Meal Sections */}
        <View style={{ paddingHorizontal: 16 }}>
          {MEAL_TYPES.map((meal) => (
            <MealSection
              key={meal}
              mealType={meal}
              entries={foodLog.filter((e) => e.mealType === meal)}
              calorieGoal={profile.calorieGoal}
              onAddFood={handleAddFood}
              isPremium={isPremium}
            />
          ))}
        </View>

        {/* Exercise Summary */}
        {exerciseBurned > 0 && (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconSymbol name="flame.fill" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                Exercise Calories
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                {exerciseBurned} kcal burned today
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
