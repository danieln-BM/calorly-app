/**
 * ATT Pre-Prompt Modal
 *
 * Shown BEFORE the native iOS App Tracking Transparency dialog.
 * Purpose: prime the user with context so they understand WHY we're asking,
 * which significantly increases opt-in rates (~40-50% vs ~25% cold).
 *
 * Timing: shown after onboarding completes, before the paywall.
 * This is the optimal moment — the user is engaged and has invested time
 * in the app, so they're more likely to trust it.
 *
 * After the user taps either button, the native ATT dialog fires immediately.
 * We then track the result (granted/denied) and proceed to the paywall.
 */

import { Modal, Pressable, Text, View } from "react-native";
import { Platform } from "react-native";

// Lazy-load expo-tracking-transparency — the native module is only available
// in a development build / production build, NOT in Expo Go or web.
// Importing it at the top level crashes Expo Go with "Cannot find native module 'ExpoTrackingTransparency'".
async function requestATTPermission(): Promise<"granted" | "denied" | "unavailable"> {
  if (Platform.OS !== "ios") return "unavailable";
  try {
    const { requestTrackingPermissionsAsync } = await import("expo-tracking-transparency");
    const { status } = await requestTrackingPermissionsAsync();
    return status === "granted" ? "granted" : "denied";
  } catch {
    // Native module not available (Expo Go, web, Android)
    return "unavailable";
  }
}
import { useColors } from "@/hooks/use-colors";
import { trackAttGranted, trackAttDenied, trackAttPromptShown } from "@/lib/singular";
import { trackPermissionResult } from "@/lib/analytics";

interface AttPrePromptProps {
  visible: boolean;
  onComplete: () => void;
}

export function AttPrePrompt({ visible, onComplete }: AttPrePromptProps) {
  const colors = useColors();

  const handleContinue = async () => {
    try {
      const result = await requestATTPermission();
      const granted = result === "granted";

      // Track in both Firebase and Singular (skip if unavailable — Expo Go / web)
      if (result !== "unavailable") {
        await trackPermissionResult("att", granted);
        if (granted) {
          await trackAttGranted();
        } else {
          await trackAttDenied();
        }
      }
    } catch {
      // Never block the user flow on ATT failure
    }

    onComplete();
  };

  // Track when the pre-prompt becomes visible
  const handleVisible = () => {
    if (visible) {
      trackAttPromptShown();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={handleVisible}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 28,
            paddingBottom: 40,
            gap: 16,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 32 }}>🎯</Text>
          </View>

          {/* Headline */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            Help Us Improve Calorly
          </Text>

          {/* Body */}
          <Text
            style={{
              fontSize: 15,
              color: colors.muted,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            On the next screen, iOS will ask if Calorly can use your device's advertising
            identifier.
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: colors.muted,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Allowing this helps us show you more relevant content and understand which features
            matter most. Your nutrition data is{" "}
            <Text style={{ fontWeight: "700", color: colors.foreground }}>never shared</Text> with
            advertisers.
          </Text>

          {/* Benefit bullets */}
          <View style={{ gap: 8, marginVertical: 4 }}>
            {[
              "🔒  Your nutrition data stays private",
              "🎯  More relevant app experience",
              "📊  Helps us build better features",
            ].map((item) => (
              <Text
                key={item}
                style={{
                  fontSize: 14,
                  color: colors.foreground,
                  lineHeight: 20,
                }}
              >
                {item}
              </Text>
            ))}
          </View>

          {/* CTA */}
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              marginTop: 8,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Continue</Text>
          </Pressable>

          {/* Skip link */}
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, alignItems: "center" })}
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>Not Now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
