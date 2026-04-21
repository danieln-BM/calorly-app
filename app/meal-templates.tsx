import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  MealTemplate,
  MealType,
  MEAL_TYPES,
  loadMealTemplates,
  deleteMealTemplate,
  logMealTemplate,
  getTodayString,
} from "@/lib/store";

export default function MealTemplatesScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string; fromHome: string }>();
  const date = params.date || getTodayString();

  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<string | null>(null); // template id being logged

  // Modal state for meal type picker
  const [mealPickerVisible, setMealPickerVisible] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<MealTemplate | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [])
  );

  const loadTemplates = async () => {
    setLoading(true);
    const tpls = await loadMealTemplates();
    setTemplates(tpls.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  };

  const handleLogTemplate = (template: MealTemplate) => {
    setPendingTemplate(template);
    setMealPickerVisible(true);
  };

  const confirmLog = async (mealType: MealType) => {
    if (!pendingTemplate) return;
    setMealPickerVisible(false);
    setLogging(pendingTemplate.id);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await logMealTemplate(pendingTemplate, mealType, date);
    setLogging(null);
    setPendingTemplate(null);

    Alert.alert(
      "Meal Logged! 🎉",
      `${pendingTemplate.name} (${pendingTemplate.entries.length} items) added to ${mealType}.`,
      [{ text: "Great!", onPress: () => router.back() }]
    );
  };

  const handleDelete = (template: MealTemplate) => {
    Alert.alert(
      "Delete Template",
      `Delete "${template.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteMealTemplate(template.id);
            setTemplates((prev) => prev.filter((t) => t.id !== template.id));
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ]
    );
  };

  const renderTemplate = ({ item }: { item: MealTemplate }) => {
    const isLogging = logging === item.id;
    const totalProtein = item.entries.reduce((s, e) => s + e.protein, 0);
    const totalCarbs = item.entries.reduce((s, e) => s + e.carbs, 0);
    const totalFat = item.entries.reduce((s, e) => s + e.fat, 0);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Template header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "20" }]}>
            <Text style={{ fontSize: 20 }}>🍽️</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.templateName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.templateMeta, { color: colors.muted }]}>
              {item.entries.length} item{item.entries.length !== 1 ? "s" : ""} · {item.totalCalories} kcal
            </Text>
          </View>
          <Pressable
            onPress={() => handleDelete(item)}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 8 })}
          >
            <IconSymbol name="trash.fill" size={18} color={colors.error} />
          </Pressable>
        </View>

        {/* Macro summary */}
        <View style={[styles.macroRow, { borderTopColor: colors.border }]}>
          {[
            { label: "Protein", value: Math.round(totalProtein), color: colors.protein },
            { label: "Carbs", value: Math.round(totalCarbs), color: colors.carbs },
            { label: "Fat", value: Math.round(totalFat), color: colors.fat },
          ].map((m) => (
            <View key={m.label} style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: m.color }]}>{m.value}g</Text>
              <Text style={[styles.macroLabel, { color: colors.muted }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Food items preview */}
        {item.entries.slice(0, 3).map((entry, idx) => (
          <View
            key={`${item.id}-entry-${idx}`}
            style={[styles.entryRow, { borderTopColor: colors.border }]}
          >
            <Text style={[styles.entryName, { color: colors.foreground }]} numberOfLines={1}>
              {entry.foodName}
            </Text>
            <Text style={[styles.entryCalories, { color: colors.muted }]}>
              {entry.servingGrams}g · {entry.calories} kcal
            </Text>
          </View>
        ))}
        {item.entries.length > 3 && (
          <View style={[styles.entryRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.entryName, { color: colors.muted }]}>
              +{item.entries.length - 3} more item{item.entries.length - 3 !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Log button */}
        <Pressable
          onPress={() => handleLogTemplate(item)}
          disabled={isLogging}
          style={({ pressed }) => [
            styles.logButton,
            { backgroundColor: colors.primary, opacity: pressed || isLogging ? 0.7 : 1 },
          ]}
        >
          {isLogging ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <IconSymbol name="plus.circle.fill" size={18} color="#fff" />
              <Text style={styles.logButtonText}>Log This Meal</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  };

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Meal Templates</Text>
        <Pressable
          onPress={() => router.push({ pathname: "/save-meal-template", params: { date } })}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : templates.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>🍽️</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No templates yet</Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            Save a group of foods as a template to log your favourite meals in one tap.
          </Text>
          <Pressable
            onPress={() => router.push({ pathname: "/save-meal-template", params: { date } })}
            style={({ pressed }) => [
              styles.emptyButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.emptyButtonText}>Create First Template</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplate}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Meal type picker modal */}
      <Modal
        visible={mealPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMealPickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMealPickerVisible(false)}
        >
          <View
            style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Add to which meal?
            </Text>
            {pendingTemplate && (
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                {pendingTemplate.name} · {pendingTemplate.totalCalories} kcal
              </Text>
            )}
            <View style={{ gap: 10, marginTop: 16 }}>
              {MEAL_TYPES.map((meal) => {
                const icons: Record<MealType, string> = {
                  Breakfast: "☀️",
                  Lunch: "🌤️",
                  Dinner: "🌙",
                  Snacks: "🍎",
                };
                return (
                  <Pressable
                    key={meal}
                    onPress={() => confirmLog(meal)}
                    style={({ pressed }) => [
                      styles.mealPickerRow,
                      {
                        backgroundColor: pressed ? colors.primary + "20" : colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{icons[meal]}</Text>
                    <Text style={[styles.mealPickerLabel, { color: colors.foreground }]}>{meal}</Text>
                    <IconSymbol name="chevron.right" size={18} color={colors.muted} />
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => setMealPickerVisible(false)}
              style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  templateName: {
    fontSize: 16,
    fontWeight: "700",
  },
  templateMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  macroLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  entryName: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  entryCalories: {
    fontSize: 12,
  },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 12,
    borderRadius: 12,
    paddingVertical: 13,
  },
  logButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  mealPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  mealPickerLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: 16,
    alignItems: "center",
    padding: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
