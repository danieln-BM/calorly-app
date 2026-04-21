import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  SectionList,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  loadFoodLog,
  deleteFoodLogEntry,
  getTodayString,
  formatDate,
  FoodLogEntry,
  MEAL_TYPES,
  MealType,
} from "@/lib/store";

export default function LogScreen() {
  const colors = useColors();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(getTodayString());
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);

  const loadData = useCallback(async () => {
    const log = await loadFoodLog(currentDate);
    setFoodLog(log);
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const changeDate = (delta: number) => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const newDate = d.toISOString().split("T")[0];
    const today = getTodayString();
    if (newDate <= today) setCurrentDate(newDate);
  };

  const handleDelete = (entry: FoodLogEntry) => {
    Alert.alert(
      "Delete Entry",
      `Remove ${entry.foodName} from ${entry.mealType}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteFoodLogEntry(entry.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleAddFood = (mealType: MealType) => {
    router.push({ pathname: "/food-search", params: { mealType, date: currentDate } });
  };

  const sections = MEAL_TYPES.map((meal) => ({
    title: meal,
    data: foodLog.filter((e) => e.mealType === meal),
    total: foodLog.filter((e) => e.mealType === meal).reduce((sum, e) => sum + e.calories, 0),
  }));

  const totalCalories = foodLog.reduce((sum, e) => sum + e.calories, 0);

  const mealIcons: Record<MealType, string> = {
    Breakfast: "☀️",
    Lunch: "🌤️",
    Dinner: "🌙",
    Snacks: "🍎",
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {/* Date navigation row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => changeDate(-1)}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              {formatDate(currentDate)}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted }}>
              {totalCalories} kcal logged
            </Text>
          </View>
          <Pressable
            onPress={() => changeDate(1)}
            disabled={currentDate === getTodayString()}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : currentDate === getTodayString() ? 0.3 : 1,
            })}
          >
            <IconSymbol name="chevron.right" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        {/* Template action buttons */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/meal-templates", params: { date: currentDate } })}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <IconSymbol name="rectangle.stack.fill" size={16} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>Templates</Text>
          </Pressable>
          {foodLog.length > 0 && (
            <Pressable
              onPress={() => router.push({ pathname: "/save-meal-template", params: { date: currentDate } })}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <IconSymbol name="bookmark.fill" size={16} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>Save as Template</Text>
            </Pressable>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderSectionHeader={({ section }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: colors.surface,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 18 }}>{mealIcons[section.title as MealType]}</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                {section.title}
              </Text>
              {section.total > 0 && (
                <View
                  style={{
                    backgroundColor: colors.primary + "20",
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
                    {section.total} kcal
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => handleAddFood(section.title as MealType)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <IconSymbol name="plus" size={16} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>Add</Text>
            </Pressable>
          </View>
        )}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
                {item.foodName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {item.servingGrams}g · P:{Math.round(item.protein)}g · C:{Math.round(item.carbs)}g · F:{Math.round(item.fat)}g
              </Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.accent, marginRight: 12 }}>
              {item.calories} kcal
            </Text>
            <Pressable
              onPress={() => handleDelete(item)}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <IconSymbol name="trash.fill" size={18} color={colors.error} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🍽️</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              Nothing logged yet
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center", paddingHorizontal: 32 }}>
              Tap the + button next to a meal to start logging your food
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
