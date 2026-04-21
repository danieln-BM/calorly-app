import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function HealthDisclaimerScreen() {
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Health Disclaimer</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            backgroundColor: colors.warning + "20",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.warning,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
            ⚠️ Important Health Notice
          </Text>
          <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
            Calorly is a wellness tool for general informational purposes only. It is NOT a medical device and should NOT be used to diagnose, treat, cure, or prevent any disease or health condition.
          </Text>
        </View>

        {[
          {
            title: "Not a Substitute for Medical Advice",
            body: "The information provided in Calorly is for general wellness purposes only. Always consult with a qualified healthcare professional, registered dietitian, or physician before making significant changes to your diet, exercise routine, or lifestyle — especially if you have any existing health conditions.",
          },
          {
            title: "Calorie Information",
            body: "Calorie and nutritional values provided in this app are estimates based on general food composition databases. Actual values may vary based on preparation methods, specific brands, and individual food items. The app's calculations use standard formulas (Mifflin-St Jeor equation) which are population averages and may not accurately reflect your individual metabolic rate.",
          },
          {
            title: "Eating Disorders",
            body: "If you have or suspect you have an eating disorder (including anorexia nervosa, bulimia nervosa, binge eating disorder, or other disordered eating patterns), please consult a healthcare professional before using this app. Calorie tracking may not be appropriate for everyone.",
          },
          {
            title: "Exercise Safety",
            body: "Exercise calorie burn estimates are approximations based on MET (Metabolic Equivalent of Task) values and may not accurately reflect your individual calorie expenditure. Consult a healthcare professional before beginning any new exercise program, especially if you have cardiovascular disease, diabetes, or other health conditions.",
          },
          {
            title: "Weight Loss",
            body: "Healthy weight loss is generally considered to be 0.5-1 kg (1-2 lbs) per week. Extremely low calorie diets can be dangerous. The app enforces a minimum calorie goal of 1,200 kcal/day, but individual needs vary. Consult a healthcare professional for personalized guidance.",
          },
          {
            title: "Pregnancy and Special Conditions",
            body: "This app is not designed for use during pregnancy, breastfeeding, or by individuals with specific medical conditions that affect nutritional needs. Please consult your healthcare provider for appropriate guidance.",
          },
          {
            title: "Mental Health",
            body: "Obsessive calorie tracking can negatively impact mental health for some individuals. If you find that tracking is causing anxiety, stress, or unhealthy behaviors, please consider speaking with a mental health professional.",
          },
        ].map((section) => (
          <View key={section.title} style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              {section.title}
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
