import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { FOOD_DATABASE, FoodItem } from "@/lib/food-database";
import {
  addFoodLogEntry,
  calculateNutritionForServing,
  loadCustomFoods,
  getTodayString,
  MealType,
  MEAL_TYPES,
} from "@/lib/store";

function NutritionRow({ label, value, unit, bold }: { label: string; value: number; unit: string; bold?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontSize: bold ? 15 : 14, fontWeight: bold ? "700" : "400", color: colors.foreground }}>
        {label}
      </Text>
      <Text style={{ fontSize: bold ? 15 : 14, fontWeight: bold ? "700" : "600", color: colors.foreground }}>
        {value}{unit}
      </Text>
    </View>
  );
}

export default function FoodDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ foodId: string; mealType: string; date: string; isCustom: string; scannedFood: string }>();
  const mealType = (params.mealType || "Breakfast") as MealType;
  const date = params.date || getTodayString();

  const [food, setFood] = useState<FoodItem | null>(null);
  const [servingGrams, setServingGrams] = useState("100");
  const [selectedMeal, setSelectedMeal] = useState<MealType>(mealType);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadFood();
  }, []);

  const loadFood = async () => {
    // Handle scanned food from barcode scanner (passed as JSON)
    if (params.scannedFood) {
      try {
        const scanned = JSON.parse(params.scannedFood) as FoodItem;
        setFood(scanned);
        setServingGrams(scanned.defaultServing.toString());
        return;
      } catch {}
    }
    let found = FOOD_DATABASE.find((f) => f.id === params.foodId);
    if (!found) {
      const custom = await loadCustomFoods();
      found = custom.find((f) => f.id === params.foodId);
    }
    if (found) {
      setFood(found);
      setServingGrams(found.defaultServing.toString());
    }
  };

  if (!food) {
    return (
      <ScreenContainer>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Food Details</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>Food Not Found</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 }}>We couldn’t load the nutrition data for this item.</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const grams = parseFloat(servingGrams) || 0;
  const nutrition = calculateNutritionForServing(food, grams);

  const handleAdd = async () => {
    if (grams <= 0) {
      Alert.alert("Invalid Serving", "Please enter a valid serving size.");
      return;
    }
    setAdding(true);
    await addFoodLogEntry({
      foodId: food.id,
      foodName: food.name,
      mealType: selectedMeal,
      servingGrams: grams,
      servingUnit: `${grams}g`,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      sugar: nutrition.sugar,
      sodium: nutrition.sodium,
      date,
    });
    setAdding(false);
    // Navigate back to the main tabs — using back() twice was fragile depending on entry path
    router.dismissAll();
  };

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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
          {food.name}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Food Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>{food.name}</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>{food.category}</Text>
        </View>

        {/* Serving Size */}
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
            Serving Size
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable
              onPress={() => setServingGrams((v) => Math.max(1, (parseFloat(v) || 0) - 10).toString())}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <IconSymbol name="minus" size={18} color={colors.foreground} />
            </Pressable>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                value={servingGrams}
                onChangeText={setServingGrams}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.foreground,
                  textAlign: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <Text style={{ fontSize: 16, color: colors.muted, fontWeight: "600" }}>grams</Text>
            </View>
            <Pressable
              onPress={() => setServingGrams((v) => ((parseFloat(v) || 0) + 10).toString())}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <IconSymbol name="plus" size={18} color="#fff" />
            </Pressable>
          </View>
          {/* Quick serving buttons - deduplicate in case defaultServing equals one of the presets */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            {Array.from(new Set([food.defaultServing, 100, 150, 200])).map((s) => (
              <Pressable
                key={`serving-${s}`}
                onPress={() => setServingGrams(s.toString())}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: parseFloat(servingGrams) === s ? colors.primary : colors.background,
                  borderWidth: 1,
                  borderColor: parseFloat(servingGrams) === s ? colors.primary : colors.border,
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: parseFloat(servingGrams) === s ? "#fff" : colors.foreground,
                  }}
                >
                  {s}g
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Calorie Display */}
        <View
          style={{
            backgroundColor: colors.primary + "15",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.primary + "40",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 48, fontWeight: "900", color: colors.primary }}>
            {nutrition.calories}
          </Text>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "600" }}>Calories</Text>
        </View>

        {/* Macro Summary */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {[
            { label: "Protein", value: nutrition.protein, color: colors.protein },
            { label: "Carbs", value: nutrition.carbs, color: colors.carbs },
            { label: "Fat", value: nutrition.fat, color: colors.fat },
          ].map((m) => (
            <View
              key={m.label}
              style={{
                flex: 1,
                backgroundColor: m.color + "15",
                borderRadius: 12,
                padding: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: m.color + "40",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800", color: m.color }}>{m.value}g</Text>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Nutrition Facts */}
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
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
            Nutrition Facts
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
            Per {grams}g serving
          </Text>
          <View style={{ borderTopWidth: 2, borderTopColor: colors.foreground, paddingTop: 8 }}>
            <NutritionRow label="Calories" value={nutrition.calories} unit=" kcal" bold />
            <NutritionRow label="Total Fat" value={nutrition.fat} unit="g" bold />
            <NutritionRow label="Total Carbohydrate" value={nutrition.carbs} unit="g" bold />
            {nutrition.fiber !== undefined && <NutritionRow label="  Dietary Fiber" value={nutrition.fiber} unit="g" />}
            {nutrition.sugar !== undefined && <NutritionRow label="  Total Sugars" value={nutrition.sugar} unit="g" />}
            <NutritionRow label="Protein" value={nutrition.protein} unit="g" bold />
            {nutrition.sodium !== undefined && <NutritionRow label="Sodium" value={nutrition.sodium} unit="mg" />}
          </View>
        </View>

        {/* Meal Selector */}
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
            Add to Meal
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {MEAL_TYPES.map((meal) => (
              <Pressable
                key={meal}
                onPress={() => setSelectedMeal(meal)}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: selectedMeal === meal ? colors.primary : colors.background,
                  borderWidth: 1,
                  borderColor: selectedMeal === meal ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: selectedMeal === meal ? "#fff" : colors.foreground,
                  }}
                >
                  {meal}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleAdd}
          disabled={adding}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            opacity: pressed || adding ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
            {adding ? "Adding..." : `Add to ${selectedMeal}`}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
