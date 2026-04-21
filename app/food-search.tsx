import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { searchFoods, FOOD_DATABASE, FoodItem, FOOD_CATEGORIES } from "@/lib/food-database";
import { loadRecentFoods, loadCustomFoods, CustomFood } from "@/lib/store";
import type { MealType } from "@/lib/store";
import { useSubscription } from "@/lib/subscription-provider";
import { trackFeatureUsed } from "@/lib/analytics";

export default function FoodSearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPremium, triggerPaywall } = useSubscription();
  const params = useLocalSearchParams<{ mealType: string; date: string }>();
  const mealType = (params.mealType || "Breakfast") as MealType;
  const date = params.date || new Date().toISOString().split("T")[0];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [recentIds, custom] = await Promise.all([
      loadRecentFoods(),
      loadCustomFoods(),
    ]);
    const recent = recentIds
      .map((id) => FOOD_DATABASE.find((f) => f.id === id))
      .filter(Boolean) as FoodItem[];
    setRecentFoods(recent.slice(0, 10));
    setCustomFoods(custom);
    setResults(FOOD_DATABASE.slice(0, 20));
  };

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setSelectedCategory(null);
    if (text.trim()) {
      const found = searchFoods(text);
      const customMatches = customFoods.filter((f) =>
        f.name.toLowerCase().includes(text.toLowerCase())
      );
      setResults([...customMatches, ...found]);
    } else {
      setResults(FOOD_DATABASE.slice(0, 20));
    }
  }, [customFoods]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat === selectedCategory ? null : cat);
    setQuery("");
    if (cat === selectedCategory) {
      setResults(FOOD_DATABASE.slice(0, 20));
    } else {
      setResults(FOOD_DATABASE.filter((f) => f.category === cat));
    }
  };

  const handleSelectFood = (food: FoodItem) => {
    router.push({
      pathname: "/food-detail",
      params: { foodId: food.id, mealType, date, isCustom: (food as CustomFood).isCustom ? "1" : "0" },
    });
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <Pressable
      onPress={() => handleSelectFood(item)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        backgroundColor: pressed ? colors.surface : colors.background,
      })}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
          {item.name}
          {(item as CustomFood).isCustom && (
            <Text style={{ fontSize: 11, color: colors.primary }}> (Custom)</Text>
          )}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          {item.category} · {item.defaultServing}g serving
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.accent }}>
          {Math.round(item.calories * item.defaultServing / 100)} kcal
        </Text>
        <Text style={{ fontSize: 11, color: colors.muted }}>
          P:{Math.round(item.protein * item.defaultServing / 100)}g C:{Math.round(item.carbs * item.defaultServing / 100)}g F:{Math.round(item.fat * item.defaultServing / 100)}g
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
            Add to {mealType}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (!isPremium) { triggerPaywall("barcode_scanner", router); return; }
            trackFeatureUsed("barcode_scanner", "paid");
            router.push({ pathname: "/barcode-scanner", params: { mealType, date } });
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <View style={{ position: "relative" }}>
            <IconSymbol name="barcode.viewfinder" size={26} color={isPremium ? colors.primary : colors.muted} />
            {!isPremium && (
              <Text style={{ position: "absolute", top: -4, right: -4, fontSize: 10 }}>🔒</Text>
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!isPremium) { triggerPaywall("custom_food", router); return; }
            trackFeatureUsed("custom_food", "paid");
            router.push({ pathname: "/custom-food", params: { mealType, date } });
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: isPremium ? colors.primary : colors.muted }}>
            {isPremium ? "+ Custom" : "🔒 Custom"}
          </Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          margin: 16,
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Search foods..."
          placeholderTextColor={colors.muted}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 8,
            fontSize: 16,
            color: colors.foreground,
          }}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => handleSearch("")}>
            <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Category Chips */}
      <FlatList
        horizontal
        data={FOOD_CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleCategorySelect(item)}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: selectedCategory === item ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: selectedCategory === item ? colors.primary : colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: selectedCategory === item ? "#fff" : colors.foreground,
              }}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />

      {/* Recent Foods Section (when no query) */}
      {!query && !selectedCategory && recentFoods.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.muted,
              paddingHorizontal: 16,
              paddingBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Recent
          </Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderFoodItem}
        ListHeaderComponent={
          !query && !selectedCategory && recentFoods.length > 0 ? (
            <View>
              {recentFoods.map((food) => (
                <View key={food.id}>{renderFoodItem({ item: food })}</View>
              ))}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.muted,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  backgroundColor: colors.surface,
                }}
              >
                All Foods
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 48 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              No foods found
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
              Try a different search or add a custom food
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}
