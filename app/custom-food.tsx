import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-provider";
import { saveCustomFood, MealType } from "@/lib/store";

export default function CustomFoodScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPremium, triggerPaywall } = useSubscription();
  const params = useLocalSearchParams<{ mealType: string; date: string }>();

  // Gate: redirect non-premium users to paywall
  React.useEffect(() => {
    if (!isPremium) {
      triggerPaywall("custom_food", router);
    }
  }, [isPremium]);

  const [form, setForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    sodium: "",
    defaultServing: "100",
    servingUnit: "100g",
    category: "Custom",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Missing Name", "Please enter a food name.");
      return;
    }
    if (!form.calories || isNaN(parseFloat(form.calories))) {
      Alert.alert("Missing Calories", "Please enter calorie information.");
      return;
    }

    setSaving(true);
    const food = await saveCustomFood({
      name: form.name.trim(),
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      fiber: form.fiber ? parseFloat(form.fiber) : undefined,
      sodium: form.sodium ? parseFloat(form.sodium) : undefined,
      defaultServing: parseFloat(form.defaultServing) || 100,
      servingUnit: form.servingUnit || "100g",
      category: "Custom",
    });
    setSaving(false);

    router.push({
      pathname: "/food-detail",
      params: {
        foodId: food.id,
        mealType: params.mealType || "Breakfast",
        date: params.date || new Date().toISOString().split("T")[0],
        isCustom: "1",
      },
    });
  };

  const field = (
    label: string,
    key: keyof typeof form,
    placeholder: string,
    unit?: string,
    numeric = true
  ) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
        {label}
        {unit && <Text style={{ color: colors.muted, fontWeight: "400" }}> ({unit})</Text>}
      </Text>
      <TextInput
        value={form[key]}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={numeric ? "numeric" : "default"}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          fontSize: 16,
          color: colors.foreground,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      />
    </View>
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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: colors.foreground }}>
          Create Custom Food
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20, lineHeight: 18 }}>
            Enter the nutrition information per 100g (or your preferred serving size).
          </Text>

          {field("Food Name *", "name", "e.g. Homemade Granola", undefined, false)}
          {field("Calories *", "calories", "e.g. 350", "kcal per 100g")}
          {field("Protein", "protein", "e.g. 10", "g per 100g")}
          {field("Carbohydrates", "carbs", "e.g. 45", "g per 100g")}
          {field("Fat", "fat", "e.g. 12", "g per 100g")}
          {field("Fiber", "fiber", "e.g. 3", "g per 100g")}
          {field("Sodium", "sodium", "e.g. 200", "mg per 100g")}
          {field("Default Serving", "defaultServing", "e.g. 100", "grams")}
          {field("Serving Unit Label", "servingUnit", "e.g. 1 cup (100g)", undefined, false)}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
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
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            opacity: pressed || saving ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
            {saving ? "Saving..." : "Save & Add to Log"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
