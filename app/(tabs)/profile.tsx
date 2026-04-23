import React, { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { useSubscription } from "@/lib/subscription-provider";
import {
  loadProfile,
  saveProfile,
  clearAllData,
  calculateCalorieGoal,
  calculateMacroGoals,
  calculateBMI,
  getBMICategory,
  getBMIDetail,
  calculateBMR,
  UserProfile,
  DEFAULT_PROFILE,
} from "@/lib/store";

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Lightly Active",
  moderate: "Moderately Active",
  active: "Very Active",
  very_active: "Extra Active",
};

const GOAL_LABELS: Record<string, string> = {
  lose: "Lose Weight",
  maintain: "Maintain Weight",
  gain: "Gain Weight",
};

function SettingRow({
  icon,
  label,
  value,
  onPress,
  destructive,
  rightElement,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  rightElement?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
        backgroundColor: pressed && onPress ? colors.surface : "transparent",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          color: destructive ? colors.error : colors.foreground,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      {rightElement ? (
        rightElement
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {value && <Text style={{ fontSize: 14, color: colors.muted }}>{value}</Text>}
          {onPress && <IconSymbol name="chevron.right" size={16} color={colors.muted} />}
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { isPremium, subscription, cancel, restore, triggerPaywall, openCustomerCenter } = useSubscription();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  const loadData = useCallback(async () => {
    const p = await loadProfile();
    setProfile(p);
    setEditForm({
      name: p.name,
      age: p.age,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      activityLevel: p.activityLevel,
      goal: p.goal,
      calorieGoal: p.calorieGoal,
      proteinGoal: p.proteinGoal,
      carbsGoal: p.carbsGoal,
      fatGoal: p.fatGoal,
      waterGoal: p.waterGoal,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    const updated: UserProfile = {
      ...profile,
      ...editForm,
      age: Number(editForm.age),
      heightCm: Number(editForm.heightCm),
      weightKg: Number(editForm.weightKg),
      calorieGoal: Number(editForm.calorieGoal),
      proteinGoal: Number(editForm.proteinGoal),
      carbsGoal: Number(editForm.carbsGoal),
      fatGoal: Number(editForm.fatGoal),
      waterGoal: Number(editForm.waterGoal),
    };
    await saveProfile(updated);
    setProfile(updated);
    setEditing(false);
  };

  const handleRecalculate = () => {
    const newGoal = calculateCalorieGoal(editForm);
    const macros = calculateMacroGoals(newGoal, editForm.goal || "maintain");
    setEditForm((f) => ({
      ...f,
      calorieGoal: newGoal,
      proteinGoal: macros.protein,
      carbsGoal: macros.carbs,
      fatGoal: macros.fat,
    }));
    Alert.alert(
      "Goals Updated ✅",
      `New calorie goal: ${newGoal.toLocaleString()} kcal/day\nProtein: ${macros.protein}g · Carbs: ${macros.carbs}g · Fat: ${macros.fat}g\n\nTap Save to apply these changes.`,
      [{ text: "Got it", style: "default" }]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      "Restart Onboarding",
      "This will take you back to the beginning of the setup flow. Your existing data will be kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart",
          style: "default",
          onPress: async () => {
            const current = await import("@/lib/store").then(m => m.loadProfile());
            await import("@/lib/store").then(m => m.saveProfile({ ...current, onboardingComplete: false }));
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your food logs, exercise logs, weight entries, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const bmiDetail = getBMIDetail(bmi);
  const bmr = calculateBMR(profile);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 28,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>
            {profile.name ? profile.name : "Your Profile"}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            {GOAL_LABELS[profile.goal]} · {ACTIVITY_LABELS[profile.activityLevel]}
          </Text>
          <View style={{ flexDirection: "row", gap: 20, marginTop: 16 }}>
            {[
              { label: "BMI", value: bmi.toString() },
              { label: "Goal", value: `${profile.calorieGoal} kcal` },
              { label: "Water", value: `${profile.waterGoal} cups` },
            ].map((stat) => (
              <View key={stat.label} style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.primary }}>{stat.value}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* BMR + BMI Quick Cards */}
        {!editing && (
          <View style={{ flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 16 }}>
            <Pressable
              onPress={() => router.push("/bmr-detail")}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 16,
                padding: 14,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>BMR</Text>
              <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff", marginTop: 2 }}>{bmr.toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>kcal at rest/day</Text>
              <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>Tap for breakdown →</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/bmi-detail")}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: bmiDetail.color + "18",
                borderRadius: 16,
                padding: 14,
                borderWidth: 1.5,
                borderColor: bmiDetail.color + "55",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 10, color: bmiDetail.color, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>BMI</Text>
              <Text style={{ fontSize: 22, fontWeight: "900", color: bmiDetail.color, marginTop: 2 }}>{bmi}</Text>
              <Text style={{ fontSize: 11, color: bmiDetail.color, fontWeight: "600" }}>{bmiDetail.category}</Text>
              <Text style={{ fontSize: 9, color: colors.muted, marginTop: 4 }}>Tap for gauge →</Text>
            </Pressable>
          </View>
        )}

        {/* Subscription Banner */}
        {!editing && (
          <Pressable
            onPress={() => isPremium ? null : triggerPaywall("profile_upgrade_btn", router)}
            style={({ pressed }) => ({
              marginHorizontal: 16,
              marginTop: 16,
              borderRadius: 16,
              overflow: "hidden",
              opacity: pressed && !isPremium ? 0.85 : 1,
            })}
          >
            <View
              style={{
                backgroundColor: isPremium ? colors.primary : colors.accent,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 28 }}>{isPremium ? "⭐" : "🚀"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
                  {isPremium ? "Calorly Pro" : "Upgrade to Pro"}
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
                  {isPremium
                    ? `${subscription.planId === "annual" ? "Annual" : "Monthly"} plan · Active`
                    : "Unlock unlimited logging, charts & more"}
                </Text>
              </View>
              {!isPremium && (
                <View style={{ backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Try Free</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}

        {/* Edit Profile */}
        {!editing ? (
          <>
            {/* Profile Info */}
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.muted,
                  paddingHorizontal: 16,
                  paddingBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Profile
              </Text>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  marginHorizontal: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <SettingRow icon="🎂" label="Age" value={`${profile.age} years`} />
                <SettingRow icon="📏" label="Height" value={`${profile.heightCm} cm`} />
                <SettingRow icon="⚖️" label="Weight" value={`${profile.weightKg} kg`} />
                <SettingRow icon="🏃" label="Activity" value={ACTIVITY_LABELS[profile.activityLevel]} />
                <SettingRow icon="🎯" label="Goal" value={GOAL_LABELS[profile.goal]} />
                <SettingRow
                  icon="✏️"
                  label="Edit Profile"
                  onPress={() => setEditing(true)}
                />
              </View>
            </View>

            {/* Nutrition Goals */}
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.muted,
                  paddingHorizontal: 16,
                  paddingBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Nutrition Goals
              </Text>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  marginHorizontal: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <SettingRow icon="🔥" label="Calories" value={`${profile.calorieGoal} kcal`} />
                <SettingRow icon="💪" label="Protein" value={`${profile.proteinGoal}g`} />
                <SettingRow icon="🌾" label="Carbs" value={`${profile.carbsGoal}g`} />
                <SettingRow icon="🥑" label="Fat" value={`${profile.fatGoal}g`} />
                <SettingRow icon="💧" label="Water" value={`${profile.waterGoal} cups`} />
              </View>
            </View>

            {/* Appearance */}
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.muted,
                  paddingHorizontal: 16,
                  paddingBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Appearance
              </Text>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  marginHorizontal: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <SettingRow
                  icon="🌙"
                  label="Dark Mode"
                  rightElement={
                    <Switch
                      value={colorScheme === "dark"}
                      onValueChange={(v) => setColorScheme(v ? "dark" : "light")}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  }
                />
              </View>
            </View>

            {/* Subscription Management */}
            {isPremium && (
              <View style={{ marginTop: 20 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.muted,
                    paddingHorizontal: 16,
                    paddingBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Subscription
                </Text>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    marginHorizontal: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: "hidden",
                  }}
                >
                  <SettingRow
                    icon="⭐"
                    label="Calorly Pro"
                    value={subscription.planId === "annual" ? "Annual" : "Monthly"}
                  />
                  <SettingRow
                    icon="🔄"
                    label="Manage Subscription"
                    onPress={() => openCustomerCenter()}
                  />
                </View>
              </View>
            )}

            {/* Legal */}
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.muted,
                  paddingHorizontal: 16,
                  paddingBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Legal & Support
              </Text>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  marginHorizontal: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <SettingRow
                  icon="📋"
                  label="Privacy Policy"
                  onPress={() => router.push("/privacy-policy")}
                />
                <SettingRow
                  icon="📄"
                  label="Terms of Service"
                  onPress={() => router.push("/terms-of-service")}
                />
                <SettingRow
                  icon="⚕️"
                  label="Health Disclaimer"
                  onPress={() => router.push("/health-disclaimer")}
                />
                <SettingRow
                  icon="ℹ️"
                  label="About Calorly"
                  onPress={() => router.push("/about")}
                />
                <SettingRow
                  icon="🔄"
                  label="Restore Purchases"
                  onPress={async () => {
                    const hasPremium = await restore();
                    if (hasPremium) {
                      Alert.alert("Purchases Restored", "Your subscription has been restored!");
                    } else {
                      Alert.alert("No Purchases Found", "We couldn't find any previous purchases for this account.");
                    }
                  }}
                />
              </View>
            </View>

            {/* Data */}
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: colors.muted,
                  paddingHorizontal: 16,
                  paddingBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Data
              </Text>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  marginHorizontal: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <SettingRow
                  icon="↩️"
                  label="Restart Onboarding"
                  onPress={handleResetOnboarding}
                />
                <SettingRow
                  icon="🗑️"
                  label="Clear All Data"
                  onPress={handleClearData}
                  destructive
                />
              </View>
            </View>

            <Text
              style={{
                textAlign: "center",
                fontSize: 12,
                color: colors.muted,
                marginTop: 24,
                paddingHorizontal: 20,
              }}
            >
              Calorly v1.0.0{"\n"}
              For informational purposes only. Not a substitute for medical advice.
            </Text>
          </>
        ) : (
          /* Edit Form */
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground, marginBottom: 20 }}>
              Edit Profile
            </Text>

            {[
              { label: "Name", key: "name" as const, numeric: false },
              { label: "Age", key: "age" as const, numeric: true },
              { label: "Height (cm)", key: "heightCm" as const, numeric: true },
              { label: "Weight (kg)", key: "weightKg" as const, numeric: true },
              { label: "Calorie Goal (kcal)", key: "calorieGoal" as const, numeric: true },
              { label: "Protein Goal (g)", key: "proteinGoal" as const, numeric: true },
              { label: "Carbs Goal (g)", key: "carbsGoal" as const, numeric: true },
              { label: "Fat Goal (g)", key: "fatGoal" as const, numeric: true },
              { label: "Water Goal (cups)", key: "waterGoal" as const, numeric: true },
            ].map((f) => (
              <View key={f.key} style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  {f.label}
                </Text>
                <TextInput
                  value={editForm[f.key]?.toString() || ""}
                  onChangeText={(v) => setEditForm((prev) => ({ ...prev, [f.key]: f.numeric ? v : v }))}
                  keyboardType={f.numeric ? "numeric" : "default"}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 16,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
              </View>
            ))}

            <Pressable
              onPress={handleRecalculate}
              style={({ pressed }) => ({
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.primary,
                marginBottom: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
                Recalculate Goals from Profile
              </Text>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => { setEditing(false); loadData(); }}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => ({
                  flex: 2,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
