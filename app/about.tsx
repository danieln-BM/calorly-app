import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function AboutScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer>
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
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>About Calorly</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* App Logo & Version */}
        <View style={{ alignItems: "center", paddingVertical: 32 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 52 }}>🥗</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: "900", color: colors.foreground }}>Calorly</Text>
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 4 }}>Version 1.0.0</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            Your personal nutrition and calorie tracking companion
          </Text>
        </View>

        {/* Features */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
            Features
          </Text>
          {[
            { icon: "🍎", title: "Food Logging", desc: "Log meals across Breakfast, Lunch, Dinner, and Snacks" },
            { icon: "🏃", title: "Exercise Tracking", desc: "Track workouts and calories burned" },
            { icon: "📊", title: "Progress Charts", desc: "Visualize your calorie trends and weight progress" },
            { icon: "💧", title: "Water Tracking", desc: "Monitor daily hydration" },
            { icon: "⚖️", title: "Weight Log", desc: "Track weight changes over time" },
            { icon: "🎯", title: "Smart Goals", desc: "Personalized calorie and macro goals using Mifflin-St Jeor" },
            { icon: "🔒", title: "Private & Offline", desc: "All data stored locally on your device" },
          ].map((feature) => (
            <View
              key={feature.title}
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 }}
            >
              <Text style={{ fontSize: 22, marginTop: 1 }}>{feature.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{feature.title}</Text>
                <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Data Sources */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Nutrition Data
          </Text>
          <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
            Nutritional information in Calorly is based on standard food composition databases and general nutritional references. Values are estimates and may vary. The Mifflin-St Jeor equation is used to calculate Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE).
          </Text>
        </View>

        {/* Disclaimer */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20, textAlign: "center" }}>
            Calorly is for informational and wellness purposes only. It is not a medical device and does not provide medical advice. Always consult a qualified healthcare professional before making significant changes to your diet or exercise routine.
          </Text>
        </View>

        <Text style={{ textAlign: "center", fontSize: 12, color: colors.muted, marginTop: 24 }}>
          © 2026 Calorly. All rights reserved.{"\n"}
          support@calorly.app
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
