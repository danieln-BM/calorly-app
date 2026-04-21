import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/lib/subscription-provider";
import {
  loadExerciseLog,
  loadProfile,
  addExerciseLogEntry,
  deleteExerciseLogEntry,
  getTodayString,
  formatDate,
  ExerciseLogEntry,
} from "@/lib/store";
import {
  EXERCISE_DATABASE,
  ExerciseItem,
  searchExercises,
  calculateCaloriesBurned,
  EXERCISE_CATEGORIES,
} from "@/lib/exercise-database";

export default function ExerciseScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isPremium, triggerPaywall } = useSubscription();
  const [currentDate, setCurrentDate] = useState(getTodayString());
  const [exerciseLog, setExerciseLog] = useState<ExerciseLogEntry[]>([]);
  const [userWeightKg, setUserWeightKg] = useState(70);
  const [showModal, setShowModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [duration, setDuration] = useState("30");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Cardio");

  const loadData = useCallback(async () => {
    const [log, profile] = await Promise.all([
      loadExerciseLog(currentDate),
      loadProfile(),
    ]);
    setExerciseLog(log);
    setUserWeightKg(profile.weightKg);
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
    if (newDate <= getTodayString()) setCurrentDate(newDate);
  };

  const handleAddExercise = async () => {
    if (!selectedExercise) return;
    const mins = parseInt(duration) || 30;
    const calories = calculateCaloriesBurned(selectedExercise.metValue, userWeightKg, mins);
    await addExerciseLogEntry({
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      category: selectedExercise.category,
      durationMinutes: mins,
      caloriesBurned: calories,
      date: currentDate,
    });
    setShowModal(false);
    setSelectedExercise(null);
    setDuration("30");
    loadData();
  };

  const handleDelete = (entry: ExerciseLogEntry) => {
    Alert.alert(
      "Delete Exercise",
      `Remove ${entry.exerciseName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteExerciseLogEntry(entry.id);
            loadData();
          },
        },
      ]
    );
  };

  const totalBurned = exerciseLog.reduce((sum, e) => sum + e.caloriesBurned, 0);
  const filteredExercises = searchQuery
    ? searchExercises(searchQuery)
    : EXERCISE_DATABASE.filter((e) => e.category === selectedCategory);

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
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
            {totalBurned > 0 ? `${totalBurned} kcal burned` : "No exercise logged"}
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

      {/* Summary Card */}
      {totalBurned > 0 && (
        <View
          style={{
            margin: 16,
            backgroundColor: colors.primary + "15",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.primary + "40",
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.primary + "25",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name="flame.fill" size={26} color={colors.primary} />
          </View>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.primary }}>{totalBurned}</Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>calories burned today</Text>
          </View>
          <View style={{ marginLeft: "auto" }}>
            <Text style={{ fontSize: 13, color: colors.muted }}>{exerciseLog.length} exercise{exerciseLog.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>
      )}

      {/* Exercise Log */}
      <FlatList
        data={exerciseLog}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          exerciseLog.length > 0 ? (
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: colors.muted,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Today's Exercises
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: colors.border,
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
                marginRight: 12,
              }}
            >
              <IconSymbol name="figure.run" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                {item.exerciseName}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                {item.durationMinutes} min · {item.category}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", marginRight: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>
                -{item.caloriesBurned}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>kcal</Text>
            </View>
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
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏃</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              No exercise logged
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center", paddingHorizontal: 32 }}>
              Tap the + button to log your workout
            </Text>
          </View>
        }
      />

      {/* Add Exercise FAB */}
      <Pressable
        onPress={() => {
          if (!isPremium) { triggerPaywall("exercise_tab", router); return; }
          setShowModal(true);
        }}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <IconSymbol name="plus" size={28} color="#fff" />
      </Pressable>

      {/* Add Exercise Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Modal Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => { setShowModal(false); setSelectedExercise(null); setSearchQuery(""); setSelectedCategory("Cardio"); }}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Text style={{ fontSize: 16, color: colors.primary }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              {selectedExercise ? "Set Duration" : "Add Exercise"}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {!selectedExercise ? (
            <View style={{ flex: 1 }}>
              {/* Search */}
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
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search exercises..."
                  placeholderTextColor={colors.muted}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                />
              </View>

              {/* Category Tabs */}
              {!searchQuery && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
                >
                  {EXERCISE_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: selectedCategory === cat ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: selectedCategory === cat ? colors.primary : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: selectedCategory === cat ? "#fff" : colors.foreground,
                        }}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setSelectedExercise(item)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      borderBottomWidth: 0.5,
                      borderBottomColor: colors.border,
                      backgroundColor: pressed ? colors.surface : colors.background,
                    })}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primary + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <IconSymbol name="figure.run" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        {item.category} · ~{calculateCaloriesBurned(item.metValue, userWeightKg, 30)} kcal/30min
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                  </Pressable>
                )}
              />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={{ alignItems: "center", marginBottom: 32 }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: colors.primary + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <IconSymbol name="figure.run" size={36} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, textAlign: "center" }}>
                  {selectedExercise.name}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                  {selectedExercise.category}
                </Text>
              </View>

              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
                Duration (minutes)
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                {[15, 30, 45, 60, 90].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d.toString())}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: "center",
                      backgroundColor: duration === d.toString() ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: duration === d.toString() ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: duration === d.toString() ? "#fff" : colors.foreground,
                      }}
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="Custom duration"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  textAlign: "center",
                  marginBottom: 24,
                }}
              />

              <View
                style={{
                  backgroundColor: colors.primary + "15",
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: colors.primary + "40",
                }}
              >
                <Text style={{ fontSize: 13, color: colors.muted }}>Estimated calories burned</Text>
                <Text style={{ fontSize: 36, fontWeight: "900", color: colors.primary }}>
                  {calculateCaloriesBurned(selectedExercise.metValue, userWeightKg, parseInt(duration) || 30)}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted }}>kcal</Text>
              </View>

              <Pressable
                onPress={handleAddExercise}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                  Log Exercise
                </Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}
