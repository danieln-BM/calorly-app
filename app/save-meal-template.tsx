import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  FoodLogEntry,
  MealTemplateEntry,
  loadFoodLog,
  saveMealTemplate,
  getTodayString,
} from "@/lib/store";

export default function SaveMealTemplateScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string }>();
  const date = params.date || getTodayString();

  const [templateName, setTemplateName] = useState("");
  const [foodLog, setFoodLog] = useState<FoodLogEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadTodayLog();
    }, [date])
  );

  const loadTodayLog = async () => {
    setLoading(true);
    const log = await loadFoodLog(date);
    setFoodLog(log);
    // Pre-select all by default
    setSelectedIds(new Set(log.map((e) => e.id)));
    setLoading(false);
  };

  const toggleEntry = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const name = templateName.trim();
    if (!name) {
      Alert.alert("Name Required", "Please enter a name for this template.");
      return;
    }
    const selected = foodLog.filter((e) => selectedIds.has(e.id));
    if (selected.length === 0) {
      Alert.alert("No Foods Selected", "Please select at least one food item.");
      return;
    }

    setSaving(true);
    const entries: MealTemplateEntry[] = selected.map((e) => ({
      foodId: e.foodId,
      foodName: e.foodName,
      servingGrams: e.servingGrams,
      calories: e.calories,
      protein: e.protein,
      carbs: e.carbs,
      fat: e.fat,
    }));

    await saveMealTemplate(name, entries);
    setSaving(false);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert("Template Saved! 🎉", `"${name}" saved with ${entries.length} item${entries.length !== 1 ? "s" : ""}.`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const selectedCount = selectedIds.size;
  const selectedCalories = foodLog
    .filter((e) => selectedIds.has(e.id))
    .reduce((s, e) => s + e.calories, 0);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Save as Template</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={foodLog}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={{ marginBottom: 20 }}>
                {/* Template name input */}
                <Text style={[styles.label, { color: colors.foreground }]}>Template Name</Text>
                <TextInput
                  value={templateName}
                  onChangeText={setTemplateName}
                  placeholder="e.g. My usual breakfast"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                />

                <Text style={[styles.sectionLabel, { color: colors.muted }]}>
                  SELECT FOODS FROM TODAY
                </Text>

                {foodLog.length === 0 && (
                  <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🍽️</Text>
                    <Text style={[styles.emptyText, { color: colors.muted }]}>
                      No foods logged today. Log some foods first, then come back to save them as a template.
                    </Text>
                  </View>
                )}
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <Pressable
                  onPress={() => toggleEntry(item.id)}
                  style={({ pressed }) => [
                    styles.entryRow,
                    {
                      backgroundColor: isSelected
                        ? colors.primary + "12"
                        : colors.surface,
                      borderColor: isSelected ? colors.primary + "60" : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? colors.primary : "transparent",
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <IconSymbol name="checkmark" size={12} color="#fff" />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.foodName, { color: colors.foreground }]} numberOfLines={1}>
                      {item.foodName}
                    </Text>
                    <Text style={[styles.foodMeta, { color: colors.muted }]}>
                      {item.mealType} · {item.servingGrams}g · P:{Math.round(item.protein)}g C:{Math.round(item.carbs)}g F:{Math.round(item.fat)}g
                    </Text>
                  </View>
                  <Text style={[styles.foodCalories, { color: colors.primary }]}>
                    {item.calories} kcal
                  </Text>
                </Pressable>
              );
            }}
          />

          {/* Save bar — only show when there are foods logged */}
          {foodLog.length > 0 ? (
            <View
              style={[
                styles.saveBar,
                { backgroundColor: colors.background, borderTopColor: colors.border },
              ]}
            >
              {selectedCount > 0 && (
                <Text style={[styles.saveBarMeta, { color: colors.muted }]}>
                  {selectedCount} item{selectedCount !== 1 ? "s" : ""} · {Math.round(selectedCalories)} kcal
                </Text>
              )}
              <Pressable
                onPress={handleSave}
                disabled={saving || selectedCount === 0}
                style={({ pressed }) => [
                  styles.saveButton,
                  {
                    backgroundColor: selectedCount === 0 ? colors.border : colors.primary,
                    opacity: pressed || saving ? 0.7 : 1,
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Template</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.saveBar,
                { backgroundColor: colors.background, borderTopColor: colors.border },
              ]}
            >
              <Pressable
                onPress={() => router.replace("/(tabs)/log")}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.saveButtonText}>🍽️ Go to Food Log</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  nameInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  foodName: {
    fontSize: 14,
    fontWeight: "600",
  },
  foodMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  foodCalories: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
  },
  saveBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  saveBarMeta: {
    fontSize: 12,
    textAlign: "center",
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
