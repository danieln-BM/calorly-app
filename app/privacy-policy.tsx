import React from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function PrivacyPolicyScreen() {
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>
          Last updated: April 5, 2026
        </Text>

        {[
          {
            title: "1. Introduction",
            body: "Calorly ('we', 'our', or 'us') is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.",
          },
          {
            title: "2. Information We Collect",
            body: "Calorly stores all data locally on your device. We collect and store:\n\n• Personal profile information (name, age, height, weight, gender)\n• Food and nutrition logs\n• Exercise logs\n• Weight entries\n• Water intake records\n• App preferences and settings\n\nThis data is stored exclusively on your device using AsyncStorage and is never transmitted to our servers.",
          },
          {
            title: "3. How We Use Your Information",
            body: "All information you enter is used solely to:\n\n• Calculate your personalized calorie and nutrition goals\n• Display your daily nutrition and exercise logs\n• Show your progress over time\n• Provide personalized recommendations\n\nWe do not sell, trade, or transfer your personal information to third parties.",
          },
          {
            title: "4. Data Storage and Security",
            body: "Your data is stored locally on your device. We do not have access to your personal data. You are responsible for the security of your device. If you delete the app, all locally stored data will be permanently deleted.",
          },
          {
            title: "5. Health Information",
            body: "Calorly collects health-related information such as weight, height, and dietary intake. This information is used only to provide app functionality and is never shared with third parties. We do not use this information for advertising purposes.",
          },
          {
            title: "6. Children's Privacy",
            body: "Calorly is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.",
          },
          {
            title: "7. Your Rights",
            body: "You have the right to:\n\n• Access your data (all data is visible within the app)\n• Correct your data (editable within the app)\n• Delete your data (use 'Clear All Data' in Profile settings)\n• Export your data (contact us for assistance)",
          },
          {
            title: "8. Third-Party Services",
            body: "Calorly is a privacy-first app with no analytics, advertising, or tracking services. The app stores all personal data locally on your device.\n\nThe only external network request Calorly makes is when you use the Barcode Scanner feature. When you scan a product barcode, the barcode number (e.g. '0123456789012') is sent to the Open Food Facts database (world.openfoodfacts.org) to retrieve publicly available nutrition information. No personal data, account information, or health data is ever transmitted. Open Food Facts is a free, open-source food database. You can review their privacy policy at https://world.openfoodfacts.org/privacy.\n\nIf you do not use the Barcode Scanner feature, no network requests are made.",
          },
          {
            title: "9. Changes to This Policy",
            body: "We may update this Privacy Policy from time to time. We will notify you of any changes by updating the 'Last updated' date. Continued use of the app after changes constitutes acceptance of the updated policy.",
          },
          {
            title: "10. Contact Us",
            body: "If you have questions about this Privacy Policy, please contact us at:\n\nsupport@calorly.app",
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
