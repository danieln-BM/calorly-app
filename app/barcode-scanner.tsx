import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { lookupBarcode } from "@/lib/open-food-facts";
import {
  trackPermissionResult,
  trackFeatureUsed,
  trackCriticalError,
} from "@/lib/analytics";
import { useSubscription } from "@/lib/subscription-provider";


const SCREEN_WIDTH = Dimensions.get("window").width;
const VIEWFINDER_SIZE = SCREEN_WIDTH * 0.7;

type ScanState =
  | { status: "scanning" }
  | { status: "loading"; barcode: string }
  | { status: "error"; message: string; barcode: string }
  | { status: "not_found"; barcode: string };

export default function BarcodeScannerScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType: string; date: string }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>({ status: "scanning" });
  const [isCameraActive, setIsCameraActive] = useState(true);
  const { isPremium } = useSubscription();
  const userState = isPremium ? "paid" : "free" as const;

  // Unmount camera when screen is unfocused (required by expo-camera docs)
  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);
      setScanState({ status: "scanning" });
      return () => setIsCameraActive(false);
    }, [])
  );

  const handleBarcodeScan = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (scanState.status !== "scanning") return;

      // Immediately lock scanning to prevent double-fires
      setScanState({ status: "loading", barcode: data });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      let result: Awaited<ReturnType<typeof lookupBarcode>>;
      try {
        result = await lookupBarcode(data);
      } catch (err) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        trackCriticalError("barcode_network_error", "barcode_scanner", userState);
        setScanState({ status: "error", message: "Network error. Please check your connection.", barcode: data });
        return;
      }

      if (result.found && result.food) {
        // Track successful barcode scan as feature usage
        trackFeatureUsed("barcode_scanner", userState);
        // Navigate to food-detail with the scanned food data encoded as params
        router.replace({
          pathname: "/food-detail",
          params: {
            foodId: result.food.id,
            mealType: params.mealType || "Breakfast",
            date: params.date || new Date().toISOString().split("T")[0],
            // Pass full food data as JSON since it's not in the local DB
            scannedFood: JSON.stringify(result.food),
          },
        });
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setScanState({
          status: "not_found",
          barcode: data,
        });
      }
    },
    [scanState.status, params, router]
  );

  const resetScanner = () => {
    setScanState({ status: "scanning" });
  };

  // ─── Permission not yet determined ────────────────────────────────────────
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  // ─── Permission denied ────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <IconSymbol name="xmark" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Barcode Scanner
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.permissionContainer}>
          <Text style={{ fontSize: 56, marginBottom: 24 }}>📷</Text>
          <Text style={[styles.permissionTitle, { color: colors.foreground }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.permissionBody, { color: colors.muted }]}>
            Calorly needs camera access to scan food barcodes. Your camera is only used for scanning — no photos are stored.
          </Text>
          <Pressable
            onPress={async () => {
              const result = await requestPermission();
              trackPermissionResult("camera", result.granted);
            }}
            style={({ pressed }) => [
              styles.permissionButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginTop: 16 })}
          >
            <Text style={{ color: colors.muted, fontSize: 15 }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Main scanner UI ──────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      {/* Camera */}
      {isCameraActive && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
          }}
          onBarcodeScanned={scanState.status === "scanning" ? handleBarcodeScan : undefined}
        />
      )}

      {/* Dark overlay with viewfinder cutout */}
      <View style={styles.overlay}>
        {/* Top dark band */}
        <View style={[styles.overlayBand, { backgroundColor: "rgba(0,0,0,0.55)" }]} />

        {/* Middle row: dark | viewfinder | dark */}
        <View style={styles.overlayMiddle}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
          {/* Viewfinder box */}
          <View style={[styles.viewfinder, { width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE }]}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Scan line animation when scanning */}
            {scanState.status === "scanning" && (
              <View style={styles.scanLine} />
            )}
          </View>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
        </View>

        {/* Bottom dark band */}
        <View style={[styles.overlayBand, { backgroundColor: "rgba(0,0,0,0.55)", flex: 1 }]} />
      </View>

      {/* Header bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <IconSymbol name="xmark" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.topBarTitle}>Scan Barcode</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Instruction text */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Point the camera at a food barcode
        </Text>
      </View>

      {/* Status overlays */}
      {scanState.status === "loading" && (
        <View style={styles.statusOverlay}>
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color="#22C55E" style={{ marginBottom: 12 }} />
            <Text style={styles.statusTitle}>Looking up product…</Text>
            <Text style={styles.statusSubtitle}>{scanState.barcode}</Text>
          </View>
        </View>
      )}

      {scanState.status === "error" && (
        <View style={styles.statusOverlay}>
          <View style={styles.statusCard}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📡</Text>
            <Text style={styles.statusTitle}>Connection Error</Text>
            <Text style={styles.statusSubtitle}>{scanState.message}</Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <Pressable
                onPress={resetScanner}
                style={({ pressed }) => [
                  styles.statusButton,
                  { backgroundColor: "#22C55E", opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.statusButtonText}>Try Again</Text>
              </Pressable>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.statusButton,
                  { backgroundColor: "rgba(255,255,255,0.15)", opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.statusButtonText, { color: "#fff" }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {scanState.status === "not_found" && (
        <View style={styles.statusOverlay}>
          <View style={styles.statusCard}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
            <Text style={styles.statusTitle}>Product Not Found</Text>
            <Text style={styles.statusSubtitle}>
              This product isn't in the Open Food Facts database yet.
            </Text>
            <Text style={[styles.statusSubtitle, { marginTop: 4, fontSize: 11, opacity: 0.6 }]}>
              Barcode: {scanState.barcode}
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <Pressable
                onPress={resetScanner}
                style={({ pressed }) => [
                  styles.statusButton,
                  { backgroundColor: "#22C55E", opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.statusButtonText}>Try Again</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.replace({
                    pathname: "/food-search",
                    params: {
                      mealType: params.mealType || "Breakfast",
                      date: params.date || new Date().toISOString().split("T")[0],
                    },
                  })
                }
                style={({ pressed }) => [
                  styles.statusButton,
                  { backgroundColor: "rgba(255,255,255,0.15)", opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.statusButtonText, { color: "#fff" }]}>Search Manually</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = "#22C55E";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionBody: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
  },
  overlayBand: {
    height: "20%",
  },
  overlayMiddle: {
    flexDirection: "row",
    alignItems: "center",
    height: VIEWFINDER_SIZE,
  },
  viewfinder: {
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },
  scanLine: {
    position: "absolute",
    left: 8,
    right: 8,
    top: "50%",
    height: 2,
    backgroundColor: CORNER_COLOR,
    opacity: 0.8,
    borderRadius: 1,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  topBarTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  statusCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  statusTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  statusSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  statusButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: "center",
  },
  statusButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "700",
  },
});
