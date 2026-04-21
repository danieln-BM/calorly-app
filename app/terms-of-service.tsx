import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TermsOfServiceScreen() {
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Terms of Service</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>
          Last updated: April 5, 2026
        </Text>

        {[
          {
            title: "1. Acceptance of Terms",
            body: "By downloading, installing, or using Calorly ('the App'), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.",
          },
          {
            title: "2. Description of Service",
            body: "Calorly is a calorie and nutrition tracking application designed to help users monitor their dietary intake and physical activity. The App provides tools for logging food, tracking exercise, monitoring weight, and visualizing nutrition data.",
          },
          {
            title: "3. Not Medical Advice",
            body: "THE APP IS NOT A MEDICAL DEVICE AND DOES NOT PROVIDE MEDICAL ADVICE. The information provided through the App is for general informational and wellness purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.\n\nAlways seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or dietary changes.",
          },
          {
            title: "4. User Responsibilities",
            body: "You are responsible for:\n\n• Providing accurate information about yourself\n• Using the App in a safe and responsible manner\n• Consulting healthcare professionals before making significant dietary or exercise changes\n• Ensuring the App is appropriate for your health condition\n• Keeping your device secure",
          },
          {
            title: "5. Limitation of Liability",
            body: "To the maximum extent permitted by law, Calorly shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the App. The App is provided 'as is' without warranties of any kind.",
          },
          {
            title: "6. Accuracy of Information",
            body: "While we strive to provide accurate nutritional information, we cannot guarantee the accuracy, completeness, or reliability of any nutritional data in the App. Calorie and nutrient values are estimates and may vary based on preparation methods, brands, and individual food items.",
          },
          {
            title: "7. Intellectual Property",
            body: "All content, features, and functionality of the App are owned by Calorly and are protected by applicable intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the App.",
          },
          {
            title: "8. Modifications",
            body: "We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the modified Terms.",
          },
          {
            title: "9. Governing Law",
            body: "These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.",
          },
          {
            title: "10. Contact",
            body: "For questions about these Terms, contact us at:\n\nsupport@calorly.app",
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
